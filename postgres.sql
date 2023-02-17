--
-- PostgreSQL database dump
--

-- Dumped from database version 13.10 (Debian 13.10-1.pgdg110+1)
-- Dumped by pg_dump version 15.2 (Debian 15.2-1.pgdg110+1)

-- Started on 2023-02-16 22:11:25 EST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 16767)
-- Name: coretek; Type: SCHEMA; Schema: -; Owner: audit
--

CREATE SCHEMA coretek;


ALTER SCHEMA coretek OWNER TO audit;

--
-- TOC entry 9 (class 2615 OID 35712)
-- Name: drive_r2; Type: SCHEMA; Schema: -; Owner: audit
--

CREATE SCHEMA drive_r2;


ALTER SCHEMA drive_r2 OWNER TO audit;

--
-- TOC entry 8 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 3 (class 3079 OID 17647)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3671 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 17633)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3672 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 445 (class 1255 OID 35491)
-- Name: _get_audit_fields(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek._get_audit_fields(aid bigint) RETURNS TABLE(field_name character varying, vvalues text[])
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT acf.label as field_name, array_agg(CASE WHEN acr.numval IS NOT NULL THEN acr.numval::text
		WHEN acr.boolean IS NOT NULL THEN acr.boolean::text
		WHEN acr.pre_defined_field_values_id IS NOT NULL THEN pdfv.string_value::text
		WHEN acr.stringval IS NOT NULL THEN acr.stringval::text
		ELSE ''
	END) AS values
	FROM coretek.audit_class_record acr
	INNER JOIN coretek.audit a ON acr.audit_id = a.id
	AND a.date_placed = acr.audit_datetime_placed
	INNER JOIN coretek.audit_class_fields acf ON acr.audit_class_field_id = acf.id
	AND acr.audit_class_field_audit_classid = acf.audit_class_id
	LEFT JOIN coretek.pre_defined_field_values pdfv ON pdfv.id = acr.pre_defined_field_values_id
	WHERE acr.audit_id = aid
	AND a.last_active = true
	GROUP BY acf.label
	ORDER BY acf.label;
END
$$;


ALTER FUNCTION coretek._get_audit_fields(aid bigint) OWNER TO audit;

--
-- TOC entry 446 (class 1255 OID 35493)
-- Name: _get_audit_options(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek._get_audit_options(aid bigint) RETURNS TABLE(options character varying[])
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT array_agg(ina.name) AS options
	FROM coretek.audit a
	INNER JOIN coretek.audit_issues ai ON a.id = ai.audit_id
	AND a.date_placed = ai.audit_date_placed
	INNER JOIN coretek.issue_name ina ON ai.issue_name_id = ina.id
	WHERE a.id = aid
	AND a.last_active = true;
END
$$;


ALTER FUNCTION coretek._get_audit_options(aid bigint) OWNER TO audit;

--
-- TOC entry 428 (class 1255 OID 35457)
-- Name: _get_audit_quantity_available(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek._get_audit_quantity_available(aid bigint) RETURNS TABLE(qtt_audit integer, notes character varying, fmv numeric, class_name character varying, qtt_all_orders integer)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 1
    AS $$
BEGIN 
	RETURN QUERY
	SELECT au.quantity,
	au.notes,
	au.fmv,
	ac.name AS class_name,
	(SELECT SUM(oreq.quantity)::integer AS qtt_in_order
	 	FROM coretek.order_requested oreq
	 	INNER JOIN coretek.orders o ON oreq.order_id = o.id
	 	AND o.datetime_modified = oreq.order_datetime_modified
		WHERE oreq.audit_id = aid
	 	AND o.last_valid = true
	)
	FROM coretek.audit au
	INNER JOIN coretek.audit_class ac ON au.audit_class_id = ac.id
	WHERE aid = au.id
	AND au.last_active = true
	LIMIT 1;
END
$$;


ALTER FUNCTION coretek._get_audit_quantity_available(aid bigint) OWNER TO audit;

--
-- TOC entry 451 (class 1255 OID 35115)
-- Name: audit_add_new(integer, integer, bigint, integer, integer, character varying, jsonb, integer[]); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.audit_add_new(vuserid integer, vauditid integer, vjobid bigint, vclass integer, vquantity integer, vnotes character varying, vfields jsonb, voptions integer[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE 
	auditid integer;
	i jsonb;
    boolval boolean;
    intval integer;
    numericval numeric;
	fieldtype integer;
    textval character varying;
	vdatetime timestamp without time zone := NOW();

BEGIN 
	IF NOT EXISTS(SELECT id FROM coretek.audit WHERE id = vauditid) THEN
        FOR i IN SELECT * FROM jsonb_array_elements(vfields) LOOP
            IF ((i -> 'v_field')::smallint != (SELECT coretek.audit_get_field_type((i -> 'v_id')::smallint))) THEN
               RAISE NOTICE 'Form Modification Error';
               RETURN 1;
            END IF;
        END LOOP;
    
		INSERT INTO coretek.audit ("id", 
								   auditer_id, 
								   editer_id,
								   job_id, 
								   audit_class_id, 
								   quantity,
								   notes,
								   date_placed,
								   last_active)
		VALUES (vauditid, vuserid, vuserid, vjobid, vclass, vquantity, vnotes,  vdatetime, true)
		RETURNING "id" INTO auditid;
		
        FOR i IN SELECT * FROM jsonb_array_elements(vfields) LOOP 
            IF ((i -> 'v_field')::integer = 1) THEN
                FOR boolval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    INSERT INTO coretek.audit_class_record
                        (audit_id, audit_datetime_placed, audit_class_field_id, boolean, audit_class_field_audit_classid)
                        VALUES (vauditid::bigint, 
                                vdatetime::timestamp without time zone, 
                                (i -> 'v_id')::integer,
                                boolval, 
                                vclass::integer);
                END LOOP;
            ELSEIF ((i -> 'v_field')::numeric = 2) THEN
                FOR intval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    IF intval > 0 THEN
                        INSERT INTO coretek.audit_class_record
                            (audit_id, audit_datetime_placed, audit_class_field_id, pre_defined_field_values_id, audit_class_field_audit_classid)
                            VALUES (vauditid::bigint, 
                                    vdatetime::timestamp without time zone, 
                                    (i -> 'v_id')::integer,
                                    intval::integer, 
                                    vclass::integer)
                        ON CONFLICT DO NOTHING;
                    END IF;
                END LOOP;
            ELSEIF ((i -> 'v_field')::integer = 3) THEN
                FOR textval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    INSERT INTO coretek.audit_class_record
                        (audit_id, audit_datetime_placed, audit_class_field_id, stringval, audit_class_field_audit_classid)
                        VALUES (vauditid::bigint, 
                                vdatetime::timestamp without time zone, 
                                (i -> 'v_id')::integer,
                                TRIM(TRAILING '"' FROM TRIM(LEADING '"' FROM textval::character varying)), 
                                vclass::integer);
                END LOOP;
            ELSEIF ((i -> 'v_field')::numeric = 4) THEN
                FOR numericval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    INSERT INTO coretek.audit_class_record
                        (audit_id, audit_datetime_placed, audit_class_field_id, numval, audit_class_field_audit_classid)
                        VALUES (vauditid::bigint, 
                                vdatetime::timestamp without time zone, 
                                (i -> 'v_id')::integer,
                                numericval::numeric, 
                                vclass::integer);
                END LOOP;
            END IF;
            
        END LOOP;
        
        FOREACH intval IN ARRAY voptions LOOP
            IF intval > 0 THEN
                INSERT INTO coretek.audit_issues (audit_id, audit_date_placed, issue_name_id)
                VALUES (vauditid, vdatetime, intval)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
        
		RETURN 0;
	ELSE RETURN 2;
	END IF;
END
$$;


ALTER FUNCTION coretek.audit_add_new(vuserid integer, vauditid integer, vjobid bigint, vclass integer, vquantity integer, vnotes character varying, vfields jsonb, voptions integer[]) OWNER TO rafael;

--
-- TOC entry 457 (class 1255 OID 35542)
-- Name: audit_bulk_move(character varying, integer[], boolean, integer, boolean); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_bulk_move(loc_name character varying, assets integer[], force_pass boolean, user_id integer, is_admin boolean, OUT audit_id bigint[], OUT perm smallint[]) RETURNS record
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE i bigint;
		last_active_date timestamp without time zone;
		audit_permission integer;
		query_result smallint;
BEGIN 
	FOREACH i IN ARRAY assets LOOP
		
		SELECT date_placed 
		INTO last_active_date
		FROM coretek.audit
		WHERE "id" = i
		AND last_active = true;
		
		--if audit found continue
		IF last_active_date IS NOT NULL THEN
			--get order tied to the audit
			SELECT os.order_status_permission_id INTO audit_permission FROM coretek.audit a
			INNER JOIN coretek.order_requested oreq ON oreq.audit_id = a.id
			INNER JOIN coretek.orders o ON o.id = oreq.order_id
			AND o.datetime_modified = oreq.order_datetime_modified
			INNER JOIN coretek.order_status os ON os.id = o.order_status_id
			WHERE o.last_valid = true
			AND a.id = i
			LIMIT 1;
			RAISE NOTICE '%', audit_permission;
			
			IF audit_permission = 1 OR audit_permission IS NULL THEN
				SELECT coretek.audit_change_locations(loc_name, i, user_id, last_active_date) INTO query_result;
			ELSIF audit_permission = 2 THEN
				IF force_pass = TRUE THEN
					SELECT coretek.audit_change_locations(loc_name, i, user_id, last_active_date) INTO query_result;
				ELSE 
					perm = array_append(perm, 2::smallint);
					audit_id = array_append(audit_id, i);
				END IF;
 			ELSIF audit_permission = 3 THEN
				IF is_admin = TRUE AND force_pass = TRUE THEN
					SELECT coretek.audit_change_locations(loc_name, i, user_id, last_active_date) INTO query_result;
				ELSE 
					perm = array_append(perm, 3::smallint);
					audit_id = array_append(audit_id, i);
				END IF;
			ELSIF audit_permission = 4 THEN
				perm = array_append(perm, 4::smallint);
				audit_id = array_append(audit_id, i);
			END IF;
		-- if not found, add to not found list
		ELSE 
			perm = array_append(perm, 5::smallint);
			audit_id = array_append(audit_id, i);
		END IF;
		
	END LOOP;
END
$$;


ALTER FUNCTION coretek.audit_bulk_move(loc_name character varying, assets integer[], force_pass boolean, user_id integer, is_admin boolean, OUT audit_id bigint[], OUT perm smallint[]) OWNER TO audit;

--
-- TOC entry 456 (class 1255 OID 35537)
-- Name: audit_change_locations(character varying, bigint, integer, timestamp without time zone); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_change_locations(v_location character varying, v_asset bigint, v_user_id integer, v_datetime_active timestamp without time zone) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE svr_loc integer;
		location_found boolean := false;
		now_datetime timestamp without time zone := NOW();
BEGIN 
    SELECT id
	INTO svr_loc
	FROM coretek.audit_class_fields
	WHERE "label" = 'Location' 
	AND field_type_id = 3
	LIMIT 1;
    
	UPDATE coretek.audit 
	SET last_active = false 
	WHERE id = v_asset
	AND date_placed = v_datetime_active;
	
   	INSERT INTO coretek.audit (id, date_placed, auditer_id, editer_id, job_id, audit_class_id, quantity, notes, fmv, last_active)
	SELECT a.id, now_datetime, a.auditer_id, v_user_id, a.job_id, a.audit_class_id, a.quantity, a.notes, a.fmv, TRUE 
	FROM coretek.audit a
	WHERE a.id = v_asset
	AND a.date_placed = v_datetime_active;
	
	INSERT INTO coretek.audit_issues (audit_id, audit_date_placed, issue_name_id)
	SELECT v_asset, now_datetime, ai.issue_name_id
	FROM coretek.audit_issues ai
	WHERE ai.audit_id = v_asset
	AND ai.audit_date_placed = v_datetime_active;
	
	INSERT INTO coretek.audit_class_record (
		audit_id, 
		audit_datetime_placed, 
		audit_class_field_id, 
		audit_class_field_audit_classid,
		stringval,
		numval,
		boolean,
		pre_defined_field_values_id	
	)
	SELECT v_asset, 
		now_datetime, 
		acr.audit_class_field_id, 
		acr.audit_class_field_audit_classid,
		CASE WHEN svr_loc = audit_class_field_id THEN v_location ELSE acr.stringval END,
		acr.numval,
		acr.boolean,
		acr.pre_defined_field_values_id
	FROM coretek.audit_class_record acr
	WHERE acr.audit_id = v_asset
	AND acr.audit_datetime_placed = v_datetime_active;
	
	RETURN 0;
END
$$;


ALTER FUNCTION coretek.audit_change_locations(v_location character varying, v_asset bigint, v_user_id integer, v_datetime_active timestamp without time zone) OWNER TO audit;

--
-- TOC entry 321 (class 1255 OID 34713)
-- Name: audit_delete(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_delete(vid bigint) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.audit_issues
    WHERE audit_id = vid;
    DELETE FROM coretek.audit_class_record
    WHERE audit_id = vid;
    DELETE FROM coretek.audit
    WHERE id = vid;
    RETURN true;
END
$$;


ALTER FUNCTION coretek.audit_delete(vid bigint) OWNER TO audit;

--
-- TOC entry 439 (class 1255 OID 35490)
-- Name: audit_edit(integer, integer, integer, integer, character varying, jsonb, integer[]); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_edit(vuserid integer, vauditid integer, vclass integer, vquantity integer, vnotes character varying, vfields jsonb, voptions integer[]) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE 
	i jsonb;
	fieldtype smallint;
    vjobid bigint;
	vdatetime timestamp without time zone := NOW();
	dauditer_id integer;
	dreserved integer;
	dfmv numeric(8,2);
    boolval boolean;
    intval integer;
    numericval numeric;
    textval character varying;
	
BEGIN 
    IF EXISTS (SELECT id 
    FROM coretek.audit 
    WHERE id = vauditid) THEN
        FOR i IN SELECT * FROM jsonb_array_elements(vfields) LOOP
            IF ((i -> 'v_field')::smallint != (SELECT coretek.audit_get_field_type((i -> 'v_id')::smallint))) THEN
               RAISE NOTICE 'Form Modification Error';
               RETURN 1;
            END IF;
        END LOOP;
        
        UPDATE coretek.audit 
        SET last_active = false
        WHERE "id" = vauditid
        AND last_active = true
        RETURNING auditer_id,  
                  fmv,
                  job_id
        INTO dauditer_id,
             dfmv,
             vjobid;
        

        INSERT INTO coretek.audit ("id", 
                                   auditer_id,
                                   editer_id, 
                                   job_id, 
                                   audit_class_id,
                                   quantity,
                                   notes,
                                   fmv,
                                   date_placed,
                                   last_active)
        VALUES (vauditid, 
                dauditer_id, 
                vuserid, 
                vjobid,
                vclass, 
                vquantity, 
                vnotes,
                dfmv,
                vdatetime, 
                true);

        
        FOR i IN SELECT * FROM jsonb_array_elements(vfields) LOOP 
            IF ((i -> 'v_field')::integer = 1) THEN
                FOR boolval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    INSERT INTO coretek.audit_class_record
                        (audit_id, audit_datetime_placed, audit_class_field_id, boolean, audit_class_field_audit_classid)
                        VALUES (vauditid::bigint, 
                                vdatetime::timestamp without time zone, 
                                (i -> 'v_id')::integer,
                                boolval, 
                                vclass::integer);
                END LOOP;
            ELSEIF ((i -> 'v_field')::numeric = 2) THEN
                FOR intval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    IF intval > 0 THEN
                        INSERT INTO coretek.audit_class_record
                            (audit_id, audit_datetime_placed, audit_class_field_id, pre_defined_field_values_id, audit_class_field_audit_classid)
                            VALUES (vauditid::bigint, 
                                    vdatetime::timestamp without time zone, 
                                    (i -> 'v_id')::integer,
                                    intval::integer, 
                                    vclass::integer)
                        ON CONFLICT DO NOTHING;
                    END IF;
                END LOOP;
            ELSEIF ((i -> 'v_field')::integer = 3) THEN
                FOR textval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    INSERT INTO coretek.audit_class_record
                        (audit_id, audit_datetime_placed, audit_class_field_id, stringval, audit_class_field_audit_classid)
                        VALUES (vauditid::bigint, 
                                vdatetime::timestamp without time zone, 
                                (i -> 'v_id')::integer,
                                TRIM(textval::character varying , '""'), 
                                vclass::integer);
                END LOOP;
            ELSEIF ((i -> 'v_field')::numeric = 4) THEN
                FOR numericval IN (SELECT jsonb_array_elements(i -> 'v_values') element) LOOP
                    INSERT INTO coretek.audit_class_record
                        (audit_id, audit_datetime_placed, audit_class_field_id, numval, audit_class_field_audit_classid)
                        VALUES (vauditid::bigint, 
                                vdatetime::timestamp without time zone, 
                                (i -> 'v_id')::integer,
                                numericval::numeric, 
                                vclass::integer);
                END LOOP;
            END IF;
            
        END LOOP;
        
        FOREACH intval IN ARRAY voptions LOOP
            IF intval > 0 THEN
                INSERT INTO coretek.audit_issues (audit_id, audit_date_placed, issue_name_id)
                VALUES (vauditid, vdatetime, intval)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
        RETURN 0;
    
    ELSE RETURN 2;
    END IF;
END
$$;


ALTER FUNCTION coretek.audit_edit(vuserid integer, vauditid integer, vclass integer, vquantity integer, vnotes character varying, vfields jsonb, voptions integer[]) OWNER TO audit;

--
-- TOC entry 479 (class 1255 OID 44094)
-- Name: audit_get_available(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_available() RETURNS TABLE(class_name character varying, audit json)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT 
	ac.name,
	(SELECT json_agg(row_to_json(record)) FROM
		(
			SELECT 
				a.id, 
				a.quantity, 
				a.notes,
				(
					SELECT COALESCE(SUM(oreq.quantity),0) AS qtt_in_order 
					FROM coretek.order_requested oreq
					INNER JOIN coretek.orders o ON o.id = oreq.order_id
					AND oreq.order_datetime_modified = o.datetime_modified
					WHERE oreq.audit_id = a.id
					AND o.last_valid = true
				),
				(
					SELECT json_agg(row_to_json(arecord) -> '_get_audit_fields') 
				 	FROM (
						SELECT coretek._get_audit_fields(a.id)
					) AS arecord
				) AS fields,
				
				(SELECT coretek._get_audit_options(a.id)) as options
				
			FROM coretek.audit a
			WHERE ac.id = a.audit_class_id
			AND a.last_active = true
			AND a.quantity > (SELECT COALESCE(SUM(oreq.quantity),0) AS qtt_in_order 
				FROM coretek.order_requested oreq
				INNER JOIN coretek.orders o ON o.id = oreq.order_id
				AND oreq.order_datetime_modified = o.datetime_modified
				WHERE oreq.audit_id = a.id
				AND o.last_valid = true	
			)
			ORDER BY a.id
		)AS record
	)AS audits
FROM coretek.audit_class ac;
END
$$;


ALTER FUNCTION coretek.audit_get_available() OWNER TO audit;

--
-- TOC entry 385 (class 1255 OID 26287)
-- Name: audit_get_datetime_history(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_datetime_history(vid bigint) RETURNS TABLE(datetime timestamp without time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT date_placed FROM coretek.audit
	WHERE id = vid
	ORDER BY date_placed ASC
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.audit_get_datetime_history(vid bigint) OWNER TO audit;

--
-- TOC entry 440 (class 1255 OID 26294)
-- Name: audit_get_datetime_single(integer, timestamp without time zone); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_datetime_single(vid integer, vdatetime timestamp without time zone) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE		build_audit json;
			class_id smallint;
BEGIN 
	-- SELECT audit_class_id INTO class_id FROM coretek.audit WHERE id = 2;
	
	SELECT audit_class_id INTO class_id FROM coretek.audit
   	WHERE "id" = vid
   	AND date_placed = vdatetime;
	IF (class_id > 0) THEN
		SELECT json_build_object(
			'audit', (SELECT row_to_json(selected_audit) 
				FROM (SELECT au.job_id as "jobId", 
					  au.audit_class_id as "selectedClass", 
					  au.quantity, 
					  au.notes, 
					  au.date_placed as "date",
					  lca.first_name || ' ' || lca.last_name AS auditer,
					  lce.first_name || ' ' || lce.last_name AS editer,
					  cu.name || ' - ' ||
					  jname.name || ' - ' ||
					  jnumber.number || ' - ' || 
					  to_char(jnumber.date, 'MM/DD/YYYY') || ' - ' ||
					  pl.name AS name
						FROM coretek.audit au
					  	INNER JOIN coretek.login_credentials lca ON au.auditer_id = lca.id
					  	INNER JOIN coretek.login_credentials lce on au.editer_id = lce.id
					    INNER JOIN coretek.customer_job cj ON au.job_id = cj.id
						INNER JOIN coretek.login_credentials lc ON lc.id = cj.login_id
						INNER JOIN coretek.customer cu ON cj.customer_id = cu.id
						INNER JOIN coretek.job_name jname ON cj.job_name_id = jname.id
						INNER JOIN coretek.job_number jnumber ON cj.job_number_id = jnumber.id
						INNER JOIN coretek.plant_location pl ON cj.plant_id = pl.id
					  
					  WHERE au.id = vid AND au.date_placed = vdatetime
					  ) AS selected_audit),
			'fields', (SELECT json_agg(row_to_json(fields_table)) 
					   FROM (SELECT acr.audit_class_field_id as v_id, 
							 CASE WHEN (acf.field_type_id = 1) THEN
								 acr.boolean::text
								WHEN (acf.field_type_id = 2) THEN
								 acr.pre_defined_field_values_id::text
								WHEN (acf.field_type_id = 3) THEN
								 acr.stringval
								WHEN (acf.field_type_id = 4) THEN
								 acr.numval::text
							 END as val
							 FROM coretek.audit_class_record acr
							 INNER JOIN coretek.audit_class_fields acf 
							 ON acf.id = acr.audit_class_field_id
							 WHERE acr.audit_id = vid 
							 AND acr.audit_datetime_placed = vdatetime
							 AND acf.audit_class_id = class_id
							 ORDER BY acr.audit_class_field_id) AS fields_table),
			'options', (SELECT json_agg(row_to_json(audit_options))
					   FROM 
					   (SELECT ai.issue_name_id as issue_id
					   FROM coretek.audit_issues ai
					   INNER JOIN coretek.issue_name isn ON isn.id = ai.issue_name_id
					   WHERE ai.audit_date_placed = vdatetime
					   AND ai.audit_id = vid) as audit_options)
		) INTO build_audit;
		RETURN build_audit;
	ELSE RETURN '{"info": "Audit Not Found"}';
	END IF;
END
$$;


ALTER FUNCTION coretek.audit_get_datetime_single(vid integer, vdatetime timestamp without time zone) OWNER TO audit;

--
-- TOC entry 381 (class 1255 OID 26073)
-- Name: audit_get_field_type(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_field_type(vfield_type integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	SELECT field_type_id 
	INTO vfield_type
	FROM coretek.audit_class_fields
	WHERE "id" = vfield_type;
	RETURN vfield_type;
END
$$;


ALTER FUNCTION coretek.audit_get_field_type(vfield_type integer) OWNER TO audit;

--
-- TOC entry 460 (class 1255 OID 35590)
-- Name: audit_get_info_and_order(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_info_and_order(intval integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE single_audit jsonb;
		quantity_found_order integer;
		fmv numeric(17,2);
		notes character varying;
		name character varying;
BEGIN 
	SELECT SUM(orr.quantity) INTO quantity_found_order
	
	FROM coretek.order_requested orr
	WHERE orr.audit_id = intval;
	IF quantity_found_order ISNULL THEN 
		quantity_found_order = 0 ;
	END IF;
	
	SELECT jsonb_build_object(
		'order_id',
		(SELECT ARRAY(
			SELECT DISTINCT o.id
			FROM coretek.order_requested oreq
			INNER JOIN coretek.orders o ON oreq.order_id = o.id
			AND oreq.order_datetime_modified = o.datetime_modified
			WHERE o.last_valid = true
			AND oreq.audit_id = intval
		)),
		'audit_info', 
		(SELECT row_to_json(selected_audit)
			FROM 
			(SELECT DISTINCT
			 	 au.notes,
				 au.quantity,
				 ac.name AS class_name
				 FROM coretek.audit au
			 	 INNER JOIN coretek.audit_class ac ON au.audit_class_id = ac.id
 				 LEFT JOIN coretek.order_requested oreq ON oreq.audit_id = au.id
			 	 WHERE au.id = intval
			 	 AND au.last_active = true
			) AS selected_audit
		),
		'fields',
		(SELECT json_agg(row_to_json(json_fields))FROM 
			(SELECT acf.label as field_name, array_agg(CASE WHEN acr.numval IS NOT NULL THEN acr.numval::text
				WHEN acr.boolean IS NOT NULL THEN acr.boolean::text
				WHEN acr.pre_defined_field_values_id IS NOT NULL THEN pdfv.string_value::text
				WHEN acr.stringval IS NOT NULL THEN acr.stringval::text
				ELSE ''
			END) AS vvalues
			FROM coretek.audit_class_record acr
			INNER JOIN coretek.audit a ON acr.audit_id = a.id
			AND a.date_placed = acr.audit_datetime_placed
			INNER JOIN coretek.audit_class_fields acf ON acr.audit_class_field_id = acf.id
			AND acr.audit_class_field_audit_classid = acf.audit_class_id
			LEFT JOIN coretek.pre_defined_field_values pdfv ON pdfv.id = acr.pre_defined_field_values_id
			WHERE acr.audit_id = intval
			AND a.last_active = true
			GROUP BY acf.label
 			ORDER BY acf.label
 			
			) AS json_fields
		),
		'options', 
		(	
			SELECT array_agg(ina.name) 
			FROM coretek.audit a
			INNER JOIN coretek.audit_issues ai ON a.id = ai.audit_id
			AND a.date_placed = ai.audit_date_placed
			INNER JOIN coretek.issue_name ina ON ai.issue_name_id = ina.id
			WHERE a.id = intval
			AND a.last_active = true
		) 
	) INTO single_audit;
	

	RETURN single_audit;
	
END
$$;


ALTER FUNCTION coretek.audit_get_info_and_order(intval integer) OWNER TO audit;

--
-- TOC entry 384 (class 1255 OID 26266)
-- Name: audit_get_jobid(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_jobid(_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	SELECT job_id INTO _id 
	FROM coretek.audit
	WHERE "id" = _id AND last_active = true;
	RETURN _id;
END
$$;


ALTER FUNCTION coretek.audit_get_jobid(_id integer) OWNER TO audit;

--
-- TOC entry 455 (class 1255 OID 35122)
-- Name: audit_get_last_entry(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_last_entry(vid integer) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE last_audit_time timestamp without time zone;
		build_audit json;
        auditclassid integer;
        class_field_id integer;
        
BEGIN 
	SELECT date_placed, audit_class_id
    INTO last_audit_time, auditclassid
	FROM coretek.audit
	WHERE id = vid AND last_active = true
	LIMIT 1;

	IF last_audit_time IS NOT NULL THEN
		SELECT json_build_object(
			'audit', (SELECT row_to_json(last_audit) 
				FROM (SELECT au.job_id, 
					  au.audit_class_id, 
					  au.quantity, 
					  au.notes, 
					  au.date_placed,
					  cu.name || ' - ' ||
					  jname.name || ' - ' ||
					  jnumber.number || ' - ' || 
					  to_char(jnumber.date, 'MM/DD/YYYY') || ' - ' ||
					  pl.name AS v_name
						FROM coretek.audit au
					    INNER JOIN coretek.customer_job cj ON au.job_id = cj.id
						INNER JOIN coretek.login_credentials lc ON lc.id = cj.login_id
						INNER JOIN coretek.customer cu ON cj.customer_id = cu.id
						INNER JOIN coretek.job_name jname ON cj.job_name_id = jname.id
						INNER JOIN coretek.job_number jnumber ON cj.job_number_id = jnumber.id
						INNER JOIN coretek.plant_location pl ON cj.plant_id = pl.id
					  
					  WHERE au.id = vid AND au.last_active = true
					  ) AS last_audit),
			'fields', (SELECT json_agg(row_to_json(fields_table)) 
					   FROM (SELECT acr.audit_class_field_id as v_id,
							 CASE WHEN (acf.field_type_id = 1) THEN
                                acr.boolean::text
 								WHEN (acf.field_type_id = 2) THEN
 								 acr.pre_defined_field_values_id::text
 								WHEN (acf.field_type_id = 3) THEN
								 acr.stringval::text
								WHEN (acf.field_type_id = 4) THEN
								 acr.numval::text
							 END as value_arr
							 FROM coretek.audit_class_record acr
							 INNER JOIN coretek.audit_class_fields acf 
							 ON acf.id = acr.audit_class_field_id
 							 WHERE acr.audit_id = vid 
                             AND acf.audit_class_id = auditclassid
                             AND acr.audit_datetime_placed = last_audit_time
                             ORDER BY acr.audit_class_field_id) AS fields_table),
			                 
            'options', (SELECT json_agg(row_to_json(audit_options))
					   FROM 
					   (SELECT ai.issue_name_id as issue_id
					   FROM coretek.audit_issues ai
					   INNER JOIN coretek.issue_name isn ON isn.id = ai.issue_name_id
					   WHERE ai.audit_date_placed = last_audit_time
					   AND ai.audit_id = vid) as audit_options)
		) INTO build_audit;
		RETURN CONCAT('{"success":',build_audit,'}');
	ELSE RETURN '{"info": "Audit Not Found"}';
	END IF;
END
$$;


ALTER FUNCTION coretek.audit_get_last_entry(vid integer) OWNER TO audit;

--
-- TOC entry 444 (class 1255 OID 35495)
-- Name: audit_get_permission(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_permission(vid bigint) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN (
		SELECT DISTINCT(os.order_audit_permission_id) FROM coretek.orders o
		INNER JOIN coretek.order_requested oreq ON o.id = oreq.order_id
		INNER JOIN coretek.order_status os ON os.id = o.order_status_id
		WHERE o.last_valid = true
		AND oreq.audit_id = vid
		LIMIT 1
	);
END
$$;


ALTER FUNCTION coretek.audit_get_permission(vid bigint) OWNER TO audit;

--
-- TOC entry 478 (class 1255 OID 44064)
-- Name: audit_get_preset(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_get_preset(vclass integer) RETURNS TABLE(name character varying, datetime_placed timestamp without time zone, preset json, options json, preset_edit json, options_edit json)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
	DELETE FROM coretek.audit_presets ap
	WHERE ap.datetime_placed +  INTERVAL '3 days' < NOW();
	RETURN QUERY
	SELECT 
		ap.name,
		ap.datetime_placed,
		ap.preset, 
		ap.options,
		ap.preset_edit,
		ap.options_edit
	FROM coretek.audit_presets ap
	WHERE audit_class_id = vclass
	ORDER BY ap.datetime_placed DESC;
END
$$;


ALTER FUNCTION coretek.audit_get_preset(vclass integer) OWNER TO audit;

--
-- TOC entry 477 (class 1255 OID 44063)
-- Name: audit_save_preset(character varying, integer, json, json, json, json); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.audit_save_preset(vname character varying, class_id integer, vpreset json, voptions json, vpreset_edit json, voptions_edit json) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
	
	INSERT INTO coretek.audit_presets (
		name,
		audit_class_id,
		preset, 
		options, 
		preset_edit,
		options_edit
	)
	VALUES (
		vname,
		class_id,
		vpreset, 
		voptions, 
		vpreset_edit,
		voptions_edit
	);
	RETURN true;
END
$$;


ALTER FUNCTION coretek.audit_save_preset(vname character varying, class_id integer, vpreset json, voptions json, vpreset_edit json, voptions_edit json) OWNER TO rafael;

--
-- TOC entry 449 (class 1255 OID 35508)
-- Name: audit_set_fmv(jsonb); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audit_set_fmv(audits jsonb) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE arr_values jsonb;
		id_found bigint;
BEGIN 
	FOR arr_values IN SELECT * FROM jsonb_array_elements(audits) LOOP
		UPDATE coretek.audit 
		SET fmv = (arr_values -> 'fmv')::numeric(8,2)
		WHERE id = (arr_values -> 'auditId')::integer;
	END LOOP;
	RETURN 0;
END
$$;


ALTER FUNCTION coretek.audit_set_fmv(audits jsonb) OWNER TO audit;

--
-- TOC entry 459 (class 1255 OID 35589)
-- Name: audits_find(integer, jsonb, jsonb); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.audits_find(vclass integer, vfields jsonb, voptions jsonb) RETURNS TABLE(audit bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE i jsonb;      
		strval character varying;
		boolval boolean;
		intval integer;
		numval numeric(46,6);
		
		query_build character varying;
		string_query_build character varying:= '';
		add_to_query character varying;
		
		first_pass boolean := false;
		first_inner_pass boolean := false;
		multi_search boolean := false;
		
		parentesis_pass integer := 0;
		single_audit jsonb;
		audits_found integer[];
BEGIN 
    
    FOR i IN SELECT * FROM jsonb_array_elements(vfields) LOOP
		IF first_pass = false THEN
			query_build := 'SELECT DISTINCT acr.audit_id
				FROM coretek.audit_class_record acr
				INNER JOIN coretek.audit a ON a.id = acr.audit_id
				WHERE a.last_active = true AND ';
			
		ELSE
			query_build := query_build || 'AND acr.audit_id = ANY (SELECT DISTINCT acr.audit_id 
						  FROM coretek.audit_class_record acr 
						  INNER JOIN coretek.audit a ON a.id = acr.audit_id
						  WHERE a.last_active = true AND ';
		END IF;
		
        IF (vclass > 0) THEN
			query_build = query_build || 'audit_class_field_audit_classid = ' || vclass || ' AND (';
		ELSE query_build = query_build || '(';
		END IF;
		IF ((i -> 'field_id')::integer = 1) THEN
            SELECT (jsonb_array_elements(i -> 'fields'))::jsonb::text::boolean INTO boolval;
			IF boolval = true THEN
				query_build = query_build || '(acr.boolean = true AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
			ELSE 
				query_build = query_build || '(acr.boolean = false AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
			END IF;
		END IF;
		IF ((i -> 'field_id')::integer = 2) THEN
            FOR intval IN (SELECT jsonb_array_elements(i -> 'fields') element) LOOP
				IF first_inner_pass = false THEN
					first_inner_pass = true;
					string_query_build = string_query_build || '((acr.pre_defined_field_values_id = ' || intval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				ELSE 
					string_query_build = string_query_build || ' OR (acr.pre_defined_field_values_id = ' || intval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				END IF;
			END LOOP;
			query_build = query_build || string_query_build || ') ';
		END IF;
		
		IF ((i -> 'field_id')::integer = 3) THEN
            FOR strval IN (SELECT jsonb_array_elements(i -> 'fields') element) LOOP
				
				SELECT quote_literal(TRIM(TRAILING '"' FROM TRIM(LEADING '"' FROM strval))) INTO strval;
 				IF (first_inner_pass = false) THEN
					first_inner_pass = true;
 					string_query_build = string_query_build || '((acr.stringval LIKE ' || strval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				ELSE 
					string_query_build = string_query_build || ' OR (acr.stringval LIKE ' || strval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				END IF;
				
			END LOOP;
			query_build = query_build || string_query_build || ') ';
		END IF;
		
		IF ((i -> 'field_id')::integer = 4) THEN
            FOR numval IN (SELECT jsonb_array_elements(i -> 'fields') element) LOOP
				IF first_inner_pass = false THEN
					first_inner_pass = true;
					string_query_build = string_query_build || '((acr.numval = ' || numval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				ELSE 
					string_query_build = string_query_build || ' OR (acr.numval = ' || numval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				END IF;
			END LOOP;
			query_build = query_build || string_query_build || ') ';
		END IF;
		
		string_query_build = '';
		IF first_pass = false THEN
			first_pass = true;
		ELSE query_build = query_build || ') ';
		END IF;
		first_inner_pass = false;
		parentesis_pass = parentesis_pass + 1;
		
    END LOOP;
	FOR intval IN 1..parentesis_pass LOOP
		query_build = query_build || ')';
	END LOOP;
	
	RAISE NOTICE '%', query_build;
	RETURN QUERY EXECUTE query_build;
	
END
$$;


ALTER FUNCTION coretek.audits_find(vclass integer, vfields jsonb, voptions jsonb) OWNER TO audit;

--
-- TOC entry 383 (class 1255 OID 26145)
-- Name: class_add_field(character varying, character varying, integer, integer, integer, integer, boolean); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.class_add_field(vname character varying, vuuid character varying, vbox integer, vclass integer, vorder integer, vmax_entries integer, vrequired boolean) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE rid integer;
BEGIN 
    SELECT id INTO rid FROM coretek.audit_class_fields a 
    WHERE a.field_type_id = vbox AND
    a.label = INITCAP(vname);
    IF (rid > 0) THEN
        
        INSERT INTO coretek.audit_class_fields(id, audit_class_id, field_type_id, "name", "label", "order", max_entries, required)
        VALUES (rid, vclass::smallint, vbox::smallint, vuuid, INITCAP(vname), vorder::smallint, vmax_entries::smallint, vrequired)
        ON CONFLICT DO NOTHING
        RETURNING id INTO vbox;
        RETURN vbox;
    ELSE 
        INSERT INTO coretek.audit_class_fields(audit_class_id, field_type_id, "name", "label", "order", max_entries, required)
        VALUES (vclass::smallint, vbox::smallint, vuuid, INITCAP(vname), vorder::smallint, vmax_entries::smallint, vrequired)
        ON CONFLICT DO NOTHING
        RETURNING id INTO vbox;
        RETURN vbox;
    END IF;
END
$$;


ALTER FUNCTION coretek.class_add_field(vname character varying, vuuid character varying, vbox integer, vclass integer, vorder integer, vmax_entries integer, vrequired boolean) OWNER TO audit;

--
-- TOC entry 312 (class 1255 OID 26023)
-- Name: class_add_issue(integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.class_add_issue(classid integer, issueid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE vid integer := 0;
BEGIN 
	INSERT INTO coretek.class_issues (issues_id, audit_class_id)
	VALUES (issueid, classid)
	ON CONFLICT DO NOTHING
	RETURNING audit_class_id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.class_add_issue(classid integer, issueid integer) OWNER TO audit;

--
-- TOC entry 356 (class 1255 OID 17606)
-- Name: class_add_new(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.class_add_new(class_name character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE rid integer := 0;
BEGIN 
	INSERT INTO coretek.audit_class (name)
	VALUES (INITCAP(class_name))
	ON CONFLICT (name) DO NOTHING
	RETURNING id INTO rid;
	RETURN rid;
END
$$;


ALTER FUNCTION coretek.class_add_new(class_name character varying) OWNER TO audit;

--
-- TOC entry 426 (class 1255 OID 35055)
-- Name: class_add_option_field(integer, character varying, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.class_add_option_field(vid integer, vname character varying, vclass_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	INSERT INTO coretek.pre_defined_field_values (audit_class_fields_id, string_value, audit_class_fields_audit_class_id)
	VALUES (vid, vname, vclass_id)
	ON CONFLICT DO NOTHING
	RETURNING id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.class_add_option_field(vid integer, vname character varying, vclass_id integer) OWNER TO audit;

--
-- TOC entry 317 (class 1255 OID 17620)
-- Name: class_delete(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.class_delete(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.audit_class
	WHERE "id" = vid
	RETURNING "id" INTO vid;
	RETURN vid;
	
END
$$;


ALTER FUNCTION coretek.class_delete(vid integer) OWNER TO audit;

--
-- TOC entry 412 (class 1255 OID 35054)
-- Name: class_delete_field(integer, integer); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.class_delete_field(vid integer, vclass_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.audit_class_fields 
	WHERE "id" = vid AND
    audit_class_id = vclass_id
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.class_delete_field(vid integer, vclass_id integer) OWNER TO rafael;

--
-- TOC entry 403 (class 1255 OID 34704)
-- Name: class_get_fields(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.class_get_fields(class_id integer) RETURNS TABLE(v_id smallint, v_name character varying, v_field smallint, v_label character varying, v_order smallint, v_max_entries smallint, v_required boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", "name", field_type_id, "label", "order", max_entries, required FROM coretek.audit_class_fields
	WHERE audit_class_id = class_id::smallint
	ORDER BY "order"
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.class_get_fields(class_id integer) OWNER TO audit;

--
-- TOC entry 391 (class 1255 OID 34701)
-- Name: classes_get(); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.classes_get() RETURNS TABLE(v_id smallint, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT id, name FROM coretek.audit_class
	ORDER BY id
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.classes_get() OWNER TO rafael;

--
-- TOC entry 438 (class 1255 OID 35489)
-- Name: field_change_properties(integer, integer, integer, integer, boolean); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.field_change_properties(vid integer, classid integer, vorder integer, ventries integer, vrequired boolean) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
	UPDATE coretek.audit_class_fields 
	SET "order" = vorder::smallint, "max_entries" = ventries::smallint, required = vrequired
	WHERE vid::smallint = "id"
	AND audit_class_id = classid::smallint
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.field_change_properties(vid integer, classid integer, vorder integer, ventries integer, vrequired boolean) OWNER TO audit;

--
-- TOC entry 336 (class 1255 OID 25897)
-- Name: field_delete_option(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.field_delete_option(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.pre_defined_field_values
	WHERE "id" = vid
	RETURNING "id" INTO vid;
	RETURN vid;
	
END
$$;


ALTER FUNCTION coretek.field_delete_option(vid integer) OWNER TO audit;

--
-- TOC entry 427 (class 1255 OID 35056)
-- Name: field_get_values(integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.field_get_values(field_id integer, vclass_id integer) RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", string_value FROM coretek.pre_defined_field_values
	WHERE audit_class_fields_id = field_id::smallint AND
          audit_class_fields_audit_class_id = vclass_id
	ORDER BY string_value
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.field_get_values(field_id integer, vclass_id integer) OWNER TO audit;

--
-- TOC entry 450 (class 1255 OID 35519)
-- Name: get_all_permissions(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.get_all_permissions() RETURNS TABLE(v_id smallint, v_permission character varying, v_group smallint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", "name", "group"
	FROM coretek.permission_name
	ORDER BY "id";

END
$$;


ALTER FUNCTION coretek.get_all_permissions() OWNER TO audit;

--
-- TOC entry 313 (class 1255 OID 16775)
-- Name: insert_contractor(integer); Type: FUNCTION; Schema: coretek; Owner: postgres
--

CREATE FUNCTION coretek.insert_contractor(v_login_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
	INSERT INTO contractor (login_id) VALUES (v_login_id);
END
$$;


ALTER FUNCTION coretek.insert_contractor(v_login_id integer) OWNER TO postgres;

--
-- TOC entry 419 (class 1255 OID 34729)
-- Name: insert_person(character varying, character varying, character varying, character, character varying, character); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.insert_person(first_name character varying, last_name character varying, login character varying, passwd character, generated_token character varying, ident character) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_id integer;
BEGIN
	INSERT INTO login_credentials (first_name ,last_name, login, "password", "token", token_expire_at, identification)
	VALUES (INITCAP(first_name), INITCAP(last_name), login, passwd, generated_token, NOW() + interval '9 hours', ident)
	RETURNING id into v_id;
	RETURN v_id;
END
$$;


ALTER FUNCTION coretek.insert_person(first_name character varying, last_name character varying, login character varying, passwd character, generated_token character varying, ident character) OWNER TO audit;

--
-- TOC entry 319 (class 1255 OID 26001)
-- Name: issue_add(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.issue_add(vissue character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE vid integer;
BEGIN 
	INSERT INTO coretek.issue_name (name)
	VALUES (vissue)
	ON CONFLICT (name) DO NOTHING
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.issue_add(vissue character varying) OWNER TO audit;

--
-- TOC entry 320 (class 1255 OID 26005)
-- Name: issue_delete(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.issue_delete(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.issue_name
	WHERE vid = "id"
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.issue_delete(vid integer) OWNER TO audit;

--
-- TOC entry 379 (class 1255 OID 26034)
-- Name: issue_delete_from_class(integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.issue_delete_from_class(classid integer, optionid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.class_issues 
	WHERE optionid = issues_id AND audit_class_id = classid
	RETURNING issues_id INTO optionid;
	RETURN optionid;
END
$$;


ALTER FUNCTION coretek.issue_delete_from_class(classid integer, optionid integer) OWNER TO audit;

--
-- TOC entry 393 (class 1255 OID 34702)
-- Name: issue_get(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.issue_get() RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", "name" FROM issue_name
	ORDER BY "name"
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.issue_get() OWNER TO audit;

--
-- TOC entry 398 (class 1255 OID 34703)
-- Name: issue_get_from_class(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.issue_get_from_class(classid integer) RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT ci.issues_id, isn.name
	FROM coretek.class_issues ci
	INNER JOIN coretek.issue_name isn ON isn.id = ci.issues_id
	WHERE ci.audit_class_id = classid;
END
$$;


ALTER FUNCTION coretek.issue_get_from_class(classid integer) OWNER TO audit;

--
-- TOC entry 360 (class 1255 OID 17576)
-- Name: job_add_customer_job(integer, integer, integer, integer, integer, integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_add_customer_job(vsalesman integer, vcustomer integer, vjobname integer, vnumber integer, vplacement integer, vplant integer, vexpectation character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE rid integer;
BEGIN 
	INSERT INTO coretek.customer_job (login_id, customer_id, job_name_id, job_number_id, plant_id, expectation, customer_job_place_id)
	VALUES (vsalesman, vcustomer, vjobname, vnumber, vplant, vexpectation, vplacement)
	RETURNING id INTO vnumber;
	RETURN vnumber;
END
$$;


ALTER FUNCTION coretek.job_add_customer_job(vsalesman integer, vcustomer integer, vjobname integer, vnumber integer, vplacement integer, vplant integer, vexpectation character varying) OWNER TO audit;

--
-- TOC entry 335 (class 1255 OID 17601)
-- Name: job_add_number(integer, character varying, date); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_add_number(job_id integer, job_number character varying, job_date date) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	INSERT INTO job_number (job_name_id, "number", "date")
	VALUES (job_id, job_number, job_date) 
	RETURNING id INTO job_id;
	RETURN job_id;
END
$$;


ALTER FUNCTION coretek.job_add_number(job_id integer, job_number character varying, job_date date) OWNER TO audit;

--
-- TOC entry 359 (class 1255 OID 17521)
-- Name: job_add_placement(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_add_placement(vplace character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE rid integer;
BEGIN 
	INSERT INTO coretek.customer_job_place (name)
	VALUES (vplace)
	RETURNING id INTO rid;
	RETURN rid;
END
$$;


ALTER FUNCTION coretek.job_add_placement(vplace character varying) OWNER TO audit;

--
-- TOC entry 281 (class 1255 OID 17448)
-- Name: job_add_service(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_add_service(svcr character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE rid integer;
BEGIN 
	INSERT INTO coretek.job_services (name)
	VALUES (svcr)
	RETURNING id INTO rid;
	RETURN rid;
END
$$;


ALTER FUNCTION coretek.job_add_service(svcr character varying) OWNER TO audit;

--
-- TOC entry 337 (class 1255 OID 17592)
-- Name: job_delete(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_delete(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	
	IF NOT EXISTS (SELECT "id" 
			       FROM audit WHERE job_id = vid) THEN
		DELETE FROM coretek.job_requested
		WHERE customer_job_id = vid;
		DELETE FROM coretek.customer_job
		WHERE "id" = vid
		RETURNING "id" INTO vid;
		RETURN vid;
	ELSE RETURN 0;
	END IF;
END
$$;


ALTER FUNCTION coretek.job_delete(vid integer) OWNER TO audit;

--
-- TOC entry 399 (class 1255 OID 34687)
-- Name: job_delete_number(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_delete_number(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.job_number
	WHERE "id" = vid
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.job_delete_number(vid integer) OWNER TO audit;

--
-- TOC entry 409 (class 1255 OID 34692)
-- Name: job_delete_plant(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_delete_plant(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.plant_location
    WHERE id = vid
	RETURNING id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.job_delete_plant(vid integer) OWNER TO audit;

--
-- TOC entry 282 (class 1255 OID 17569)
-- Name: job_delete_reg_placement(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_delete_reg_placement(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.job_place_requested
	WHERE customer_job_place_id = vid;
	DELETE FROM coretek.customer_job_place
	WHERE "id" = vid
	RETURNING "id" INTO vid;
	RETURN vid;
	
END
$$;


ALTER FUNCTION coretek.job_delete_reg_placement(vid integer) OWNER TO audit;

--
-- TOC entry 331 (class 1255 OID 17369)
-- Name: job_delete_salesman(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_delete_salesman(userid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE deleted integer;
BEGIN 
	DELETE FROM coretek.salesman 
	WHERE login_id = userid
	RETURNING login_id INTO deleted;
	RETURN deleted;
END
$$;


ALTER FUNCTION coretek.job_delete_salesman(userid integer) OWNER TO audit;

--
-- TOC entry 344 (class 1255 OID 17450)
-- Name: job_delete_service(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_delete_service(vid integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.job_services 
	WHERE "id" = vid
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.job_delete_service(vid integer) OWNER TO audit;

--
-- TOC entry 357 (class 1255 OID 17411)
-- Name: job_edit_customer(integer, character varying, character varying, character varying, character varying, integer, character varying, character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_edit_customer(vid integer, vname character varying, vaddress character varying, vcity character varying, vstate character varying, vzip integer, vfname character varying, vlname character varying, vphone character varying, vcellphone character varying, vnotes character varying, vcountry character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	UPDATE coretek.customer
	SET "name"=vname,
	address=vaddress,
	city=vcity,
	"state"=vstate,
	zip=vzip,
	contact_first_name=vfname,
	contact_last_name=vlname,
	phone=vphone,
	cellphone=vcellphone,
	notes=vnotes,
	country=vcountry
	WHERE vid = coretek.customer.id
	RETURNING coretek.customer.id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.job_edit_customer(vid integer, vname character varying, vaddress character varying, vcity character varying, vstate character varying, vzip integer, vfname character varying, vlname character varying, vphone character varying, vcellphone character varying, vnotes character varying, vcountry character varying) OWNER TO audit;

--
-- TOC entry 416 (class 1255 OID 17466)
-- Name: job_edit_customer_services(integer, json); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_edit_customer_services(job_id integer, services json) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE json_row json;
DECLARE vkey character varying;
DECLARE vvalue character varying;
DECLARE keyvalue integer;
DECLARE checked bool;
BEGIN
	DELETE FROM coretek.job_requested WHERE job_id = customer_job_id;
	FOR json_row IN SELECT * FROM json_array_elements(services) LOOP
		FOR vkey, vvalue IN SELECT * FROM json_each_text(json_row) LOOP
			IF vkey = 'v_id' THEN
				keyvalue = vvalue;
			ELSEIF vkey = 'checked' THEN
				checked = vvalue;
			END IF;
		END LOOP;
		IF checked THEN
			INSERT INTO coretek.job_requested (job_services_id, customer_job_id) VALUES (keyvalue, job_id);
			checked = false;
		END IF;
	END LOOP;
	RETURN TRUE;
END
$$;


ALTER FUNCTION coretek.job_edit_customer_services(job_id integer, services json) OWNER TO audit;

--
-- TOC entry 334 (class 1255 OID 17418)
-- Name: job_edit_name(integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_edit_name(vid integer, vname character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	UPDATE coretek.job_name
	SET "name" = vname
	WHERE "id" = vid
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.job_edit_name(vid integer, vname character varying) OWNER TO audit;

--
-- TOC entry 413 (class 1255 OID 17522)
-- Name: job_edit_placement_options(integer, json); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_edit_placement_options(place_id integer, placement json) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE json_row json;
DECLARE vkey character varying;
DECLARE vvalue character varying;
DECLARE keyvalue integer;
DECLARE checked bool;
BEGIN
	DELETE FROM coretek.job_place_requested WHERE place_id = customer_job_place_id;
	FOR json_row IN SELECT * FROM json_array_elements(placement) LOOP
		FOR vkey, vvalue IN SELECT * FROM json_each_text(json_row) LOOP
			IF vkey = 'v_id' THEN
				keyvalue = vvalue;
			ELSEIF vkey = 'checked' THEN
				checked = vvalue;
			END IF;
		END LOOP;
		IF checked THEN
			INSERT INTO coretek.job_place_requested (customer_job_name_id, customer_job_place_id) VALUES (keyvalue, place_id);
			checked = false;
		END IF;
	END LOOP;
	RETURN TRUE;
END
$$;


ALTER FUNCTION coretek.job_edit_placement_options(place_id integer, placement json) OWNER TO audit;

--
-- TOC entry 402 (class 1255 OID 34694)
-- Name: job_get(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get(vplaceid integer) RETURNS TABLE(v_id integer, v_name text, v_expectation character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT cj.id, (UPPER(LEFT(lc.first_name, 1)) || UPPER(LEFT(lc.last_name, 1)) || ' - ' || pl.name || ' - ' || c.name || ' - ' || jname.name || ': ' || jnumber.number || ' - ' || to_char(jnumber.date, 'MM/DD/YYYY')), expectation
	FROM coretek.customer_job cj
	INNER JOIN coretek.login_credentials lc ON lc.id = cj.login_id
	INNER JOIN coretek.customer c ON cj.customer_id = c.id
	INNER JOIN coretek.job_name jname ON cj.job_name_id = jname.id
	INNER JOIN coretek.job_number jnumber ON cj.job_number_id = jnumber.id
	INNER JOIN coretek.plant_location pl ON cj.plant_id = pl.id
	WHERE cj.customer_job_place_id = vplaceid;
END
$$;


ALTER FUNCTION coretek.job_get(vplaceid integer) OWNER TO audit;

--
-- TOC entry 382 (class 1255 OID 26163)
-- Name: job_get_audit_permission(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_audit_permission(vid integer) RETURNS TABLE(perm integer)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 100
    AS $$

BEGIN 

	RETURN QUERY
	SELECT jpr.customer_job_name_id
	FROM coretek.job_place_requested jpr
	WHERE jpr.customer_job_place_id = (SELECT cj.customer_job_place_id
									   FROM coretek.customer_job cj 
									   WHERE cj.id = (SELECT au.job_id
													  FROM coretek.audit au 
													  WHERE au.id = vid
													  AND au.last_active = true ))
	LIMIT 100;
END
$$;


ALTER FUNCTION coretek.job_get_audit_permission(vid integer) OWNER TO audit;

--
-- TOC entry 448 (class 1255 OID 35505)
-- Name: job_get_audits(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_audits(vid integer) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE full_order json;
BEGIN 
--SELECT * FROM coretek.audit;
-- SELECT  coretek.job_get_audits(214);
	IF EXISTS (SELECT cj.id FROM coretek.customer_job cj WHERE cj.id = vid) THEN
		SELECT json_build_object(
			'audits',
			(SELECT json_agg(row_to_json(audits))
				FROM(
					SELECT au.id, 
						au.quantity,
						au.notes,
						au.fmv,
						ac.name,
					(SELECT json_agg(row_to_json(a_fields) -> 'fields') AS fields
					 	FROM (SELECT coretek._get_audit_fields(au.id) AS fields) AS a_fields
					),
					(SELECT coretek._get_audit_options(au.id)) as options
					FROM coretek.audit au
					INNER JOIN coretek.audit_class ac ON ac.id = au.audit_class_id
					WHERE au.job_id = vid
					AND au.last_active = true
					ORDER BY au.id
				) AS audits
			)
		) INTO full_order;
	ELSE 
		full_order = '{"not_found" : "not_found"}';
	END IF;
	RETURN full_order;
END
$$;


ALTER FUNCTION coretek.job_get_audits(vid integer) OWNER TO audit;

--
-- TOC entry 392 (class 1255 OID 34674)
-- Name: job_get_customer(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_customer(uid integer) RETURNS TABLE(name character varying, address character varying, city character varying, state character varying, zip integer, "fName" character varying, "lName" character varying, phone character varying, cell character varying, notes character varying, country character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT c.name, c.address, c.city, c.state, c.zip, c.contact_first_name, c.contact_last_name, c.phone, c.cellphone, c.notes, c.country
	FROM coretek.customer c
	WHERE c.id = uId
	LIMIT 1;
END
$$;


ALTER FUNCTION coretek.job_get_customer(uid integer) OWNER TO audit;

--
-- TOC entry 388 (class 1255 OID 34669)
-- Name: job_get_customers(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_customers() RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT id, name FROM coretek.customer
	ORDER BY name
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.job_get_customers() OWNER TO audit;

--
-- TOC entry 396 (class 1255 OID 34675)
-- Name: job_get_from_customer(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_from_customer(iid integer) RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT c.id, c.name FROM coretek.job_name c
	WHERE iid = c.customer_id;
END
$$;


ALTER FUNCTION coretek.job_get_from_customer(iid integer) OWNER TO audit;

--
-- TOC entry 390 (class 1255 OID 34700)
-- Name: job_get_full_name(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_full_name(vplaceid integer, OUT job_full_name text, OUT v_expectation character varying) RETURNS record
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	SELECT (UPPER(LEFT(lc.first_name, 1)) || UPPER(LEFT(lc.last_name, 1)) || ' - ' || pl.name || ' - ' || c.name || ' - ' || jname.name || ': ' || jnumber.number || ' - ' || to_char(jnumber.date, 'MM/DD/YYYY')), expectation 
    INTO job_full_name, v_expectation
	FROM coretek.customer_job cj
	INNER JOIN coretek.login_credentials lc ON lc.id = cj.login_id
	INNER JOIN coretek.customer c ON cj.customer_id = c.id
	INNER JOIN coretek.job_name jname ON cj.job_name_id = jname.id
	INNER JOIN coretek.job_number jnumber ON cj.job_number_id = jnumber.id
	INNER JOIN coretek.plant_location pl ON cj.plant_id = pl.id
	WHERE cj.id = vplaceid
    LIMIT 1;
END
$$;


ALTER FUNCTION coretek.job_get_full_name(vplaceid integer, OUT job_full_name text, OUT v_expectation character varying) OWNER TO audit;

--
-- TOC entry 418 (class 1255 OID 34684)
-- Name: job_get_number_from_name(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_number_from_name(job_id integer) RETURNS TABLE(v_id integer, v_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT c.id, (c.number || ' - ' || to_char(c."date", 'MM/DD/YYYY'))
	FROM coretek.job_number c
	WHERE job_id = c.job_name_id;
END
$$;


ALTER FUNCTION coretek.job_get_number_from_name(job_id integer) OWNER TO audit;

--
-- TOC entry 380 (class 1255 OID 26055)
-- Name: job_get_permissions(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_permissions(vid integer) RETURNS TABLE(perm integer)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 100
    AS $$
DECLARE job_place integer;
BEGIN 
	SELECT cj.customer_job_place_id
	INTO job_place
	FROM coretek.customer_job cj 
	WHERE cj.id = vid;
	
	RETURN QUERY
	SELECT jpr.customer_job_name_id
	FROM coretek.job_place_requested jpr
	WHERE jpr.customer_job_place_id = job_place
	LIMIT 100;
END
$$;


ALTER FUNCTION coretek.job_get_permissions(vid integer) OWNER TO audit;

--
-- TOC entry 386 (class 1255 OID 34662)
-- Name: job_get_place_perm(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_place_perm(uid integer) RETURNS TABLE(v_id integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT customer_job_name_id
	FROM coretek.job_place_requested
	WHERE uid = customer_job_place_id;
END
$$;


ALTER FUNCTION coretek.job_get_place_perm(uid integer) OWNER TO audit;

--
-- TOC entry 387 (class 1255 OID 34651)
-- Name: job_get_placement_names(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_placement_names() RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT id , name FROM coretek.job_place_name
	ORDER BY id
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.job_get_placement_names() OWNER TO audit;

--
-- TOC entry 406 (class 1255 OID 34689)
-- Name: job_get_plants(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_plants() RETURNS TABLE(v_id smallint, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT id, name FROM coretek.plant_location
	ORDER BY name
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.job_get_plants() OWNER TO audit;

--
-- TOC entry 410 (class 1255 OID 34695)
-- Name: job_get_reg_placement(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_reg_placement() RETURNS TABLE(v_id smallint, v_name character varying, v_permissions integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT DISTINCT c.id, c.name, jpn.id
	FROM coretek.customer_job_place c
    LEFT JOIN coretek.job_place_requested jpr ON jpr.customer_job_place_id = c.id
    LEFT JOIN coretek.job_place_name jpn ON jpr.customer_job_name_id = jpn.id
    ORDER BY c.id, jpn.id;
END
$$;


ALTER FUNCTION coretek.job_get_reg_placement() OWNER TO audit;

--
-- TOC entry 417 (class 1255 OID 34668)
-- Name: job_get_salesman(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_salesman() RETURNS TABLE(v_id integer, v_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT s.login_id, (l.first_name || ' ' || l.last_name) 
	FROM coretek.salesman s
	INNER JOIN coretek.login_credentials l ON l.id = s.login_id
	ORDER BY first_name, last_name;
END
$$;


ALTER FUNCTION coretek.job_get_salesman() OWNER TO audit;

--
-- TOC entry 395 (class 1255 OID 34693)
-- Name: job_get_services(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_services() RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE rid integer;
BEGIN 
	RETURN QUERY
	SELECT id, name
	FROM coretek.job_services
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.job_get_services() OWNER TO audit;

--
-- TOC entry 280 (class 1255 OID 17536)
-- Name: job_get_specific_place(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_get_specific_place(jobid integer) RETURNS TABLE(jobrequested integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT customer_job_name_id
	FROM coretek.job_place_requested
	WHERE customer_job_place_id = jobId
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.job_get_specific_place(jobid integer) OWNER TO audit;

--
-- TOC entry 355 (class 1255 OID 17395)
-- Name: job_insert_customer(character varying, character varying, character varying, character varying, character varying, integer, character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_insert_customer(vname character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, fname character varying, lname character varying, vphone character varying, cell character varying, notes character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
	DECLARE rid integer;
BEGIN
	INSERT INTO coretek.customer(
	name, address, city, state, zip, contact_first_name, contact_last_name, phone, cellphone, notes, country)
	VALUES (vname, vaddress, vcity, vstate, vzip, fName, lName, vphone, cell, notes, vcountry)
	RETURNING id INTO rid;
	RETURN rid;
END;
$$;


ALTER FUNCTION coretek.job_insert_customer(vname character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, fname character varying, lname character varying, vphone character varying, cell character varying, notes character varying) OWNER TO audit;

--
-- TOC entry 358 (class 1255 OID 17415)
-- Name: job_insert_job_name(integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_insert_job_name(vid integer, vname character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	INSERT INTO coretek.job_name (customer_id, "name")
	VALUES (vid, vname)
	RETURNING id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.job_insert_job_name(vid integer, vname character varying) OWNER TO audit;

--
-- TOC entry 318 (class 1255 OID 17591)
-- Name: job_move_audit_place(integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_move_audit_place(vid integer, vnew_place integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	UPDATE customer_job 
	SET customer_job_place_id = vnew_place
	WHERE vid = customer_job.id
	RETURNING customer_job.id INTO vid;
	RETURN vid;
	
END
$$;


ALTER FUNCTION coretek.job_move_audit_place(vid integer, vnew_place integer) OWNER TO audit;

--
-- TOC entry 407 (class 1255 OID 34691)
-- Name: job_set_plant(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_set_plant(vname character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_id integer;
BEGIN 
	INSERT INTO coretek.plant_location (name)
	VALUES (vname)
	RETURNING id INTO v_id;
	RETURN v_id;
END
$$;


ALTER FUNCTION coretek.job_set_plant(vname character varying) OWNER TO audit;

--
-- TOC entry 330 (class 1255 OID 17365)
-- Name: job_set_salesman(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.job_set_salesman(user_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE return_login_id integer;
BEGIN
	INSERT INTO coretek.salesman(login_id) VALUES (user_id)
	RETURNING login_id INTO return_login_id;
	RETURN return_login_id;
END
$$;


ALTER FUNCTION coretek.job_set_salesman(user_id integer) OWNER TO audit;

--
-- TOC entry 447 (class 1255 OID 35504)
-- Name: jobs_search_customer(integer, integer, integer, integer, integer, integer, integer, integer, integer, integer); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.jobs_search_customer(job_customeri integer, job_customerf integer, job_namei integer, job_namef integer, job_numberi integer, job_numberf integer, salesmani integer, salesmanf integer, planti integer, plantf integer) RETURNS TABLE(v_id integer, v_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT cj.id, 
	LEFT(lc.first_name, 1) || 
	LEFT(lc.last_name, 1) || ' - ' ||
	cu.name || ' - ' ||
	jna.name || ' - ' ||
	jnu.number || ' (' ||
	jnu.date || ') - ' ||
	pl.name
	FROM coretek.customer_job cj
	INNER JOIN coretek.login_credentials lc ON lc.id = cj.login_id
	INNER JOIN coretek.customer cu ON cu.id = cj.customer_id
	INNER JOIN coretek.job_name jna ON jna.id = cj.job_name_id
	INNER JOIN coretek.job_number jnu ON jnu.id = cj.job_number_id
	INNER JOIN coretek.plant_location pl ON pl.id = cj.plant_id
	WHERE lc.id BETWEEN salesmani AND salesmanf
	AND cu.id BETWEEN job_customeri AND job_customerf
	AND jna.id BETWEEN job_namei AND job_namef
	AND jnu.id BETWEEN job_numberi AND job_numberf
	AND pl.id BETWEEN planti AND plantf
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.jobs_search_customer(job_customeri integer, job_customerf integer, job_namei integer, job_namef integer, job_numberi integer, job_numberf integer, salesmani integer, salesmanf integer, planti integer, plantf integer) OWNER TO rafael;

--
-- TOC entry 333 (class 1255 OID 17178)
-- Name: login_get_attempts(inet, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.login_get_attempts(ip inet, v_login_name character varying) RETURNS TABLE(ip_disabled boolean, user_disabled boolean)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 1
    AS $$
DECLARE v_ip_failed_datetime timestamp with time zone;
DECLARE v_user_failed_datetime timestamp with time zone;
BEGIN
	SELECT l.attempt_datetime[array_length(l.attempt_datetime, 1) - 100]
	INTO v_ip_failed_datetime 
	FROM login_attempts_ip l
	WHERE l.ip_address = ip
	LIMIT 1;
	
	SELECT e.failed_datetime[array_length(e.failed_datetime, 1) - 10]
	INTO v_user_failed_datetime
	FROM login_attempts_user e
	WHERE e.login_name = v_login_name
	LIMIT 1;
	
	RETURN QUERY SELECT CASE WHEN v_ip_failed_datetime + interval '8 hours' > NOW() THEN true ELSE false END,
	CASE WHEN v_user_failed_datetime + interval '4 hours' > NOW() THEN true ELSE false END;
END
$$;


ALTER FUNCTION coretek.login_get_attempts(ip inet, v_login_name character varying) OWNER TO audit;

--
-- TOC entry 325 (class 1255 OID 17175)
-- Name: login_set_bad_attempt(inet, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.login_set_bad_attempt(ip inet, v_login_name character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
	INSERT INTO login_attempts_ip (ip_address, attempt_datetime)
	VALUES (ip, ARRAY [NOW()]) 
	ON CONFLICT (ip_address) 
	DO UPDATE SET attempt_datetime = array_append(login_attempts_ip.attempt_datetime, NOW())
	WHERE login_attempts_ip.ip_address = ip;
	INSERT INTO login_attempts_user (login_name, failed_datetime)
	VALUES (v_login_name, ARRAY [NOW()])
	ON CONFLICT (login_name)
	DO UPDATE SET failed_datetime = array_append(login_attempts_user.failed_datetime, NOW())
	WHERE login_attempts_user.login_name = v_login_name;
	RETURN 1;
END
$$;


ALTER FUNCTION coretek.login_set_bad_attempt(ip inet, v_login_name character varying) OWNER TO audit;

--
-- TOC entry 326 (class 1255 OID 17225)
-- Name: login_set_token_failed(inet); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.login_set_token_failed(v_ip inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
	INSERT INTO login_attempts_token (ip_address, failed_time)
	VALUES (v_ip, ARRAY [NOW()]) 
	ON CONFLICT (ip_address) 
	DO UPDATE SET failed_time = array_append(login_attempts_token.failed_time, NOW())
	WHERE login_attempts_token.ip_address = v_ip;
	RETURN true;
END
$$;


ALTER FUNCTION coretek.login_set_token_failed(v_ip inet) OWNER TO audit;

--
-- TOC entry 480 (class 1255 OID 35386)
-- Name: order_create(integer, integer, numeric, integer, character varying, integer, jsonb); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_create(customer_id integer, ship_id integer, payed numeric, paystatus integer, vnotes character varying, orderstaus integer, audit_pack jsonb, OUT audit_over_quantity bigint[], OUT query_status integer, OUT new_order_id bigint) RETURNS record
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE new_id smallint:= -1;
		i jsonb;
		created_ship_id integer;
		datetime_created timestamp without time zone:= NOW();
		audit_quantity integer;
		quantity_in_order integer;
BEGIN 
	
	INSERT INTO coretek.ship_to_history (first_name, middle_name, last_name, phone, cell,
									    address, city, state, zip, country, notes)
	SELECT first_name, middle_name, last_name, phone, cell, 
			address, city, state, zip, country, notes
	FROM coretek.ship_to_address sta
	WHERE sta.id = ship_id 
	RETURNING id INTO created_ship_id;
	
	INSERT INTO coretek.orders (customer_sell_id, ship_to_history_id, paid, order_payment_status_id, datetime, datetime_modified, notes, order_status_id, last_valid)
	VALUES (customer_id, created_ship_id, payed, paystatus, datetime_created, datetime_created, vnotes, orderstaus, true)
	RETURNING id INTO new_id;

	
	FOR i IN SELECT * FROM jsonb_array_elements(audit_pack) LOOP
		SELECT (a.quantity) 
		INTO audit_quantity 
		FROM coretek.audit a
		WHERE a.id = (i -> 'audit_id')::bigint;
		
		SELECT SUM(ore.quantity)
		INTO quantity_in_order
		FROM coretek.order_requested ore
		INNER JOIN coretek.orders o 
		ON ore.order_datetime_modified = o.datetime_modified
		WHERE ore.audit_id = (i -> 'audit_id')::bigint
		AND o.last_valid = TRUE
		GROUP BY ore.audit_id;
	
		IF quantity_in_order IS NULL THEN
			quantity_in_order = 0;
		END IF;
		
		IF (audit_quantity >= ((i -> 'order')::integer + quantity_in_order)) THEN
			INSERT INTO coretek.order_requested (audit_id, order_id, quantity, price, order_datetime_modified)
			VALUES ((i -> 'audit_id')::bigint, new_id, (i -> 'order')::integer, (i -> 'price')::numeric, datetime_created);
		ELSE 
			audit_over_quantity = array_append(audit_over_quantity, (i -> 'audit_id')::bigint);
		END IF;
	END LOOP;
	IF cardinality(audit_over_quantity) > 0 THEN 
	
		DELETE FROM coretek.order_requested
		WHERE order_id = new_id;
	
		DELETE FROM coretek.orders
		WHERE id = new_id;
		
		DELETE FROM coretek.ship_to_history
		WHERE id = created_ship_id;

		query_status = 2;
		
	ELSE 
		query_status = 1;
		new_order_id = new_id;
	END IF;
	
END
$$;


ALTER FUNCTION coretek.order_create(customer_id integer, ship_id integer, payed numeric, paystatus integer, vnotes character varying, orderstaus integer, audit_pack jsonb, OUT audit_over_quantity bigint[], OUT query_status integer, OUT new_order_id bigint) OWNER TO audit;

--
-- TOC entry 424 (class 1255 OID 34901)
-- Name: order_create_customer(character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_create_customer(fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE new_id smallint:= -1;
BEGIN 
	INSERT INTO coretek.customer_sell(
              first_name,
              middle_name,
              last_name,
              phone,
              cell,
              address,
              city,
              state,
              country,
              zip,
              notes)
    VALUES (INITCAP(fname), 
            INITCAP(mname), 
            INITCAP(lname),
            vphone,
            vcell,
            INITCAP(vaddress),
            INITCAP(vcity),
            INITCAP(vstate),
            INITCAP(vcountry),
            vzip,
            vnotes)                                
	ON CONFLICT DO NOTHING
	RETURNING id INTO new_id;
	RETURN new_id;
END
$$;


ALTER FUNCTION coretek.order_create_customer(fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) OWNER TO audit;

--
-- TOC entry 452 (class 1255 OID 35333)
-- Name: order_create_payment_status(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_create_payment_status(pstatus character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE vid integer;
BEGIN 
	INSERT INTO coretek.order_payment_status (name)
	VALUES (pstatus)
	ON CONFLICT (name) DO NOTHING
	RETURNING "id" INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.order_create_payment_status(pstatus character varying) OWNER TO audit;

--
-- TOC entry 420 (class 1255 OID 34872)
-- Name: order_create_permission(character varying, integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_create_permission(vname character varying, order_permission integer, audit_permission integer) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE new_id smallint:= -1;
BEGIN 
	INSERT INTO coretek.order_status (order_status_permission_id, order_audit_permission_id, name)
    VALUES (order_permission::smallint, audit_permission::smallint, INITCAP(vname))
	ON CONFLICT DO NOTHING
	RETURNING id INTO new_id;
	RETURN new_id;
END
$$;


ALTER FUNCTION coretek.order_create_permission(vname character varying, order_permission integer, audit_permission integer) OWNER TO audit;

--
-- TOC entry 422 (class 1255 OID 34993)
-- Name: order_create_ship(integer, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_create_ship(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	INSERT INTO coretek.ship_to_address(
              customer_sell_id,
              first_name,
              middle_name,
              last_name,
              phone,
              cell,
              address,
              city,
              state,
              country,
              zip,
              notes)
    VALUES (
            v_id,
            INITCAP(fname), 
            INITCAP(mname), 
            INITCAP(lname),
            vphone,
            vcell,
            INITCAP(vaddress),
            INITCAP(vcity),
            INITCAP(vstate),
            INITCAP(vcountry),
            vzip,
            vnotes)                                
	ON CONFLICT DO NOTHING
	RETURNING id INTO v_id;
	RETURN v_id;
END
$$;


ALTER FUNCTION coretek.order_create_ship(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) OWNER TO audit;

--
-- TOC entry 408 (class 1255 OID 35014)
-- Name: order_delete_customer(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_delete_customer(v_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.customer_sell
    WHERE v_id = id
    RETURNING id INTO v_id;
    RETURN v_id;
END
$$;


ALTER FUNCTION coretek.order_delete_customer(v_id integer) OWNER TO audit;

--
-- TOC entry 436 (class 1255 OID 35473)
-- Name: order_delete_order(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_delete_order(v_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.order_requested
    WHERE v_id = order_id;
    DELETE FROM coretek.orders
	WHERE v_id = id;
	IF EXISTS (SELECT FROM coretek.orders WHERE id = v_id )THEN
		RETURN 1;
	ELSE 
		RETURN 0;
	END IF;
END
$$;


ALTER FUNCTION coretek.order_delete_order(v_id integer) OWNER TO audit;

--
-- TOC entry 454 (class 1255 OID 35339)
-- Name: order_delete_payment_status(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_delete_payment_status(v_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.order_payment_status
    WHERE v_id = id
    RETURNING id INTO v_id;
    RETURN v_id;
END
$$;


ALTER FUNCTION coretek.order_delete_payment_status(v_id integer) OWNER TO audit;

--
-- TOC entry 401 (class 1255 OID 34882)
-- Name: order_delete_permissions(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_delete_permissions(v_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.order_status 
    WHERE v_id::smallint = id
    RETURNING id INTO v_id;
    RETURN v_id;
   
END
$$;


ALTER FUNCTION coretek.order_delete_permissions(v_id integer) OWNER TO audit;

--
-- TOC entry 411 (class 1255 OID 35015)
-- Name: order_delete_shipping(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_delete_shipping(v_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.ship_to_address
    WHERE v_id = id
    RETURNING id INTO v_id;
    RETURN v_id;
END
$$;


ALTER FUNCTION coretek.order_delete_shipping(v_id integer) OWNER TO audit;

--
-- TOC entry 404 (class 1255 OID 35008)
-- Name: order_edit_customer(integer, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_edit_customer(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE new_id smallint:= -1;
BEGIN 
	UPDATE coretek.customer_sell
    SET first_name = INITCAP(fname),
        middle_name = INITCAP(mname),
        last_name = INITCAP(lname),
        phone = vphone,
        cell = vcell,
        address = INITCAP(vaddress),
        city = INITCAP(vcity),
        state = INITCAP(vstate),
        country = INITCAP(vcountry),
        zip = vzip,
        notes = vnotes
    WHERE v_id = id
	RETURNING id INTO new_id;
	RETURN new_id;
END
$$;


ALTER FUNCTION coretek.order_edit_customer(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) OWNER TO audit;

--
-- TOC entry 429 (class 1255 OID 35466)
-- Name: order_edit_order(integer, integer, integer, numeric, character varying, jsonb); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_edit_order(vid integer, vpay_status integer, vorder_status integer, vpaid numeric, vnotes character varying, vaudits jsonb, OUT audit_over bigint[], OUT quantity_over integer[]) RETURNS record
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE vnow timestamp without time zone:= NOW();
		vdt_modified timestamp without time zone; 
		i jsonb;
		audit_quantity integer;
		qtt_in_order integer;
		qtt_in_this_order integer;
BEGIN 
	IF EXISTS (SELECT id FROM coretek.orders o WHERE o.id = vid LIMIT 1) THEN
		SELECT datetime_modified 
		INTO vdt_modified
		FROM coretek.orders o
		WHERE o.id = vid
		AND last_valid = true;

		FOR i IN SELECT * FROM jsonb_array_elements(vaudits) LOOP
			IF EXISTS 
			(SELECT a.id 
			FROM coretek.audit a
			WHERE (i -> 'audit_id')::bigint = a.id
			AND a.last_active = true) THEN
				SELECT quantity INTO audit_quantity FROM coretek.audit au
				WHERE au.id = (i -> 'audit_id')::bigint
				AND au.last_active = true;
				
				SELECT COALESCE((SELECT SUM(quantity) 
				FROM coretek.order_requested oreq
				INNER JOIN coretek.orders o ON o.id = oreq.order_id
				AND o.datetime_modified = oreq.order_datetime_modified
				WHERE o.last_valid = true
				AND oreq.audit_id = (i -> 'audit_id')::bigint), 0) INTO qtt_in_order;
				
				SELECT COALESCE((SELECT oreq.quantity
				FROM coretek.order_requested oreq
				WHERE oreq.audit_id = (i -> 'audit_id')::bigint
				AND oreq.order_id = vid
				AND oreq.order_datetime_modified = vdt_modified), 0) INTO qtt_in_this_order;

				RAISE NOTICE '%, %, %', audit_quantity, qtt_in_order, qtt_in_this_order;
				IF (audit_quantity - (qtt_in_order - qtt_in_this_order) - (i -> 'user_order')::integer) < 0 THEN
					audit_over = array_append(audit_over, (i -> 'audit_id')::bigint);
					quantity_over = array_append(quantity_over, (audit_quantity - (qtt_in_order - qtt_in_this_order) - (i -> 'user_order')::integer));
 				END IF;
				
			END IF;
		END LOOP;
		RAISE NOTICE '%', array_length(audit_over, 1);
		IF (array_length(audit_over, 1) IS NULL) THEN
			UPDATE coretek.orders 
			SET last_valid = false
			WHERE last_valid = true
			AND id = vid;
			
	 		INSERT INTO coretek.orders (
				id, 
				customer_sell_id, 
				ship_to_history_id, 
				paid, 
				order_status_id, 
				order_payment_status_id,
				datetime,
				datetime_modified,
				notes,
				last_valid
			   )
			SELECT vid, 
				o.customer_sell_id,
				o.ship_to_history_id,
				vpaid,
				vorder_status,
				vpay_status,
				o.datetime,
				vnow,
				vnotes,
				true
			FROM coretek.orders o 
			WHERE o.id = vid
			AND o.datetime_modified = vdt_modified;
	 --SELECT * FROM coretek.order_requested 

			FOR i IN SELECT * FROM jsonb_array_elements(vaudits) LOOP
				INSERT INTO coretek.order_requested
				(audit_id, order_id, quantity, price, order_datetime_modified)
				VALUES ((i -> 'audit_id')::bigint, vid, (i -> 'user_order')::integer, (i -> 'price')::numeric(17,2), vnow);
			END LOOP;
		ELSE
			
		END IF;
	END IF;
END
$$;


ALTER FUNCTION coretek.order_edit_order(vid integer, vpay_status integer, vorder_status integer, vpaid numeric, vnotes character varying, vaudits jsonb, OUT audit_over bigint[], OUT quantity_over integer[]) OWNER TO audit;

--
-- TOC entry 397 (class 1255 OID 34881)
-- Name: order_edit_permissions(integer, integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_edit_permissions(v_audit integer, v_order integer, v_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	UPDATE coretek.order_status 
    SET order_status_permission_id = v_order::smallint,
        order_audit_permission_id = v_audit::smallint
    WHERE v_id::smallint = id
    RETURNING id INTO v_id;
    RETURN v_id;
   
END
$$;


ALTER FUNCTION coretek.order_edit_permissions(v_audit integer, v_order integer, v_id integer) OWNER TO audit;

--
-- TOC entry 405 (class 1255 OID 35009)
-- Name: order_edit_shipping(integer, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_edit_shipping(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE new_id smallint:= -1;
BEGIN 
	UPDATE coretek.ship_to_address
    SET first_name = INITCAP(fname),
        middle_name = INITCAP(mname),
        last_name = INITCAP(lname),
        phone = vphone,
        cell = vcell,
        address = INITCAP(vaddress),
        city = INITCAP(vcity),
        state = INITCAP(vstate),
        country = INITCAP(vcountry),
        zip = vzip,
        notes = vnotes
    WHERE v_id = id
	RETURNING id INTO new_id;
	RETURN new_id;
END
$$;


ALTER FUNCTION coretek.order_edit_shipping(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) OWNER TO audit;

--
-- TOC entry 430 (class 1255 OID 35435)
-- Name: order_find_audits(integer, jsonb, jsonb); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.order_find_audits(vclass integer, vfields jsonb, voptions jsonb) RETURNS TABLE(audit bigint, qtt_available bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE i jsonb;      
		strval character varying;
		boolval boolean;
		intval integer;
		numval numeric(46,6);
		
		query_build character varying;
		string_query_build character varying:= '';
		add_to_query character varying;
		
		first_pass boolean := false;
		first_inner_pass boolean := false;
		multi_search boolean := false;
		
		parentesis_pass integer := 0;
		single_audit jsonb;
		audits_found integer[];
BEGIN 
    
    FOR i IN SELECT * FROM jsonb_array_elements(vfields) LOOP
		IF first_pass = false THEN
			query_build := 'SELECT 
				DISTINCT acr.audit_id, a.quantity - (
					COALESCE((SELECT SUM(orr.quantity)
						FROM coretek.order_requested orr
						INNER JOIN coretek.orders o ON o.id = orr.order_id
						AND orr.order_datetime_modified = o.datetime_modified
						WHERE orr.audit_id = acr.audit_id
						AND o.last_valid = true
						GROUP BY orr.audit_id
					), 0)) AS quantity_available
				FROM coretek.audit_class_record acr
				INNER JOIN coretek.audit a ON a.id = acr.audit_id
				WHERE a.last_active = true AND ';
			
-- 			'SELECT array_agg(DISTINCT acr.audit_id)
-- 					FROM coretek.audit_class_record acr
-- 					INNER JOIN coretek.audit a ON a.id = acr.audit_id
-- 					LEFT JOIN coretek.order_requested orr ON acr.audit_id = orr.audit_id
-- 					WHERE a.last_active = true 
-- 					AND	a.quantity > CASE WHEN orr.quantity IS NULL THEN 0 ELSE orr.quantity END AND ';
			
		ELSE
			query_build := query_build || 'AND acr.audit_id = ANY (SELECT DISTINCT acr.audit_id 
						  FROM coretek.audit_class_record acr 
						  INNER JOIN coretek.audit a ON a.id = acr.audit_id
						  WHERE a.last_active = true AND ';
		END IF;
		
        IF (vclass > 0) THEN
			query_build = query_build || 'audit_class_field_audit_classid = ' || vclass || ' AND (';
		ELSE query_build = query_build || '(';
		END IF;
		IF ((i -> 'field_id')::integer = 1) THEN
            SELECT (jsonb_array_elements(i -> 'fields'))::jsonb::text::boolean INTO boolval;
			IF boolval = true THEN
				query_build = query_build || '(acr.boolean = true AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
			ELSE 
				query_build = query_build || '(acr.boolean = false AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
			END IF;
		END IF;
		IF ((i -> 'field_id')::integer = 2) THEN
            FOR intval IN (SELECT jsonb_array_elements(i -> 'fields') element) LOOP
				IF first_inner_pass = false THEN
					first_inner_pass = true;
					string_query_build = string_query_build || '((acr.pre_defined_field_values_id = ' || intval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				ELSE 
					string_query_build = string_query_build || ' OR (acr.pre_defined_field_values_id = ' || intval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				END IF;
			END LOOP;
			query_build = query_build || string_query_build || ') ';
		END IF;
		
		IF ((i -> 'field_id')::integer = 3) THEN
            FOR strval IN (SELECT jsonb_array_elements(i -> 'fields') element) LOOP
				
				SELECT quote_literal(TRIM(TRAILING '"' FROM TRIM(LEADING '"' FROM strval))) INTO strval;
 				IF (first_inner_pass = false) THEN
					first_inner_pass = true;
 					string_query_build = string_query_build || '((acr.stringval LIKE ' || strval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				ELSE 
					string_query_build = string_query_build || ' OR (acr.stringval LIKE ' || strval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				END IF;
				
			END LOOP;
			query_build = query_build || string_query_build || ') ';
		END IF;
		
		IF ((i -> 'field_id')::integer = 4) THEN
            FOR numval IN (SELECT jsonb_array_elements(i -> 'fields') element) LOOP
				IF first_inner_pass = false THEN
					first_inner_pass = true;
					string_query_build = string_query_build || '((acr.numval = ' || numval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				ELSE 
					string_query_build = string_query_build || ' OR (acr.numval = ' || numval || ' AND acr.audit_class_field_id = ' || (i -> 'v_id') || ')';
				END IF;
			END LOOP;
			query_build = query_build || string_query_build || ') ';
		END IF;
		
		string_query_build = '';
		IF first_pass = false THEN
			first_pass = true;
		ELSE query_build = query_build || ') ';
		END IF;
		first_inner_pass = false;
		parentesis_pass = parentesis_pass + 1;
		
    END LOOP;
	FOR intval IN 1..parentesis_pass LOOP
		query_build = query_build || ')';
	END LOOP;
	
	
	RETURN QUERY EXECUTE query_build;
	
END
$$;


ALTER FUNCTION coretek.order_find_audits(vclass integer, vfields jsonb, voptions jsonb) OWNER TO rafael;

--
-- TOC entry 425 (class 1255 OID 35013)
-- Name: order_find_customer_ship(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_find_customer_ship(fv_id integer) RETURNS TABLE(id integer, fname character varying, mname character varying, lname character varying, phone character varying, cell character varying, address character varying, city character varying, state character varying, country character varying, zip integer, notes character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY 
   SELECT a.id,
          a.first_name,
          a.middle_name,
          a.last_name,
          a.phone,
          a.cell,
          a.address,
          a.city,
          a.state,
          a.country,
          a.zip,
          a.notes
    FROM coretek.ship_to_address a
    WHERE customer_sell_id = fv_id;
END
$$;


ALTER FUNCTION coretek.order_find_customer_ship(fv_id integer) OWNER TO audit;

--
-- TOC entry 394 (class 1255 OID 34865)
-- Name: order_get_audit_permissions(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_get_audit_permissions() RETURNS TABLE(v_id smallint, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", "name" FROM coretek.order_audit_permission
	ORDER BY id
    LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.order_get_audit_permissions() OWNER TO audit;

--
-- TOC entry 443 (class 1255 OID 35244)
-- Name: order_get_found_audit(integer); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.order_get_found_audit(intval integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE single_audit jsonb;
		quantity_found_order integer;
		fmv numeric(17,2);
		notes character varying;
		name character varying;
BEGIN 
	SELECT SUM(orr.quantity) INTO quantity_found_order
	
	FROM coretek.order_requested orr
	WHERE orr.audit_id = intval;
	IF quantity_found_order ISNULL THEN 
		quantity_found_order = 0 ;
	END IF;
	
	RAISE NOTICE '%', quantity_found_order;
	SELECT jsonb_build_object(
		'audit_info', 
		(SELECT row_to_json(selected_audit)
			FROM 
			(SELECT
			 	 au.notes,
				 au.fmv,
				 ac.name as class_name
				 FROM coretek.audit au
			 	 INNER JOIN coretek.audit_class ac ON au.audit_class_id = ac.id
				 WHERE au.id = intval
			 	 AND au.last_active = true
			 	 
			) AS selected_audit
		),
		'fields',
		(SELECT json_agg(row_to_json(json_fields))FROM 
			(SELECT acf.label as field_name, array_agg(CASE WHEN acr.numval IS NOT NULL THEN acr.numval::text
				WHEN acr.boolean IS NOT NULL THEN acr.boolean::text
				WHEN acr.pre_defined_field_values_id IS NOT NULL THEN pdfv.string_value::text
				WHEN acr.stringval IS NOT NULL THEN acr.stringval::text
				ELSE ''
			END) AS values
			FROM coretek.audit_class_record acr
			INNER JOIN coretek.audit a ON acr.audit_id = a.id
			AND a.date_placed = acr.audit_datetime_placed
			INNER JOIN coretek.audit_class_fields acf ON acr.audit_class_field_id = acf.id
			AND acr.audit_class_field_audit_classid = acf.audit_class_id
			LEFT JOIN coretek.pre_defined_field_values pdfv ON pdfv.id = acr.pre_defined_field_values_id
			WHERE acr.audit_id = intval
			AND a.last_active = true
			GROUP BY acf.label
 			ORDER BY acf.label
 			
			) AS json_fields
		),
		'options', 
		(	
			SELECT array_agg(ina.name) 
			FROM coretek.audit a
			INNER JOIN coretek.audit_issues ai ON a.id = ai.audit_id
			AND a.date_placed = ai.audit_date_placed
			INNER JOIN coretek.issue_name ina ON ai.issue_name_id = ina.id
			WHERE a.id = intval
			AND a.last_active = true
		) 
	) INTO single_audit;
	

	RETURN single_audit;
	
END
$$;


ALTER FUNCTION coretek.order_get_found_audit(intval integer) OWNER TO rafael;

--
-- TOC entry 437 (class 1255 OID 35488)
-- Name: order_get_full_specific_history(bigint, timestamp without time zone); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_get_full_specific_history(vid bigint, vdatetime timestamp without time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE dship_to_history_id integer;
		dcustomer_sell_id integer;
		full_order jsonb;
BEGIN 
	SELECT o.ship_to_history_id, o.customer_sell_id 
	INTO dship_to_history_id, dcustomer_sell_id
	FROM coretek.orders o
	WHERE o.id = vid
	AND o.datetime_modified = vdatetime;
	IF dcustomer_sell_id IS NOT NULL THEN
		SELECT json_build_object(
			'order',
			(SELECT row_to_json(customer_info)
			FROM (
				SELECT o.paid,
				os.name AS order_status_name,
				ops.name AS order_payment_status,
				o.datetime,
				o.notes
				FROM coretek.orders o
				INNER JOIN order_status os ON o.order_status_id = os.id
				INNER JOIN order_payment_status ops ON o.order_payment_status_id = ops.id
				WHERE o.id = vid
				AND o.datetime_modified = vdatetime
				
			) AS customer_info),
			'customer',
			(SELECT row_to_json(customer_info)
			FROM (
				SELECT cs.first_name,
				cs.middle_name,
				cs.last_name,
				cs.phone,
				cs.cell,
				cs.address,
				cs.city,
				cs.state,
				cs.zip,
				cs.country,
				cs.notes
				FROM coretek.customer_sell cs
				WHERE cs.id = dcustomer_sell_id
			) AS customer_info),
			'ship_to',
			(SELECT row_to_json(ship_to_history) FROM(
				SELECT sh.first_name,
				sh.middle_name,
				sh.last_name,
				sh.phone,
				sh.cell,
				sh.address,
				sh.city,
				sh.state,
				sh.zip,
				sh.country,
				sh.notes
				FROM coretek.ship_to_history sh
				WHERE id = dship_to_history_id
				
			) AS ship_to_history ),
			'audits',
			(SELECT json_agg(row_to_json(audits))
				FROM(
					SELECT oreq.audit_id, 
						oreq.quantity AS order_qtt,
						oreq.price,
						au.notes,
						ac.name AS class_name,
					
					(SELECT json_agg(row_to_json(a_fields) -> 'fields') AS fields
					 	FROM (SELECT coretek._get_audit_fields(oreq.audit_id) AS fields) AS a_fields
					),
					(SELECT coretek._get_audit_options(oreq.audit_id)) as options
					FROM coretek.audit au 
					INNER JOIN coretek.order_requested oreq ON au.id = oreq.audit_id
					INNER JOIN coretek.orders o ON o.id = oreq.order_id
					AND o.datetime_modified = oreq.order_datetime_modified
					INNER JOIN coretek.audit_class ac ON au.audit_class_id = ac.id
					WHERE oreq.order_id = vid
					AND au.last_active = true
					AND o.datetime_modified = vdatetime
					ORDER BY oreq.audit_id
				) AS audits
			)
		) INTO full_order;
		RETURN full_order;
		
		
		RETURN '{"record found":1}';
		
	ELSE 
		RETURN '{"record not found":0}';
	END IF;
	
	
END
$$;


ALTER FUNCTION coretek.order_get_full_specific_history(vid bigint, vdatetime timestamp without time zone) OWNER TO audit;

--
-- TOC entry 432 (class 1255 OID 35478)
-- Name: order_get_history(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_get_history(vid bigint) RETURNS TABLE(datetime timestamp without time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT datetime_modified FROM coretek.orders
	WHERE id = vid
	ORDER BY datetime_modified DESC
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.order_get_history(vid bigint) OWNER TO audit;

--
-- TOC entry 431 (class 1255 OID 35415)
-- Name: order_get_info(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_get_info(vid integer) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE full_order json;
		dtmod timestamp without time zone;
BEGIN 
	IF EXISTS (SELECT o.id FROM coretek.orders o WHERE o.id = vid) THEN
		SELECT json_build_object(
			'customer_info', (SELECT row_to_json(cs_info)
				FROM (
					  SELECT cs.first_name, cs.middle_name, cs.last_name,
						cs.phone, cs.cell, cs.notes
					  FROM coretek.orders o
					  INNER JOIN coretek.customer_sell cs ON cs.id = o.customer_sell_id
					  WHERE o.id = vid
					  AND o.last_valid = true)
				AS cs_info
			),
			'ship_to', 
			(SELECT row_to_json(ship_to)
				FROM (
					SELECT sh.first_name, sh.middle_name, sh.last_name,
					sh.phone, sh.cell, sh.address, sh.city, sh.state,
					sh.zip, sh.country, sh.notes
					FROM coretek.orders o
					INNER JOIN coretek.ship_to_history sh ON sh.id = o.ship_to_history_id
					WHERE o.id = vid
					AND o.last_valid = true
				) AS ship_to
			),
			'order_info',
			(SELECT row_to_json(order_info)
				FROM (
					SELECT o.paid, 
					o.order_status_id AS order_status,
					o.order_payment_status_id AS order_pay_status,
					o.datetime,
					o.datetime_modified,
					o.notes
					FROM coretek.orders o
					WHERE o.id = vid
					AND o.last_valid = true
				) AS order_info
			),
			'audits',
			(SELECT json_agg(row_to_json(audits))
				FROM(
					--SELECT * FROM coretek.audit
					--SELECT * FROM coretek.order_requested
					--SELECT coretek._get_audit_quantity_available(10)
					-- SELECT coretek.order_get_info(67)
					SELECT oreq.audit_id, 
						oreq.quantity AS order_qtt,
						oreq.price,
					(SELECT coretek._get_audit_quantity_available(oreq.audit_id) AS extra),
					(SELECT json_agg(row_to_json(a_fields) -> 'fields') AS fields
					 	FROM (SELECT coretek._get_audit_fields(oreq.audit_id) AS fields) AS a_fields
					),
					(SELECT coretek._get_audit_options(oreq.audit_id)) as options
					FROM coretek.order_requested oreq
					INNER JOIN coretek.orders o ON o.id = oreq.order_id
					WHERE oreq.order_id = vid
					AND oreq.order_datetime_modified = o.datetime_modified
					AND o.last_valid = true
					ORDER BY oreq.audit_id
				) AS audits
			)
		) INTO full_order;
	ELSE 
		full_order = '{"not_found" : "not_found"}';
	END IF;
	RETURN full_order;
END
$$;


ALTER FUNCTION coretek.order_get_info(vid integer) OWNER TO audit;

--
-- TOC entry 453 (class 1255 OID 35338)
-- Name: order_get_payment_status(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_get_payment_status() RETURNS TABLE(v_id integer, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", "name" FROM coretek.order_payment_status
	ORDER BY "name"
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.order_get_payment_status() OWNER TO audit;

--
-- TOC entry 421 (class 1255 OID 34874)
-- Name: order_get_reg_permissions(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_get_reg_permissions() RETURNS TABLE(v_id smallint, v_name character varying, "order" smallint, audit smallint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
    SELECT id, name, order_status_permission_id, order_audit_permission_id
    FROM coretek.order_status
    ORDER BY name;
END
$$;


ALTER FUNCTION coretek.order_get_reg_permissions() OWNER TO audit;

--
-- TOC entry 400 (class 1255 OID 34864)
-- Name: order_get_status_permissions(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_get_status_permissions() RETURNS TABLE(v_id smallint, v_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", "name" FROM coretek.order_status_permission
	ORDER BY id
    LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.order_get_status_permissions() OWNER TO audit;

--
-- TOC entry 423 (class 1255 OID 34991)
-- Name: order_search_customer(character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.order_search_customer(vafname character varying, vamname character varying, valname character varying, vaphone character varying, vacell character varying, vaaddress character varying, vacity character varying, vastate character varying, vacountry character varying, vazip integer, vanotes character varying) RETURNS TABLE(id integer, fname character varying, mname character varying, lname character varying, phone character varying, cell character varying, address character varying, city character varying, state character varying, country character varying, zip integer, notes character varying)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 50
    AS $$

BEGIN 
    RETURN QUERY
    SELECT c.id,
           c.first_name,
           c.middle_name,
           c.last_name,
           c.phone,
           c.cell,
           c.address,
           c.city,
           c.state,
           c.country,
           c.zip,
           c.notes
    FROM coretek.customer_sell c
    WHERE LOWER(first_name) LIKE LOWER(vafname) AND
          LOWER(middle_name) LIKE LOWER(vamname) AND
          LOWER(last_name) LIKE LOWER(valname) AND
          LOWER(c.phone) LIKE LOWER(vaphone) AND
          LOWER(c.cell) LIKE LOWER(vacell) AND
          LOWER(c.address) LIKE LOWER(vaaddress) AND
          LOWER(c.city) LIKE LOWER(vacity) AND
          LOWER(c.state) LIKE LOWER(vastate) AND
          LOWER(c.country) LIKE LOWER(vacountry) AND
          LOWER(c.notes) LIKE LOWER(vanotes)
     LIMIT 50;
END
$$;


ALTER FUNCTION coretek.order_search_customer(vafname character varying, vamname character varying, valname character varying, vaphone character varying, vacell character varying, vaaddress character varying, vacity character varying, vastate character varying, vacountry character varying, vazip integer, vanotes character varying) OWNER TO rafael;

--
-- TOC entry 332 (class 1255 OID 35399)
-- Name: order_search_customer_only_name(character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_search_customer_only_name(vafname character varying, vamname character varying, valname character varying, vaphone character varying, vacell character varying, vaaddress character varying, vacity character varying, vastate character varying, vacountry character varying, vazip integer, vanotes character varying) RETURNS TABLE(id integer, fname character varying, mname character varying, lname character varying)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 50
    AS $$

BEGIN 
    RETURN QUERY
    SELECT c.id,
           c.first_name,
           c.middle_name,
           c.last_name
    FROM coretek.customer_sell c
    WHERE LOWER(first_name) LIKE LOWER(vafname) AND
          LOWER(middle_name) LIKE LOWER(vamname) AND
          LOWER(last_name) LIKE LOWER(valname) AND
          LOWER(c.phone) LIKE LOWER(vaphone) AND
          LOWER(c.cell) LIKE LOWER(vacell) AND
          LOWER(c.address) LIKE LOWER(vaaddress) AND
          LOWER(c.city) LIKE LOWER(vacity) AND
          LOWER(c.state) LIKE LOWER(vastate) AND
          LOWER(c.country) LIKE LOWER(vacountry) AND
          LOWER(c.notes) LIKE LOWER(vanotes)
     LIMIT 50;
END
$$;


ALTER FUNCTION coretek.order_search_customer_only_name(vafname character varying, vamname character varying, valname character varying, vaphone character varying, vacell character varying, vaaddress character varying, vacity character varying, vastate character varying, vacountry character varying, vazip integer, vanotes character varying) OWNER TO audit;

--
-- TOC entry 433 (class 1255 OID 35470)
-- Name: order_search_customer_order(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_search_customer_order(vid integer) RETURNS TABLE(v_id bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
    SELECT DISTINCT o.id
	FROM coretek.orders o
	WHERE o.customer_sell_id = vid
	ORDER BY o.id DESC
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.order_search_customer_order(vid integer) OWNER TO audit;

--
-- TOC entry 434 (class 1255 OID 35471)
-- Name: order_search_from_order_pay_status(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_search_from_order_pay_status(vid integer) RETURNS TABLE(v_id bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
    SELECT DISTINCT o.id
	FROM coretek.orders o
	WHERE o.order_payment_status_id = vid
	AND o.last_valid = true
	ORDER BY o.id DESC
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.order_search_from_order_pay_status(vid integer) OWNER TO audit;

--
-- TOC entry 435 (class 1255 OID 35472)
-- Name: order_search_from_order_status(bigint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.order_search_from_order_status(vid bigint) RETURNS TABLE(v_id bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
    SELECT DISTINCT o.id
	FROM coretek.orders o
	WHERE o.order_status_id = vid
	AND o.last_valid = true
	ORDER BY o.id DESC
	LIMIT 1000;
END
$$;


ALTER FUNCTION coretek.order_search_from_order_status(vid bigint) OWNER TO audit;

--
-- TOC entry 462 (class 1255 OID 35619)
-- Name: other_delete_announce(smallint); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.other_delete_announce(vid smallint) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.announces 
	WHERE id = vid
	RETURNING id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.other_delete_announce(vid smallint) OWNER TO audit;

--
-- TOC entry 464 (class 1255 OID 35620)
-- Name: other_delete_announce(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.other_delete_announce(vid integer) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.announces 
	WHERE id = vid::smallint
	RETURNING id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.other_delete_announce(vid integer) OWNER TO audit;

--
-- TOC entry 463 (class 1255 OID 35614)
-- Name: other_set_annonce(character varying, boolean, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.other_set_annonce(announce character varying, v_show boolean, user_id integer, OUT newid smallint) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	INSERT INTO coretek.announces (login_credentials_id, info, show)
	VALUES (user_id, announce, v_show)
	RETURNING id INTO newid;
END
$$;


ALTER FUNCTION coretek.other_set_annonce(announce character varying, v_show boolean, user_id integer, OUT newid smallint) OWNER TO audit;

--
-- TOC entry 466 (class 1255 OID 35626)
-- Name: others_announce_change_status(integer, boolean); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.others_announce_change_status(vid integer, stat boolean) RETURNS smallint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	UPDATE coretek.announces 
	SET show = stat
	WHERE id = vid::smallint
	RETURNING id INTO vid;
	RETURN vid;
END
$$;


ALTER FUNCTION coretek.others_announce_change_status(vid integer, stat boolean) OWNER TO audit;

--
-- TOC entry 467 (class 1255 OID 35649)
-- Name: others_delete_my_reminder(integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.others_delete_my_reminder(user_id integer, v_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	DELETE FROM coretek.reminders r
	WHERE r.login_credentials_id = user_id
	AND r.id = v_id
	RETURNING id INTO user_id;
	RETURN user_id;
END
$$;


ALTER FUNCTION coretek.others_delete_my_reminder(user_id integer, v_id integer) OWNER TO audit;

--
-- TOC entry 461 (class 1255 OID 35622)
-- Name: others_get_all_announces(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.others_get_all_announces() RETURNS TABLE(id smallint, info character varying, show boolean, person_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT a.id, a.info, a.show, lc.first_name || ' ' || lc.last_name AS person_name
	FROM coretek.announces a
	INNER JOIN coretek.login_credentials lc ON lc.id = a.login_credentials_id
	ORDER BY a.id;
END
$$;


ALTER FUNCTION coretek.others_get_all_announces() OWNER TO audit;

--
-- TOC entry 468 (class 1255 OID 35627)
-- Name: others_get_announce(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.others_get_announce() RETURNS TABLE(info character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT a.info
	FROM coretek.announces a
	WHERE a.show = true;
END
$$;


ALTER FUNCTION coretek.others_get_announce() OWNER TO audit;

--
-- TOC entry 470 (class 1255 OID 35653)
-- Name: others_get_my_reminders(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.others_get_my_reminders(user_id integer) RETURNS TABLE(id integer, info character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT r.id, r.reminder
	FROM coretek.reminders r
	WHERE r.login_credentials_id = user_id;
END
$$;


ALTER FUNCTION coretek.others_get_my_reminders(user_id integer) OWNER TO audit;

--
-- TOC entry 465 (class 1255 OID 35647)
-- Name: others_set_self_reminder(integer, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.others_set_self_reminder(user_id integer, vreminder character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	INSERT INTO coretek.reminders (login_credentials_id, reminder)
	VALUES (user_id, vreminder)
	RETURNING id INTO user_id;
	RETURN user_id;
END
$$;


ALTER FUNCTION coretek.others_set_self_reminder(user_id integer, vreminder character varying) OWNER TO audit;

--
-- TOC entry 458 (class 1255 OID 35550)
-- Name: statistics_get_all_auditers(date, date); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.statistics_get_all_auditers(date_low date, date_high date) RETURNS TABLE(name text, qtt_audited bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY WITH full_query AS 
	(SELECT id, date_placed, auditer_id, ROW_NUMBER() OVER(PARTITION BY id , auditer_id
											   ORDER BY date_placed ASC) 
	 FROM coretek.audit)
	 
	SELECT lc.first_name || ' ' || lc.last_name AS name, count(*) FROM full_query
	INNER JOIN coretek.login_credentials lc ON full_query.auditer_id = lc.id
	WHERE row_number = 1
	AND date_placed::date BETWEEN date_low::date AND date_high::date
	GROUP BY lc.id;

END
$$;


ALTER FUNCTION coretek.statistics_get_all_auditers(date_low date, date_high date) OWNER TO audit;

--
-- TOC entry 469 (class 1255 OID 35656)
-- Name: user_change_password(character varying, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_change_password(vident character varying, vnew_pass character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	UPDATE coretek.login_credentials
	SET password = vnew_pass, change_pass = false
	WHERE identification = vident
	RETURNING "id" INTO vident;
	RETURN vident;
END
$$;


ALTER FUNCTION coretek.user_change_password(vident character varying, vnew_pass character varying) OWNER TO audit;

--
-- TOC entry 415 (class 1255 OID 17276)
-- Name: user_edit(integer, character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_edit(v_id integer, vfirstname character varying, vlastname character varying, vlogin character varying, vnewtoken character varying, vhash character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE rid integer;
BEGIN
	IF LENGTH(vnewtoken) = 80 AND LENGTH(vhash) > 95 THEN
		UPDATE coretek.login_credentials l
		SET first_name = vfirstname,
		last_name = vlastname,
		login = vlogin,
		"password" = vhash,
		"token" = vnewtoken,
		change_pass = true
		WHERE l.id = v_id
		RETURNING l.id INTO rid;
	ELSE
		UPDATE coretek.login_credentials l
		SET first_name = vfirstname,
		last_name = vlastname,
		login = vlogin
		WHERE l.id = v_id
		RETURNING l.id INTO rid;
	END IF;
	RETURN rid;
END
$$;


ALTER FUNCTION coretek.user_edit(v_id integer, vfirstname character varying, vlastname character varying, vlogin character varying, vnewtoken character varying, vhash character varying) OWNER TO audit;

--
-- TOC entry 340 (class 1255 OID 17317)
-- Name: user_edit_adm(integer, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_edit_adm(user_id integer, uadm_level integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE modified integer := 0;
BEGIN
	DELETE FROM coretek.adm_level WHERE person_id = user_id;
	IF (uadm_level >= 1 AND uadm_level <= 999) THEN
		INSERT INTO coretek.adm_level (person_id, level) VALUES (user_id, uadm_level)
		RETURNING person_id INTO modified;
	END IF;
	RETURN modified;
END
$$;


ALTER FUNCTION coretek.user_edit_adm(user_id integer, uadm_level integer) OWNER TO audit;

--
-- TOC entry 338 (class 1255 OID 17192)
-- Name: user_edit_permissions(integer, json); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_edit_permissions(user_id integer, permission_array json) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE json_row json;
DECLARE vkey character varying;
DECLARE vvalue character varying;
DECLARE keyvalue integer;
DECLARE checked bool;
BEGIN
	DELETE FROM coretek.person_permission WHERE person_id = user_id;
	FOR json_row IN SELECT * FROM json_array_elements(permission_array) LOOP
		FOR vkey, vvalue IN SELECT * FROM json_each_text(json_row) LOOP
			IF vkey = 'v_id' THEN
				keyvalue = vvalue;
			ELSEIF vkey = 'checked' THEN
				checked = vvalue;
			END IF;
		END LOOP;
		IF checked THEN
			INSERT INTO coretek.person_permission (person_id, permission_id) VALUES (user_id, keyvalue);
		END IF;
	END LOOP;
	RETURN TRUE;
END
$$;


ALTER FUNCTION coretek.user_edit_permissions(user_id integer, permission_array json) OWNER TO audit;

--
-- TOC entry 323 (class 1255 OID 17173)
-- Name: user_extend_token(character, character); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_extend_token(user_token character, user_identification character) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE token_time timestamp;
BEGIN
	SELECT l.token_expire_at 
	INTO token_time 
	FROM login_credentials l 
	WHERE user_token = l."token"
	AND user_identification = l.identification;
	IF token_time > NOW() AND token_time < NOW() + interval '2 hours' THEN
		UPDATE login_credentials
		SET token_expire_at = NOW() + interval '2 hours'
		WHERE user_identification = identification AND "token" = user_token;
		RETURN true;
	ELSEIF token_time > NOW() THEN
		RETURN true;
	END IF;
	RETURN false;
END
$$;


ALTER FUNCTION coretek.user_extend_token(user_token character, user_identification character) OWNER TO audit;

--
-- TOC entry 389 (class 1255 OID 34666)
-- Name: user_get_all(); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_get_all() RETURNS TABLE(v_id integer, v_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	RETURN QUERY
	SELECT "id", (first_name || ' ' || last_name)
	FROM coretek.login_credentials
	ORDER BY first_name, last_name;
END
$$;


ALTER FUNCTION coretek.user_get_all() OWNER TO audit;

--
-- TOC entry 471 (class 1255 OID 35658)
-- Name: user_get_credentials(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_get_credentials(username character varying) RETURNS TABLE(user_password character varying, user_token character, user_identification character, token_expired boolean, change_pass boolean)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 1
    AS $$
BEGIN
	RETURN QUERY
	SELECT l."password", 
		l."token", 
		l.identification, 
		CASE WHEN l."token_expire_at" < NOW() THEN true ELSE false END,
		l.change_pass
	FROM login_credentials l 
	WHERE username = l.login
	LIMIT 1;
END
$$;


ALTER FUNCTION coretek.user_get_credentials(username character varying) OWNER TO audit;

--
-- TOC entry 472 (class 1255 OID 35654)
-- Name: user_get_pass_from_ident(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_get_pass_from_ident(vident character varying) RETURNS character varying
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN 
	SELECT lc.password INTO vident
	FROM coretek.login_credentials lc
	WHERE lc.identification = vident;
	RETURN vident;
END
$$;


ALTER FUNCTION coretek.user_get_pass_from_ident(vident character varying) OWNER TO audit;

--
-- TOC entry 353 (class 1255 OID 17327)
-- Name: user_get_specific_credentials(integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_get_specific_credentials(user_id integer) RETURNS TABLE(userid integer, fname character varying, lname character varying, ulogin character varying, admin_level smallint)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 1
    AS $$
DECLARE user_adm_level smallint;
BEGIN
	
	RAISE NOTICE 'adm level: %', (SELECT "level" FROM coretek.adm_level WHERE person_id = 23);
	RETURN QUERY SELECT l."id", l.first_name, l.last_name, l.login, 
		CASE WHEN EXISTS (SELECT ad."level"
						  FROM coretek.adm_level ad
						  WHERE user_id = ad.person_id) 
		THEN (SELECT ad."level"
	    FROM coretek.adm_level ad
	    WHERE user_id = ad.person_id) ELSE 0::smallint END
	FROM coretek.login_credentials l
	WHERE user_id = "id"
	LIMIT 1;
END
$$;


ALTER FUNCTION coretek.user_get_specific_credentials(user_id integer) OWNER TO audit;

--
-- TOC entry 315 (class 1255 OID 17262)
-- Name: user_get_specific_permissions(integer); Type: FUNCTION; Schema: coretek; Owner: rafael
--

CREATE FUNCTION coretek.user_get_specific_permissions(user_id integer) RETURNS SETOF integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
	RETURN QUERY 
	SELECT permission_id 
	FROM coretek.person_permission
	WHERE person_id = user_id;
END
$$;


ALTER FUNCTION coretek.user_get_specific_permissions(user_id integer) OWNER TO rafael;

--
-- TOC entry 329 (class 1255 OID 17171)
-- Name: user_login_token(character, character); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_login_token(v_token character, v_identification character) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE able_to_login bool;

BEGIN	
	IF EXISTS (SELECT p.permission_id FROM person_permission p
	   INNER JOIN login_credentials l ON p.person_id = l.id
	   WHERE l.identification = v_identification AND l.token = v_token AND p.permission_id = 4) THEN
	   RETURN TRUE;
	ELSE RETURN FALSE;
	END IF;
END
$$;


ALTER FUNCTION coretek.user_login_token(v_token character, v_identification character) OWNER TO audit;

--
-- TOC entry 328 (class 1255 OID 17170)
-- Name: user_login_username(character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_login_username(v_username character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE able_to_login bool;
BEGIN
	IF EXISTS (SELECT p.permission_id FROM person_permission p
	   INNER JOIN login_credentials l ON p.person_id = l.id
	   WHERE l.login = v_username AND p.permission_id = 4) THEN
	   RETURN TRUE;
	ELSE RETURN FALSE;
	END IF;
	
END
$$;


ALTER FUNCTION coretek.user_login_username(v_username character varying) OWNER TO audit;

--
-- TOC entry 316 (class 1255 OID 17324)
-- Name: user_my_id(character, character); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_my_id(v_identification character, v_token character) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN	
	RETURN (SELECT l."id" FROM coretek.login_credentials l 
	WHERE v_token = l.token AND v_identification = l.identification);
END
$$;


ALTER FUNCTION coretek.user_my_id(v_identification character, v_token character) OWNER TO audit;

--
-- TOC entry 314 (class 1255 OID 17306)
-- Name: user_self_adm_level(character, character); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_self_adm_level(uidentifier character, utoken character) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE my_level integer;
BEGIN
	SELECT a."level" INTO my_level
	FROM coretek.adm_level a
	INNER JOIN login_credentials l ON a.person_id = l.id
	WHERE l.token = utoken AND l.identification = uidentifier;
	RETURN my_level;
END
$$;


ALTER FUNCTION coretek.user_self_adm_level(uidentifier character, utoken character) OWNER TO audit;

--
-- TOC entry 341 (class 1255 OID 17279)
-- Name: user_self_permissions(character varying, character varying); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_self_permissions(my_ident character varying, my_token character varying) RETURNS TABLE(perm integer)
    LANGUAGE plpgsql SECURITY DEFINER ROWS 100
    AS $$
DECLARE my_id integer;
BEGIN 
	SELECT l.id 
	INTO my_id 
	FROM login_credentials l 
	WHERE l.identification = my_ident 
	AND l.token = my_token;
	
	RETURN QUERY
	SELECT p.permission_id FROM person_permission p 
	WHERE p.person_id = my_id
	LIMIT 100;
END
$$;


ALTER FUNCTION coretek.user_self_permissions(my_ident character varying, my_token character varying) OWNER TO audit;

--
-- TOC entry 414 (class 1255 OID 17230)
-- Name: user_token_intrusion(inet); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_token_intrusion(ip inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE failed_token_time timestamp with time zone;
BEGIN
	SELECT l.failed_time[array_length(l.failed_time, 1) - 500]
	INTO failed_token_time
	FROM coretek.login_attempts_token l
	WHERE ip = l.ip_address;
	
	RETURN CASE WHEN failed_token_time + interval '24 hours' > NOW() THEN true ELSE false END;
END
$$;


ALTER FUNCTION coretek.user_token_intrusion(ip inet) OWNER TO audit;

--
-- TOC entry 324 (class 1255 OID 17174)
-- Name: user_update_token(character, character); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_update_token(old_token character, new_token character) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE token_time timestamp;
BEGIN
	SELECT l.token_expire_at INTO token_time FROM login_credentials l WHERE old_token = l."token";
	IF token_time < NOW() THEN
		UPDATE login_credentials
		SET "token" = new_token, token_expire_at = NOW() + interval '9 hours'
		WHERE "token" = old_token;
		RETURN true;
	END IF;
	RETURN false;
END
$$;


ALTER FUNCTION coretek.user_update_token(old_token character, new_token character) OWNER TO audit;

--
-- TOC entry 327 (class 1255 OID 17176)
-- Name: user_verify_permission(character, character, integer); Type: FUNCTION; Schema: coretek; Owner: audit
--

CREATE FUNCTION coretek.user_verify_permission(owner_token character, owner_ident character, v_permission_id integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
	IF EXISTS (SELECT p.permission_id FROM person_permission p 
	INNER JOIN login_credentials l ON l.id = p.person_id
	WHERE l.token = owner_token AND l.identification = owner_ident
	AND p.permission_id = v_permission_id) 
	THEN RETURN TRUE;
	ELSE RETURN FALSE;
	
	END IF;
END
$$;


ALTER FUNCTION coretek.user_verify_permission(owner_token character, owner_ident character, v_permission_id integer) OWNER TO audit;

--
-- TOC entry 476 (class 1255 OID 44031)
-- Name: drive_get_job_report(integer, integer); Type: FUNCTION; Schema: drive_r2; Owner: coretek
--

CREATE FUNCTION drive_r2.drive_get_job_report(v_id integer, v_detail integer) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE drives_json json;
BEGIN 
	IF v_detail = 1 THEN
		SELECT json_build_object(
			'working_drives', (
				SELECT json_agg(row_to_json(drives_selected))
				FROM (SELECT DISTINCT ON (serial_number) d.serial_number,
						d.size,
						dm.name,
						wipe_start,
						wipe_end,
						wipe_config
					FROM drive_r2.drive d
					INNER JOIN drive_r2.drive_model dm ON dm.id = d.drive_model_id
					WHERE customer_job_id = v_id
					ORDER BY serial_number, datetime_placed DESC NULLS LAST
				)AS drives_selected
			),
			'not_working_drives',(
				SELECT json_agg(row_to_json(not_working))
				FROM (
					SELECT 
						DISTINCT ON (serial_number)
						d.serial_number,
						d.size
					FROM drive_r2.drive_not_working d
					WHERE customer_job_id = v_id
					ORDER BY serial_number, datetime_placed DESC NULLS LAST
				)AS not_working
			)
		)INTO drives_json;
		
		RETURN drives_json;
	ELSE
		RETURN '{"info": "report not done yet"}';
	END IF;
	
END
$$;


ALTER FUNCTION drive_r2.drive_get_job_report(v_id integer, v_detail integer) OWNER TO coretek;

--
-- TOC entry 475 (class 1255 OID 44012)
-- Name: insert_new_drive(integer, character varying, integer, character varying, integer, integer, numeric, integer, timestamp without time zone, timestamp without time zone, boolean); Type: FUNCTION; Schema: drive_r2; Owner: coretek
--

CREATE FUNCTION drive_r2.insert_new_drive(vjob_id integer, vmodel character varying, vsize integer, vserial_number character varying, vpower_on_hours integer, vhealth integer, vlifetime_writes numeric, vstatus integer, vwipe_start timestamp without time zone, vwipe_end timestamp without time zone, push_new_drive boolean) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE dm_id integer;
		attr_new_id integer;
		last_insert_date timestamp without time zone;
		new_drive_record integer;
BEGIN 

	--insert drive model and get drive model id
	SELECT d.id 
	INTO dm_id
	FROM drive_r2.drive_model d
	WHERE d.name = vmodel;
	
	IF dm_id IS NULL THEN
		INSERT INTO drive_r2.drive_model (name)
		VALUES (vmodel)
		RETURNING id INTO dm_id;
	END IF;
	
	--get last registry of drive (if was wiped/not wiped/first record)
	SELECT d.datetime_placed, d.id
	INTO last_insert_date, new_drive_record
	FROM drive_r2.drive d
	WHERE d.serial_number = vserial_number
	AND d.drive_model_id = dm_id
	AND d.wipe_config = vstatus
	ORDER BY datetime_placed DESC
	LIMIT 1; 
	
	
	--if drive can be found ask if wants to re-insert
	IF push_new_drive = TRUE OR (last_insert_date) IS NULL THEN
		INSERT INTO drive_r2.drive (
			customer_job_id,
			size,
			drive_model_id,
			power_on_hours,
			health,
			lifetime_writes,
			serial_number,
			wipe_start,
			wipe_end,
			wipe_config
		)
		VALUES(
			vjob_id,
			vsize,
			dm_id,
			vpower_on_hours,
			vhealth,
			vlifetime_writes,
			vserial_number,
			vwipe_start,
			vwipe_end,
			vstatus
		)
		RETURNING id INTO new_drive_record;
	ELSE 
		RETURN '{ "result": 1, "datetime": "' || last_insert_date || '"}';
	END IF;
	
	
	RETURN '{"result": 0, "value": ' || new_drive_record || '}';
END
$$;


ALTER FUNCTION drive_r2.insert_new_drive(vjob_id integer, vmodel character varying, vsize integer, vserial_number character varying, vpower_on_hours integer, vhealth integer, vlifetime_writes numeric, vstatus integer, vwipe_start timestamp without time zone, vwipe_end timestamp without time zone, push_new_drive boolean) OWNER TO coretek;

--
-- TOC entry 474 (class 1255 OID 35819)
-- Name: insert_not_working_drive(integer, integer, character varying, boolean); Type: FUNCTION; Schema: drive_r2; Owner: coretek
--

CREATE FUNCTION drive_r2.insert_not_working_drive(vjob_id integer, vsize integer, vserial_number character varying, vforce boolean) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE vdatetime timestamp without time zone;
BEGIN 
	SELECT datetime_placed
	INTO vdatetime
	FROM drive_r2.drive_not_working dnw
	WHERE dnw.customer_job_id = vjob_id
	AND dnw.serial_number = vserial_number
	AND dnw.size = vsize
	ORDER BY dnw.datetime_placed DESC
	LIMIT 1;
	
	IF vdatetime IS NOT NULL AND vforce = false THEN
		RETURN '{"info":"Drive Exitsts", "datetime": "' || vdatetime || '"}';
	ELSE
		INSERT INTO drive_r2.drive_not_working (customer_job_id, serial_number, size)
		VALUES (vjob_id, vserial_number, vsize);
		RETURN '{"success": "Drive Inserted"}';
	END IF;
	
END
$$;


ALTER FUNCTION drive_r2.insert_not_working_drive(vjob_id integer, vsize integer, vserial_number character varying, vforce boolean) OWNER TO coretek;

--
-- TOC entry 473 (class 1255 OID 35786)
-- Name: insert_smart_table(integer, character varying[]); Type: FUNCTION; Schema: drive_r2; Owner: coretek
--

CREATE FUNCTION drive_r2.insert_smart_table(vdrive_id integer, vsmart character varying[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE attr_new_id integer;
		
BEGIN 
	
	SELECT id 
	INTO attr_new_id
	FROM drive_r2.smart_attribute
	WHERE attribute_id = TRIM(vsmart[1])
	AND name = TRIM(vsmart[2]);
	
	IF attr_new_id IS NULL THEN
		INSERT INTO drive_r2.smart_attribute (attribute_id, name)
		VALUES (vsmart[1], vsmart[2])
		RETURNING id INTO attr_new_id;
	END IF;
		
	INSERT INTO drive_r2.smart_table (
		drive_id,
		smart_attribute_id,
		values
	)
	VALUES(
		vdrive_id,
		attr_new_id,
		vsmart[3:array_length(vsmart,1)]
	);
		
	RETURN 0;
END
$$;


ALTER FUNCTION drive_r2.insert_smart_table(vdrive_id integer, vsmart character varying[]) OWNER TO coretek;

--
-- TOC entry 441 (class 1255 OID 35131)
-- Name: array_undup(integer[]); Type: FUNCTION; Schema: public; Owner: rafael
--

CREATE FUNCTION public.array_undup(arr integer[]) RETURNS integer[]
    LANGUAGE sql
    AS $_$
SELECT ARRAY(
    SELECT DISTINCT $1[i]
    FROM generate_series(
        array_lower($1,1),
        array_upper($1,1)
    ) AS i
    
);
$_$;


ALTER FUNCTION public.array_undup(arr integer[]) OWNER TO rafael;

--
-- TOC entry 442 (class 1255 OID 35132)
-- Name: array_undup(bigint[]); Type: FUNCTION; Schema: public; Owner: rafael
--

CREATE FUNCTION public.array_undup(arr bigint[]) RETURNS bigint[]
    LANGUAGE sql
    AS $_$
SELECT ARRAY(
    SELECT DISTINCT $1[i]
    FROM generate_series(
        array_lower($1,1),
        array_upper($1,1)
    ) AS i
    
);
$_$;


ALTER FUNCTION public.array_undup(arr bigint[]) OWNER TO rafael;

--
-- TOC entry 354 (class 1255 OID 17394)
-- Name: job_insert_customer(character varying, character varying, character varying, character varying, character varying, integer, character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: rafael
--

CREATE FUNCTION public.job_insert_customer(vname character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, fname character varying, lname character varying, vphone character varying, cell character varying, notes character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
	DECLARE rid integer;
BEGIN
	INSERT INTO coretek.customer(
	name, address, city, state, zip, contact_first_name, contact_last_name, phone, cellphone, notes, country)
	VALUES (vname, vaddress, vcity, vstate, vzip, fName, lName, vphone, cell, notes, vcountry)
	RETURNING id INTO rid;
	RETURN rid;
END;
$$;


ALTER FUNCTION public.job_insert_customer(vname character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, fname character varying, lname character varying, vphone character varying, cell character varying, notes character varying) OWNER TO rafael;

--
-- TOC entry 339 (class 1255 OID 17229)
-- Name: user_token_intrusion(inet); Type: FUNCTION; Schema: public; Owner: rafael
--

CREATE FUNCTION public.user_token_intrusion(ip inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE failed_time timestamp with time zone;
BEGIN
	SELECT l.failed_time[array_length(l.failed_time, 1) - 100]
	INTO failed_time
	FROM login_attempts_token l
	WHERE ip = ip_addres
	LIMIT 1;
	
	RETURN CASE WHEN failed_time + interval '24 hours' > NOW() THEN true ELSE false END;
END
	
$$;


ALTER FUNCTION public.user_token_intrusion(ip inet) OWNER TO rafael;

--
-- TOC entry 322 (class 1255 OID 16780)
-- Name: verify_insert_person(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verify_insert_person() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE owner_id_test integer;
BEGIN
	RAISE NOTICE '%', TG_WHEN;
	SELECT l.id INTO owner_id_test FROM login_credentials l WHERE TG_ARGV[0] = l."token";
	IF (SELECT permission_id FROM person_permission p WHERE p.person_id = owner_id_test) = 1 THEN --admin
		RETURN NEW;
	ELSE
		RAISE EXCEPTION 'You dont have enough permissions to insert/edit logins %', TG_ARGV[0];
	END IF;
	RAISE EXCEPTION 'Server Hit a Wall';
END;
$$;


ALTER FUNCTION public.verify_insert_person() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 17290)
-- Name: adm_level; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.adm_level (
    person_id integer NOT NULL,
    level smallint NOT NULL,
    CONSTRAINT ck_admlevel_greater0_lower999 CHECK (((level >= 0) AND (level <= 999)))
);


ALTER TABLE coretek.adm_level OWNER TO audit;

--
-- TOC entry 267 (class 1259 OID 35591)
-- Name: announces; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.announces (
    info character varying(500) NOT NULL,
    login_credentials_id integer NOT NULL,
    id smallint NOT NULL,
    show boolean DEFAULT true NOT NULL
);


ALTER TABLE coretek.announces OWNER TO audit;

--
-- TOC entry 268 (class 1259 OID 35599)
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.announces ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
    CYCLE
);


--
-- TOC entry 204 (class 1259 OID 16781)
-- Name: audit; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.audit (
    id bigint NOT NULL,
    auditer_id integer NOT NULL,
    editer_id integer,
    job_id integer NOT NULL,
    audit_class_id smallint NOT NULL,
    quantity integer NOT NULL,
    notes character varying(500),
    fmv numeric(8,2) DEFAULT 0 NOT NULL,
    date_placed timestamp(0) without time zone NOT NULL,
    last_active boolean DEFAULT false NOT NULL,
    CONSTRAINT item_status_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE coretek.audit OWNER TO audit;

--
-- TOC entry 205 (class 1259 OID 16788)
-- Name: audit_class; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.audit_class (
    id smallint NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE coretek.audit_class OWNER TO audit;

--
-- TOC entry 206 (class 1259 OID 16791)
-- Name: audit_class_fields; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.audit_class_fields (
    id smallint NOT NULL,
    audit_class_id smallint NOT NULL,
    field_type_id smallint NOT NULL,
    name character varying(10) NOT NULL,
    label character varying(50) NOT NULL,
    "order" smallint DEFAULT 1 NOT NULL,
    max_entries smallint DEFAULT 1 NOT NULL,
    required boolean DEFAULT false NOT NULL
);


ALTER TABLE coretek.audit_class_fields OWNER TO audit;

--
-- TOC entry 261 (class 1259 OID 35018)
-- Name: audit_class_fields_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.audit_class_fields ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME coretek.audit_class_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 207 (class 1259 OID 16796)
-- Name: audit_class_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.audit_class ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.audit_class_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 208 (class 1259 OID 16803)
-- Name: audit_class_record; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.audit_class_record (
    audit_id bigint NOT NULL,
    audit_datetime_placed timestamp(0) without time zone NOT NULL,
    audit_class_field_id smallint NOT NULL,
    audit_class_field_audit_classid smallint NOT NULL,
    stringval character varying(100),
    numval numeric(18,6),
    "boolean" boolean,
    pre_defined_field_values_id integer
);


ALTER TABLE coretek.audit_class_record OWNER TO audit;

--
-- TOC entry 249 (class 1259 OID 25981)
-- Name: audit_issues; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.audit_issues (
    audit_id integer NOT NULL,
    audit_date_placed timestamp(0) without time zone NOT NULL,
    issue_name_id integer NOT NULL
);


ALTER TABLE coretek.audit_issues OWNER TO audit;

--
-- TOC entry 271 (class 1259 OID 35662)
-- Name: audit_presets; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.audit_presets (
    datetime_placed timestamp(0) without time zone DEFAULT now() NOT NULL,
    preset json NOT NULL,
    audit_class_id smallint NOT NULL,
    options json NOT NULL,
    name character varying(50) NOT NULL,
    preset_edit json,
    options_edit json
);


ALTER TABLE coretek.audit_presets OWNER TO audit;

--
-- TOC entry 246 (class 1259 OID 25917)
-- Name: class_issues; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.class_issues (
    issues_id integer NOT NULL,
    audit_class_id integer NOT NULL
);


ALTER TABLE coretek.class_issues OWNER TO audit;

--
-- TOC entry 210 (class 1259 OID 16818)
-- Name: customer; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.customer (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address character varying(100),
    city character varying(50),
    state character varying(80),
    zip integer,
    contact_first_name character varying(40),
    contact_last_name character varying(40),
    phone character varying(15),
    cellphone character varying(15),
    notes character varying(500),
    country character varying(100)
);


ALTER TABLE coretek.customer OWNER TO audit;

--
-- TOC entry 211 (class 1259 OID 16824)
-- Name: customer_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.customer ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 212 (class 1259 OID 16826)
-- Name: customer_job; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.customer_job (
    id integer NOT NULL,
    login_id integer NOT NULL,
    customer_id integer NOT NULL,
    job_name_id integer NOT NULL,
    job_number_id integer NOT NULL,
    plant_id integer NOT NULL,
    expectation character varying(1000),
    priority smallint DEFAULT 1,
    customer_job_place_id smallint NOT NULL,
    datetime_created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE coretek.customer_job OWNER TO audit;

--
-- TOC entry 213 (class 1259 OID 16832)
-- Name: customer_job_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.customer_job ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.customer_job_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 214 (class 1259 OID 16834)
-- Name: customer_job_place; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.customer_job_place (
    id smallint NOT NULL,
    name character varying(40) NOT NULL
);


ALTER TABLE coretek.customer_job_place OWNER TO audit;

--
-- TOC entry 215 (class 1259 OID 16837)
-- Name: customer_job_place_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.customer_job_place ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.customer_job_place_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 254 (class 1259 OID 34757)
-- Name: customer_sell; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.customer_sell (
    id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    address character varying(80),
    city character varying(80),
    state character varying(80),
    zip integer,
    country character varying(60),
    notes character varying(500),
    middle_name character varying(100),
    last_name character varying(50),
    phone character varying(20),
    cell character varying(20)
);


ALTER TABLE coretek.customer_sell OWNER TO audit;

--
-- TOC entry 253 (class 1259 OID 34755)
-- Name: customer_sell_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.customer_sell ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.customer_sell_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 216 (class 1259 OID 16839)
-- Name: field_types; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.field_types (
    id smallint NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(100) NOT NULL
);


ALTER TABLE coretek.field_types OWNER TO audit;

--
-- TOC entry 217 (class 1259 OID 16842)
-- Name: field_types_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.field_types ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.field_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 248 (class 1259 OID 25927)
-- Name: issue_name; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.issue_name (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE coretek.issue_name OWNER TO audit;

--
-- TOC entry 247 (class 1259 OID 25925)
-- Name: issue_name_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.issue_name ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.issue_name_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 16844)
-- Name: job_name; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.job_name (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    name character varying(60) NOT NULL
);


ALTER TABLE coretek.job_name OWNER TO audit;

--
-- TOC entry 219 (class 1259 OID 16847)
-- Name: job_name_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.job_name ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.job_name_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 16849)
-- Name: job_number; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.job_number (
    id integer NOT NULL,
    job_name_id integer NOT NULL,
    number character varying(100) NOT NULL,
    date date NOT NULL
);


ALTER TABLE coretek.job_number OWNER TO audit;

--
-- TOC entry 221 (class 1259 OID 16852)
-- Name: job_number_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.job_number ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.job_number_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 242 (class 1259 OID 17488)
-- Name: job_place_name; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.job_place_name (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE coretek.job_place_name OWNER TO audit;

--
-- TOC entry 243 (class 1259 OID 17498)
-- Name: job_place_requested; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.job_place_requested (
    customer_job_place_id integer NOT NULL,
    customer_job_name_id integer NOT NULL
);


ALTER TABLE coretek.job_place_requested OWNER TO audit;

--
-- TOC entry 222 (class 1259 OID 16854)
-- Name: job_requested; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.job_requested (
    id integer NOT NULL,
    job_services_id integer NOT NULL,
    customer_job_id integer NOT NULL
);


ALTER TABLE coretek.job_requested OWNER TO audit;

--
-- TOC entry 223 (class 1259 OID 16857)
-- Name: job_requested_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.job_requested ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.job_requested_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 16859)
-- Name: job_services; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.job_services (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE coretek.job_services OWNER TO audit;

--
-- TOC entry 225 (class 1259 OID 16862)
-- Name: job_services_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.job_services ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.job_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 16869)
-- Name: login_attempts_ip; Type: TABLE; Schema: coretek; Owner: postgres
--

CREATE TABLE coretek.login_attempts_ip (
    ip_address inet NOT NULL,
    attempt_datetime timestamp(0) with time zone[] NOT NULL
);


ALTER TABLE coretek.login_attempts_ip OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 17210)
-- Name: login_attempts_token; Type: TABLE; Schema: coretek; Owner: postgres
--

CREATE TABLE coretek.login_attempts_token (
    ip_address inet NOT NULL,
    failed_time timestamp(0) with time zone[] NOT NULL
);


ALTER TABLE coretek.login_attempts_token OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16875)
-- Name: login_attempts_user; Type: TABLE; Schema: coretek; Owner: postgres
--

CREATE TABLE coretek.login_attempts_user (
    login_name character varying(50) NOT NULL,
    failed_datetime timestamp(0) with time zone[] NOT NULL
);


ALTER TABLE coretek.login_attempts_user OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16864)
-- Name: login_credentials; Type: TABLE; Schema: coretek; Owner: postgres
--

CREATE TABLE coretek.login_credentials (
    id integer NOT NULL,
    first_name character varying(30) NOT NULL,
    last_name character varying(30) NOT NULL,
    login character varying(20) NOT NULL,
    password character varying(150) NOT NULL,
    token character(80) NOT NULL,
    token_expire_at timestamp(0) with time zone NOT NULL,
    identification character(20) NOT NULL,
    change_pass boolean DEFAULT true NOT NULL
);


ALTER TABLE coretek.login_credentials OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 35559)
-- Name: login_credentials_id_seq; Type: SEQUENCE; Schema: coretek; Owner: postgres
--

ALTER TABLE coretek.login_credentials ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.login_credentials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 256 (class 1259 OID 34839)
-- Name: order_audit_permission; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.order_audit_permission (
    id smallint NOT NULL,
    name character varying(30) NOT NULL
);


ALTER TABLE coretek.order_audit_permission OWNER TO audit;

--
-- TOC entry 229 (class 1259 OID 16881)
-- Name: orders; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.orders (
    id bigint NOT NULL,
    ship_to_history_id integer,
    order_status_id smallint NOT NULL,
    order_payment_status_id smallint NOT NULL,
    datetime timestamp(0) without time zone,
    datetime_modified timestamp(0) without time zone NOT NULL,
    notes character varying(500),
    customer_sell_id integer,
    paid numeric(18,2),
    last_valid boolean DEFAULT true NOT NULL
);


ALTER TABLE coretek.orders OWNER TO audit;

--
-- TOC entry 230 (class 1259 OID 16887)
-- Name: order_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.orders ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME coretek.order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 16889)
-- Name: order_payment_status; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.order_payment_status (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE coretek.order_payment_status OWNER TO audit;

--
-- TOC entry 232 (class 1259 OID 16892)
-- Name: order_payment_status_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.order_payment_status ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.order_payment_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 255 (class 1259 OID 34814)
-- Name: order_requested; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.order_requested (
    audit_id bigint NOT NULL,
    order_id bigint NOT NULL,
    quantity integer NOT NULL,
    order_datetime_modified timestamp(0) without time zone,
    price numeric(17,2) DEFAULT 0,
    CONSTRAINT quantity_greater_zero CHECK ((quantity > 0))
);


ALTER TABLE coretek.order_requested OWNER TO audit;

--
-- TOC entry 233 (class 1259 OID 16894)
-- Name: order_status; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.order_status (
    id smallint NOT NULL,
    name character varying(30) NOT NULL,
    order_status_permission_id smallint NOT NULL,
    order_audit_permission_id smallint NOT NULL
);


ALTER TABLE coretek.order_status OWNER TO audit;

--
-- TOC entry 234 (class 1259 OID 16897)
-- Name: order_status_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.order_status ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.order_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 257 (class 1259 OID 34854)
-- Name: order_status_permission; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.order_status_permission (
    id smallint NOT NULL,
    name character varying(30) NOT NULL
);


ALTER TABLE coretek.order_status_permission OWNER TO audit;

--
-- TOC entry 264 (class 1259 OID 35510)
-- Name: permission_group; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.permission_group (
    id smallint NOT NULL,
    name character varying(35) NOT NULL
);


ALTER TABLE coretek.permission_group OWNER TO audit;

--
-- TOC entry 235 (class 1259 OID 16899)
-- Name: permission_name; Type: TABLE; Schema: coretek; Owner: postgres
--

CREATE TABLE coretek.permission_name (
    id smallint NOT NULL,
    name character varying(35) NOT NULL,
    "group" smallint DEFAULT 0 NOT NULL
);


ALTER TABLE coretek.permission_name OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16902)
-- Name: person_permission; Type: TABLE; Schema: coretek; Owner: postgres
--

CREATE TABLE coretek.person_permission (
    person_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE coretek.person_permission OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16905)
-- Name: plant_location; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.plant_location (
    id smallint NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE coretek.plant_location OWNER TO audit;

--
-- TOC entry 238 (class 1259 OID 16908)
-- Name: plant_location_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.plant_location ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.plant_location_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 244 (class 1259 OID 17621)
-- Name: pre_defined_field_values; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.pre_defined_field_values (
    id integer NOT NULL,
    audit_class_fields_id smallint NOT NULL,
    string_value character varying(100) NOT NULL,
    audit_class_fields_audit_class_id integer NOT NULL
);


ALTER TABLE coretek.pre_defined_field_values OWNER TO audit;

--
-- TOC entry 245 (class 1259 OID 17713)
-- Name: pre_defined_field_values_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.pre_defined_field_values ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.pre_defined_field_values_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 270 (class 1259 OID 35634)
-- Name: reminders; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.reminders (
    id integer NOT NULL,
    login_credentials_id integer NOT NULL,
    reminder character varying(500)
);


ALTER TABLE coretek.reminders OWNER TO audit;

--
-- TOC entry 269 (class 1259 OID 35632)
-- Name: reminders_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.reminders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.reminders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 209 (class 1259 OID 16808)
-- Name: salesman; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.salesman (
    login_id integer NOT NULL
);


ALTER TABLE coretek.salesman OWNER TO audit;

--
-- TOC entry 252 (class 1259 OID 34736)
-- Name: ship_to_address; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.ship_to_address (
    customer_sell_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    address character varying(80) NOT NULL,
    city character varying(80) NOT NULL,
    state character varying(80) NOT NULL,
    zip integer NOT NULL,
    country character varying(60) NOT NULL,
    notes character varying(500),
    phone character varying(20),
    cell character varying(20),
    middle_name character varying(100),
    last_name character varying(50) NOT NULL,
    id integer NOT NULL
);


ALTER TABLE coretek.ship_to_address OWNER TO audit;

--
-- TOC entry 260 (class 1259 OID 34996)
-- Name: ship_to_address_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.ship_to_address ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.ship_to_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 258 (class 1259 OID 34930)
-- Name: ship_to_history; Type: TABLE; Schema: coretek; Owner: audit
--

CREATE TABLE coretek.ship_to_history (
    id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    address character varying(80) NOT NULL,
    city character varying(80) NOT NULL,
    state character varying(80) NOT NULL,
    zip integer NOT NULL,
    country character varying(60) NOT NULL,
    notes character varying(500),
    phone character varying(20),
    cell character varying(20),
    middle_name character varying(100),
    last_name character varying(50) NOT NULL
);


ALTER TABLE coretek.ship_to_history OWNER TO audit;

--
-- TOC entry 259 (class 1259 OID 34936)
-- Name: ship_to_history_id_seq; Type: SEQUENCE; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.ship_to_history ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME coretek.ship_to_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 278 (class 1259 OID 35737)
-- Name: drive; Type: TABLE; Schema: drive_r2; Owner: coretek
--

CREATE TABLE drive_r2.drive (
    id integer NOT NULL,
    customer_job_id integer NOT NULL,
    size integer NOT NULL,
    drive_model_id integer NOT NULL,
    power_on_hours integer NOT NULL,
    health integer NOT NULL,
    lifetime_writes numeric(19,6),
    serial_number character varying(50) NOT NULL,
    wipe_config integer NOT NULL,
    datetime_placed timestamp(0) without time zone DEFAULT now() NOT NULL,
    wipe_start timestamp(0) without time zone,
    wipe_end timestamp(0) without time zone
);


ALTER TABLE drive_r2.drive OWNER TO coretek;

--
-- TOC entry 277 (class 1259 OID 35735)
-- Name: drive_id_seq; Type: SEQUENCE; Schema: drive_r2; Owner: coretek
--

ALTER TABLE drive_r2.drive ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME drive_r2.drive_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 273 (class 1259 OID 35715)
-- Name: drive_model; Type: TABLE; Schema: drive_r2; Owner: coretek
--

CREATE TABLE drive_r2.drive_model (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE drive_r2.drive_model OWNER TO coretek;

--
-- TOC entry 272 (class 1259 OID 35713)
-- Name: drive_model_id_seq; Type: SEQUENCE; Schema: drive_r2; Owner: coretek
--

ALTER TABLE drive_r2.drive_model ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME drive_r2.drive_model_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 279 (class 1259 OID 35805)
-- Name: drive_not_working; Type: TABLE; Schema: drive_r2; Owner: coretek
--

CREATE TABLE drive_r2.drive_not_working (
    customer_job_id integer NOT NULL,
    serial_number character varying(150) NOT NULL,
    size integer NOT NULL,
    datetime_placed timestamp(0) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE drive_r2.drive_not_working OWNER TO coretek;

--
-- TOC entry 275 (class 1259 OID 35722)
-- Name: smart_attribute; Type: TABLE; Schema: drive_r2; Owner: coretek
--

CREATE TABLE drive_r2.smart_attribute (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    attribute_id character varying(100)
);


ALTER TABLE drive_r2.smart_attribute OWNER TO coretek;

--
-- TOC entry 274 (class 1259 OID 35720)
-- Name: smart_attribute_id_seq; Type: SEQUENCE; Schema: drive_r2; Owner: coretek
--

ALTER TABLE drive_r2.smart_attribute ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME drive_r2.smart_attribute_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 276 (class 1259 OID 35727)
-- Name: smart_table; Type: TABLE; Schema: drive_r2; Owner: coretek
--

CREATE TABLE drive_r2.smart_table (
    drive_id integer NOT NULL,
    smart_attribute_id integer NOT NULL,
    "values" character varying(800)[] NOT NULL
);


ALTER TABLE drive_r2.smart_table OWNER TO coretek;

--
-- TOC entry 251 (class 1259 OID 26206)
-- Name: audit_history; Type: TABLE; Schema: public; Owner: rafael
--

CREATE TABLE public.audit_history (
    id bigint,
    auditer_id integer,
    editer_id integer,
    job_id integer,
    audit_class_id smallint,
    quantity integer,
    reserved integer,
    notes character varying(500),
    price numeric(8,2),
    fmv numeric(8,2),
    order_id bigint,
    date_placed timestamp(0) without time zone
);


ALTER TABLE public.audit_history OWNER TO rafael;

--
-- TOC entry 265 (class 1259 OID 35525)
-- Name: audit_permission; Type: TABLE; Schema: public; Owner: rafael
--

CREATE TABLE public.audit_permission (
    order_status_permission_id smallint
);


ALTER TABLE public.audit_permission OWNER TO rafael;

--
-- TOC entry 250 (class 1259 OID 26167)
-- Name: last_audit_time; Type: TABLE; Schema: public; Owner: rafael
--

CREATE TABLE public.last_audit_time (
    date_placed timestamp(0) without time zone
);


ALTER TABLE public.last_audit_time OWNER TO rafael;

--
-- TOC entry 262 (class 1259 OID 35461)
-- Name: qtt_in_this_order; Type: TABLE; Schema: public; Owner: rafael
--

CREATE TABLE public.qtt_in_this_order (
    quantity integer
);


ALTER TABLE public.qtt_in_this_order OWNER TO rafael;

--
-- TOC entry 241 (class 1259 OID 17321)
-- Name: rid; Type: TABLE; Schema: public; Owner: rafael
--

CREATE TABLE public.rid (
    id integer
);


ALTER TABLE public.rid OWNER TO rafael;

--
-- TOC entry 263 (class 1259 OID 35467)
-- Name: vdt_modified; Type: TABLE; Schema: public; Owner: rafael
--

CREATE TABLE public.vdt_modified (
    datetime_modified timestamp(0) without time zone
);


ALTER TABLE public.vdt_modified OWNER TO rafael;

--
-- TOC entry 3421 (class 2606 OID 17295)
-- Name: adm_level adm_level_person_id_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.adm_level
    ADD CONSTRAINT adm_level_person_id_key UNIQUE (person_id);


--
-- TOC entry 3472 (class 2606 OID 35611)
-- Name: announces announcements_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.announces
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 3341 (class 2606 OID 34707)
-- Name: audit_class_fields audit_class_fields_audit_class_id_field_type_id_label_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class_fields
    ADD CONSTRAINT audit_class_fields_audit_class_id_field_type_id_label_key UNIQUE (audit_class_id, field_type_id, label);


--
-- TOC entry 3328 (class 2606 OID 26010)
-- Name: audit_class_fields audit_class_fields_max_entries_check; Type: CHECK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.audit_class_fields
    ADD CONSTRAINT audit_class_fields_max_entries_check CHECK ((max_entries > 0)) NOT VALID;


--
-- TOC entry 3343 (class 2606 OID 35037)
-- Name: audit_class_fields audit_class_fields_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class_fields
    ADD CONSTRAINT audit_class_fields_pkey PRIMARY KEY (id, audit_class_id);


--
-- TOC entry 3337 (class 2606 OID 16915)
-- Name: audit_class audit_class_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class
    ADD CONSTRAINT audit_class_name_key UNIQUE (name);


--
-- TOC entry 3339 (class 2606 OID 16917)
-- Name: audit_class audit_class_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class
    ADD CONSTRAINT audit_class_pkey PRIMARY KEY (id);


--
-- TOC entry 3439 (class 2606 OID 25985)
-- Name: audit_issues audit_issues_audit_id_audit_date_placed_issue_name_id_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_issues
    ADD CONSTRAINT audit_issues_audit_id_audit_date_placed_issue_name_id_key UNIQUE (audit_id, audit_date_placed, issue_name_id);


--
-- TOC entry 3335 (class 2606 OID 26096)
-- Name: audit audit_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit
    ADD CONSTRAINT audit_pkey PRIMARY KEY (id, date_placed);


--
-- TOC entry 3476 (class 2606 OID 35669)
-- Name: audit_presets audit_presets_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_presets
    ADD CONSTRAINT audit_presets_pkey PRIMARY KEY (datetime_placed);


--
-- TOC entry 3433 (class 2606 OID 26025)
-- Name: class_issues class_issues_issues_id_audit_class_id_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.class_issues
    ADD CONSTRAINT class_issues_issues_id_audit_class_id_key UNIQUE (issues_id, audit_class_id);


--
-- TOC entry 3349 (class 2606 OID 16925)
-- Name: salesman contractor_login_id_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.salesman
    ADD CONSTRAINT contractor_login_id_key UNIQUE (login_id);


--
-- TOC entry 3357 (class 2606 OID 17632)
-- Name: customer_job customer_job_customer_id_job_name_id_job_number_id_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_customer_id_job_name_id_job_number_id_key UNIQUE (customer_id, job_name_id, job_number_id);


--
-- TOC entry 3359 (class 2606 OID 16935)
-- Name: customer_job customer_job_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_pkey PRIMARY KEY (id);


--
-- TOC entry 3361 (class 2606 OID 17470)
-- Name: customer_job_place customer_job_place_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job_place
    ADD CONSTRAINT customer_job_place_name_key UNIQUE (name);


--
-- TOC entry 3363 (class 2606 OID 16937)
-- Name: customer_job_place customer_job_place_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job_place
    ADD CONSTRAINT customer_job_place_pkey PRIMARY KEY (id);


--
-- TOC entry 3329 (class 2606 OID 17399)
-- Name: customer customer_name_check; Type: CHECK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE coretek.customer
    ADD CONSTRAINT customer_name_check CHECK ((length((name)::text) > 3)) NOT VALID;


--
-- TOC entry 3353 (class 2606 OID 16939)
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- TOC entry 3447 (class 2606 OID 34896)
-- Name: customer_sell customer_sell_first_name_middle-name_last_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_sell
    ADD CONSTRAINT "customer_sell_first_name_middle-name_last_name_key" UNIQUE (first_name, middle_name, last_name);


--
-- TOC entry 3454 (class 2606 OID 34764)
-- Name: customer_sell customer_sell_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_sell
    ADD CONSTRAINT customer_sell_pkey PRIMARY KEY (id);


--
-- TOC entry 3365 (class 2606 OID 16941)
-- Name: field_types field_types_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.field_types
    ADD CONSTRAINT field_types_name_key UNIQUE (name);


--
-- TOC entry 3367 (class 2606 OID 16943)
-- Name: field_types field_types_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.field_types
    ADD CONSTRAINT field_types_pkey PRIMARY KEY (id);


--
-- TOC entry 3435 (class 2606 OID 26000)
-- Name: issue_name issue_name_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.issue_name
    ADD CONSTRAINT issue_name_name_key UNIQUE (name);


--
-- TOC entry 3437 (class 2606 OID 25931)
-- Name: issue_name issue_name_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.issue_name
    ADD CONSTRAINT issue_name_pkey PRIMARY KEY (id);


--
-- TOC entry 3369 (class 2606 OID 16947)
-- Name: job_name job_name_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_name
    ADD CONSTRAINT job_name_pkey PRIMARY KEY (id);


--
-- TOC entry 3373 (class 2606 OID 17595)
-- Name: job_number job_number_job_name_id_number_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_number
    ADD CONSTRAINT job_number_job_name_id_number_key UNIQUE (job_name_id, number);


--
-- TOC entry 3375 (class 2606 OID 16951)
-- Name: job_number job_number_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_number
    ADD CONSTRAINT job_number_pkey PRIMARY KEY (id);


--
-- TOC entry 3423 (class 2606 OID 34653)
-- Name: job_place_name job_place_name_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_place_name
    ADD CONSTRAINT job_place_name_name_key UNIQUE (name);


--
-- TOC entry 3425 (class 2606 OID 17495)
-- Name: job_place_name job_place_name_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_place_name
    ADD CONSTRAINT job_place_name_pkey PRIMARY KEY (id);


--
-- TOC entry 3427 (class 2606 OID 17502)
-- Name: job_place_requested job_place_requested_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_place_requested
    ADD CONSTRAINT job_place_requested_pkey PRIMARY KEY (customer_job_place_id, customer_job_name_id);


--
-- TOC entry 3377 (class 2606 OID 16953)
-- Name: job_requested job_requested_job_services_id_job_number_id_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_requested
    ADD CONSTRAINT job_requested_job_services_id_job_number_id_key UNIQUE (job_services_id, customer_job_id);


--
-- TOC entry 3379 (class 2606 OID 16955)
-- Name: job_requested job_requested_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_requested
    ADD CONSTRAINT job_requested_pkey PRIMARY KEY (id);


--
-- TOC entry 3381 (class 2606 OID 16957)
-- Name: job_services job_services_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_services
    ADD CONSTRAINT job_services_name_key UNIQUE (name);


--
-- TOC entry 3383 (class 2606 OID 16959)
-- Name: job_services job_services_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_services
    ADD CONSTRAINT job_services_pkey PRIMARY KEY (id);


--
-- TOC entry 3419 (class 2606 OID 17217)
-- Name: login_attempts_token login_attempt_token_pkey; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.login_attempts_token
    ADD CONSTRAINT login_attempt_token_pkey PRIMARY KEY (ip_address);


--
-- TOC entry 3393 (class 2606 OID 16963)
-- Name: login_attempts_ip login_attempts_ip_pkey; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.login_attempts_ip
    ADD CONSTRAINT login_attempts_ip_pkey PRIMARY KEY (ip_address);


--
-- TOC entry 3395 (class 2606 OID 16965)
-- Name: login_attempts_user login_attempts_user_pkey; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.login_attempts_user
    ADD CONSTRAINT login_attempts_user_pkey PRIMARY KEY (login_name);


--
-- TOC entry 3385 (class 2606 OID 16961)
-- Name: login_credentials login_credentials_pkey; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.login_credentials
    ADD CONSTRAINT login_credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 3330 (class 2606 OID 16966)
-- Name: login_credentials login_credentials_token_check; Type: CHECK CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE coretek.login_credentials
    ADD CONSTRAINT login_credentials_token_check CHECK ((length((token)::text) = 80)) NOT VALID;


--
-- TOC entry 3399 (class 2606 OID 35335)
-- Name: order_payment_status order_payment_status_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_payment_status
    ADD CONSTRAINT order_payment_status_name_key UNIQUE (name);


--
-- TOC entry 3401 (class 2606 OID 16972)
-- Name: order_payment_status order_payment_status_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_payment_status
    ADD CONSTRAINT order_payment_status_pkey PRIMARY KEY (id);


--
-- TOC entry 3397 (class 2606 OID 35362)
-- Name: orders order_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.orders
    ADD CONSTRAINT order_pkey PRIMARY KEY (id, datetime_modified);


--
-- TOC entry 3403 (class 2606 OID 16976)
-- Name: order_status order_status_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_status
    ADD CONSTRAINT order_status_name_key UNIQUE (name);


--
-- TOC entry 3458 (class 2606 OID 34853)
-- Name: order_audit_permission order_status_permission_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_audit_permission
    ADD CONSTRAINT order_status_permission_name_key UNIQUE (name);


--
-- TOC entry 3462 (class 2606 OID 34860)
-- Name: order_status_permission order_status_permission_name_key1; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_status_permission
    ADD CONSTRAINT order_status_permission_name_key1 UNIQUE (name);


--
-- TOC entry 3460 (class 2606 OID 34843)
-- Name: order_audit_permission order_status_permission_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_audit_permission
    ADD CONSTRAINT order_status_permission_pkey PRIMARY KEY (id);


--
-- TOC entry 3464 (class 2606 OID 34858)
-- Name: order_status_permission order_status_permission_pkey1; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_status_permission
    ADD CONSTRAINT order_status_permission_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3405 (class 2606 OID 16978)
-- Name: order_status order_status_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_status
    ADD CONSTRAINT order_status_pkey PRIMARY KEY (id);


--
-- TOC entry 3407 (class 2606 OID 16980)
-- Name: permission_name permission-name_pkey; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.permission_name
    ADD CONSTRAINT "permission-name_pkey" PRIMARY KEY (id);


--
-- TOC entry 3468 (class 2606 OID 35516)
-- Name: permission_group permission_group_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.permission_group
    ADD CONSTRAINT permission_group_name_key UNIQUE (name);


--
-- TOC entry 3470 (class 2606 OID 35514)
-- Name: permission_group permission_group_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.permission_group
    ADD CONSTRAINT permission_group_pkey PRIMARY KEY (id);


--
-- TOC entry 3409 (class 2606 OID 16982)
-- Name: permission_name permission_name_name_key; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.permission_name
    ADD CONSTRAINT permission_name_name_key UNIQUE (name);


--
-- TOC entry 3411 (class 2606 OID 16984)
-- Name: person_permission person-permission_pkey; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.person_permission
    ADD CONSTRAINT "person-permission_pkey" PRIMARY KEY (person_id, permission_id);


--
-- TOC entry 3413 (class 2606 OID 16986)
-- Name: person_permission person_permission_person_id_permission_id_key; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.person_permission
    ADD CONSTRAINT person_permission_person_id_permission_id_key UNIQUE (person_id, permission_id);


--
-- TOC entry 3415 (class 2606 OID 26284)
-- Name: plant_location plant_location_name_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.plant_location
    ADD CONSTRAINT plant_location_name_key UNIQUE (name);


--
-- TOC entry 3417 (class 2606 OID 16990)
-- Name: plant_location plant_location_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.plant_location
    ADD CONSTRAINT plant_location_pkey PRIMARY KEY (id);


--
-- TOC entry 3429 (class 2606 OID 35062)
-- Name: pre_defined_field_values pre_defined_field_values_audit_class_fields_id_string_value_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.pre_defined_field_values
    ADD CONSTRAINT pre_defined_field_values_audit_class_fields_id_string_value_key UNIQUE (audit_class_fields_id, string_value, audit_class_fields_audit_class_id);


--
-- TOC entry 3431 (class 2606 OID 17625)
-- Name: pre_defined_field_values pre_defined_values_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.pre_defined_field_values
    ADD CONSTRAINT pre_defined_values_pkey PRIMARY KEY (id);


--
-- TOC entry 3474 (class 2606 OID 35641)
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- TOC entry 3351 (class 2606 OID 17356)
-- Name: salesman salesman_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.salesman
    ADD CONSTRAINT salesman_pkey PRIMARY KEY (login_id);


--
-- TOC entry 3441 (class 2606 OID 34995)
-- Name: ship_to_address ship_to_address_first_name_address_city_state_country_middl_key; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.ship_to_address
    ADD CONSTRAINT ship_to_address_first_name_address_city_state_country_middl_key UNIQUE (first_name, address, city, state, country, middle_name, last_name, zip);


--
-- TOC entry 3466 (class 2606 OID 34939)
-- Name: ship_to_history ship_to_history_pkey; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.ship_to_history
    ADD CONSTRAINT ship_to_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3387 (class 2606 OID 16992)
-- Name: login_credentials uk-login-first-last-name; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.login_credentials
    ADD CONSTRAINT "uk-login-first-last-name" UNIQUE (first_name, last_name);


--
-- TOC entry 3389 (class 2606 OID 17194)
-- Name: login_credentials uk-login-login; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.login_credentials
    ADD CONSTRAINT "uk-login-login" UNIQUE (login);


--
-- TOC entry 3391 (class 2606 OID 16996)
-- Name: login_credentials ul-login-token; Type: CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.login_credentials
    ADD CONSTRAINT "ul-login-token" UNIQUE (token);


--
-- TOC entry 3355 (class 2606 OID 16998)
-- Name: customer uq_customer_name; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer
    ADD CONSTRAINT uq_customer_name UNIQUE (name);


--
-- TOC entry 3371 (class 2606 OID 17000)
-- Name: job_name uq_job_name_customer_id_name; Type: CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_name
    ADD CONSTRAINT uq_job_name_customer_id_name UNIQUE (customer_id, name);


--
-- TOC entry 3478 (class 2606 OID 35765)
-- Name: drive_model drive_model_name_key; Type: CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.drive_model
    ADD CONSTRAINT drive_model_name_key UNIQUE (name);


--
-- TOC entry 3480 (class 2606 OID 35719)
-- Name: drive_model drive_model_pkey; Type: CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.drive_model
    ADD CONSTRAINT drive_model_pkey PRIMARY KEY (id);


--
-- TOC entry 3486 (class 2606 OID 35752)
-- Name: drive drive_pkey; Type: CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.drive
    ADD CONSTRAINT drive_pkey PRIMARY KEY (id);


--
-- TOC entry 3482 (class 2606 OID 35767)
-- Name: smart_attribute smart_attribute_name_attribute_id_key; Type: CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.smart_attribute
    ADD CONSTRAINT smart_attribute_name_attribute_id_key UNIQUE (name, attribute_id);


--
-- TOC entry 3484 (class 2606 OID 35726)
-- Name: smart_attribute smart_attribute_pkey; Type: CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.smart_attribute
    ADD CONSTRAINT smart_attribute_pkey PRIMARY KEY (id);


--
-- TOC entry 3333 (class 1259 OID 26265)
-- Name: audit_last_active_idx; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX audit_last_active_idx ON coretek.audit USING btree (last_active);


--
-- TOC entry 3443 (class 1259 OID 34951)
-- Name: customer_sell_address; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_address ON coretek.customer_sell USING btree (address);


--
-- TOC entry 3444 (class 1259 OID 34952)
-- Name: customer_sell_city; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_city ON coretek.customer_sell USING btree (city);


--
-- TOC entry 3445 (class 1259 OID 34955)
-- Name: customer_sell_country; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_country ON coretek.customer_sell USING btree (country);


--
-- TOC entry 3448 (class 1259 OID 34948)
-- Name: customer_sell_fname; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_fname ON coretek.customer_sell USING btree (first_name);


--
-- TOC entry 3449 (class 1259 OID 34957)
-- Name: customer_sell_indexes; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_indexes ON coretek.customer_sell USING btree (phone, cell);


--
-- TOC entry 3450 (class 1259 OID 34950)
-- Name: customer_sell_lname; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_lname ON coretek.customer_sell USING btree (last_name);


--
-- TOC entry 3451 (class 1259 OID 34949)
-- Name: customer_sell_mname; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_mname ON coretek.customer_sell USING btree (middle_name);


--
-- TOC entry 3452 (class 1259 OID 34956)
-- Name: customer_sell_notes; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_notes ON coretek.customer_sell USING btree (notes);


--
-- TOC entry 3455 (class 1259 OID 34953)
-- Name: customer_sell_state; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_state ON coretek.customer_sell USING btree (state);


--
-- TOC entry 3456 (class 1259 OID 34954)
-- Name: customer_sell_zip; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX customer_sell_zip ON coretek.customer_sell USING btree (zip);


--
-- TOC entry 3344 (class 1259 OID 35238)
-- Name: order_search_keys_boolval; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX order_search_keys_boolval ON coretek.audit_class_record USING btree (audit_class_field_audit_classid, audit_class_field_id, "boolean");


--
-- TOC entry 3345 (class 1259 OID 35249)
-- Name: order_search_keys_numval; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX order_search_keys_numval ON coretek.audit_class_record USING btree (audit_class_field_audit_classid, audit_class_field_id, numval);


--
-- TOC entry 3346 (class 1259 OID 35236)
-- Name: order_search_keys_pre_defined; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX order_search_keys_pre_defined ON coretek.audit_class_record USING btree (audit_class_field_audit_classid, audit_class_field_id, pre_defined_field_values_id);


--
-- TOC entry 3347 (class 1259 OID 35235)
-- Name: order_search_keys_stringval; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX order_search_keys_stringval ON coretek.audit_class_record USING btree (audit_class_field_audit_classid, audit_class_field_id, stringval);


--
-- TOC entry 3442 (class 1259 OID 34920)
-- Name: shit_to_full_name; Type: INDEX; Schema: coretek; Owner: audit
--

CREATE INDEX shit_to_full_name ON coretek.ship_to_address USING btree (first_name);


--
-- TOC entry 3515 (class 2606 OID 17296)
-- Name: adm_level adm_level_person_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.adm_level
    ADD CONSTRAINT adm_level_person_id_fkey FOREIGN KEY (person_id) REFERENCES coretek.login_credentials(id);


--
-- TOC entry 3525 (class 2606 OID 35594)
-- Name: announces announcements_login_credentials_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.announces
    ADD CONSTRAINT announcements_login_credentials_id_fkey FOREIGN KEY (login_credentials_id) REFERENCES coretek.login_credentials(id) NOT VALID;


--
-- TOC entry 3487 (class 2606 OID 17001)
-- Name: audit audit_audit_class_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit
    ADD CONSTRAINT audit_audit_class_id_fkey FOREIGN KEY (audit_class_id) REFERENCES coretek.audit_class(id) NOT VALID;


--
-- TOC entry 3488 (class 2606 OID 17006)
-- Name: audit audit_auditer-id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit
    ADD CONSTRAINT "audit_auditer-id_fkey" FOREIGN KEY (auditer_id) REFERENCES coretek.login_credentials(id) NOT VALID;


--
-- TOC entry 3491 (class 2606 OID 17011)
-- Name: audit_class_fields audit_class_fields_audit_class_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class_fields
    ADD CONSTRAINT audit_class_fields_audit_class_id_fkey FOREIGN KEY (audit_class_id) REFERENCES coretek.audit_class(id);


--
-- TOC entry 3492 (class 2606 OID 17016)
-- Name: audit_class_fields audit_class_fields_field_type_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class_fields
    ADD CONSTRAINT audit_class_fields_field_type_id_fkey FOREIGN KEY (field_type_id) REFERENCES coretek.field_types(id);


--
-- TOC entry 3493 (class 2606 OID 35049)
-- Name: audit_class_record audit_class_record_audit_class_field_id_audit_class_field__fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class_record
    ADD CONSTRAINT audit_class_record_audit_class_field_id_audit_class_field__fkey FOREIGN KEY (audit_class_field_id, audit_class_field_audit_classid) REFERENCES coretek.audit_class_fields(id, audit_class_id);


--
-- TOC entry 3494 (class 2606 OID 26102)
-- Name: audit_class_record audit_class_record_audit_id_audit_datetime_placed_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class_record
    ADD CONSTRAINT audit_class_record_audit_id_audit_datetime_placed_fkey FOREIGN KEY (audit_id, audit_datetime_placed) REFERENCES coretek.audit(id, date_placed);


--
-- TOC entry 3495 (class 2606 OID 35100)
-- Name: audit_class_record audit_class_record_pre_defined_field_values_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_class_record
    ADD CONSTRAINT audit_class_record_pre_defined_field_values_id_fkey FOREIGN KEY (pre_defined_field_values_id) REFERENCES coretek.pre_defined_field_values(id);


--
-- TOC entry 3489 (class 2606 OID 17041)
-- Name: audit audit_editer-id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit
    ADD CONSTRAINT "audit_editer-id_fkey" FOREIGN KEY (editer_id) REFERENCES coretek.login_credentials(id) NOT VALID;


--
-- TOC entry 3521 (class 2606 OID 26097)
-- Name: audit_issues audit_issues_audit_id_audit_date_placed_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_issues
    ADD CONSTRAINT audit_issues_audit_id_audit_date_placed_fkey FOREIGN KEY (audit_id, audit_date_placed) REFERENCES coretek.audit(id, date_placed);


--
-- TOC entry 3522 (class 2606 OID 25991)
-- Name: audit_issues audit_issues_issue_name_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_issues
    ADD CONSTRAINT audit_issues_issue_name_id_fkey FOREIGN KEY (issue_name_id) REFERENCES coretek.issue_name(id);


--
-- TOC entry 3490 (class 2606 OID 17046)
-- Name: audit audit_job_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit
    ADD CONSTRAINT audit_job_id_fkey FOREIGN KEY (job_id) REFERENCES coretek.customer_job(id) NOT VALID;


--
-- TOC entry 3527 (class 2606 OID 35670)
-- Name: audit_presets audit_presets_audit_class_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.audit_presets
    ADD CONSTRAINT audit_presets_audit_class_id_fkey FOREIGN KEY (audit_class_id) REFERENCES coretek.audit_class(id);


--
-- TOC entry 3519 (class 2606 OID 25920)
-- Name: class_issues class_issues_audit_class_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.class_issues
    ADD CONSTRAINT class_issues_audit_class_id_fkey FOREIGN KEY (audit_class_id) REFERENCES coretek.audit_class(id);


--
-- TOC entry 3520 (class 2606 OID 25937)
-- Name: class_issues class_issues_issues_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.class_issues
    ADD CONSTRAINT class_issues_issues_id_fkey FOREIGN KEY (issues_id) REFERENCES coretek.issue_name(id) NOT VALID;


--
-- TOC entry 3496 (class 2606 OID 17051)
-- Name: salesman contractor_login_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.salesman
    ADD CONSTRAINT contractor_login_id_fkey FOREIGN KEY (login_id) REFERENCES coretek.login_credentials(id) NOT VALID;


--
-- TOC entry 3497 (class 2606 OID 17066)
-- Name: customer_job customer_job_customer_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES coretek.customer(id);


--
-- TOC entry 3498 (class 2606 OID 17471)
-- Name: customer_job customer_job_customer_job_place_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_customer_job_place_fkey FOREIGN KEY (customer_job_place_id) REFERENCES coretek.customer_job_place(id) NOT VALID;


--
-- TOC entry 3499 (class 2606 OID 17071)
-- Name: customer_job customer_job_job_name_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_job_name_id_fkey FOREIGN KEY (job_name_id) REFERENCES coretek.job_name(id);


--
-- TOC entry 3500 (class 2606 OID 17076)
-- Name: customer_job customer_job_job_number_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_job_number_id_fkey FOREIGN KEY (job_number_id) REFERENCES coretek.job_number(id);


--
-- TOC entry 3501 (class 2606 OID 17357)
-- Name: customer_job customer_job_login_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_login_id_fkey FOREIGN KEY (login_id) REFERENCES coretek.login_credentials(id) NOT VALID;


--
-- TOC entry 3502 (class 2606 OID 17081)
-- Name: customer_job customer_job_plant_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.customer_job
    ADD CONSTRAINT customer_job_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES coretek.plant_location(id);


--
-- TOC entry 3513 (class 2606 OID 17091)
-- Name: person_permission fk-permissionname-id; Type: FK CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.person_permission
    ADD CONSTRAINT "fk-permissionname-id" FOREIGN KEY (permission_id) REFERENCES coretek.permission_name(id);


--
-- TOC entry 3514 (class 2606 OID 17096)
-- Name: person_permission fk-personpermission-id; Type: FK CONSTRAINT; Schema: coretek; Owner: postgres
--

ALTER TABLE ONLY coretek.person_permission
    ADD CONSTRAINT "fk-personpermission-id" FOREIGN KEY (person_id) REFERENCES coretek.login_credentials(id);


--
-- TOC entry 3503 (class 2606 OID 17101)
-- Name: job_name job_name_customer_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_name
    ADD CONSTRAINT job_name_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES coretek.customer(id);


--
-- TOC entry 3504 (class 2606 OID 17106)
-- Name: job_number job_number_job_name_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_number
    ADD CONSTRAINT job_number_job_name_id_fkey FOREIGN KEY (job_name_id) REFERENCES coretek.job_name(id);


--
-- TOC entry 3516 (class 2606 OID 17508)
-- Name: job_place_requested job_place_requested_customer_job_name_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_place_requested
    ADD CONSTRAINT job_place_requested_customer_job_name_id_fkey FOREIGN KEY (customer_job_name_id) REFERENCES coretek.job_place_name(id);


--
-- TOC entry 3517 (class 2606 OID 17503)
-- Name: job_place_requested job_place_requested_customer_job_place_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_place_requested
    ADD CONSTRAINT job_place_requested_customer_job_place_id_fkey FOREIGN KEY (customer_job_place_id) REFERENCES coretek.customer_job_place(id);


--
-- TOC entry 3505 (class 2606 OID 17111)
-- Name: job_requested job_requested_customer_job_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_requested
    ADD CONSTRAINT job_requested_customer_job_id_fkey FOREIGN KEY (customer_job_id) REFERENCES coretek.customer_job(id) NOT VALID;


--
-- TOC entry 3506 (class 2606 OID 17116)
-- Name: job_requested job_requested_job_services_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.job_requested
    ADD CONSTRAINT job_requested_job_services_id_fkey FOREIGN KEY (job_services_id) REFERENCES coretek.job_services(id);


--
-- TOC entry 3507 (class 2606 OID 34780)
-- Name: orders order_customer_sell_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.orders
    ADD CONSTRAINT order_customer_sell_id_fkey FOREIGN KEY (customer_sell_id) REFERENCES coretek.customer_sell(id) NOT VALID;


--
-- TOC entry 3508 (class 2606 OID 17126)
-- Name: orders order_order_status_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.orders
    ADD CONSTRAINT order_order_status_id_fkey FOREIGN KEY (order_status_id) REFERENCES coretek.order_status(id);


--
-- TOC entry 3524 (class 2606 OID 35375)
-- Name: order_requested order_requested_order_id_order_datetime_modified_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_requested
    ADD CONSTRAINT order_requested_order_id_order_datetime_modified_fkey FOREIGN KEY (order_id, order_datetime_modified) REFERENCES coretek.orders(id, datetime_modified) NOT VALID;


--
-- TOC entry 3509 (class 2606 OID 34940)
-- Name: orders order_ship_to_history_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.orders
    ADD CONSTRAINT order_ship_to_history_id_fkey FOREIGN KEY (ship_to_history_id) REFERENCES coretek.ship_to_history(id) NOT VALID;


--
-- TOC entry 3511 (class 2606 OID 34866)
-- Name: order_status order_status_order_audit_permission_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_status
    ADD CONSTRAINT order_status_order_audit_permission_id_fkey FOREIGN KEY (order_audit_permission_id) REFERENCES coretek.order_status_permission(id) NOT VALID;


--
-- TOC entry 3512 (class 2606 OID 34845)
-- Name: order_status order_status_order_status_permission_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.order_status
    ADD CONSTRAINT order_status_order_status_permission_id_fkey FOREIGN KEY (order_status_permission_id) REFERENCES coretek.order_audit_permission(id) NOT VALID;


--
-- TOC entry 3510 (class 2606 OID 35349)
-- Name: orders orders_order_payment_status_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.orders
    ADD CONSTRAINT orders_order_payment_status_id_fkey FOREIGN KEY (order_payment_status_id) REFERENCES coretek.order_payment_status(id) NOT VALID;


--
-- TOC entry 3518 (class 2606 OID 35044)
-- Name: pre_defined_field_values pre_defined_field_values_audit_class_fields_id_audit_class_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.pre_defined_field_values
    ADD CONSTRAINT pre_defined_field_values_audit_class_fields_id_audit_class_fkey FOREIGN KEY (audit_class_fields_id, audit_class_fields_audit_class_id) REFERENCES coretek.audit_class_fields(id, audit_class_id) NOT VALID;


--
-- TOC entry 3526 (class 2606 OID 35642)
-- Name: reminders reminders_login_credentials_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.reminders
    ADD CONSTRAINT reminders_login_credentials_id_fkey FOREIGN KEY (login_credentials_id) REFERENCES coretek.login_credentials(id);


--
-- TOC entry 3523 (class 2606 OID 34907)
-- Name: ship_to_address ship_to_customer_sell_id_fkey; Type: FK CONSTRAINT; Schema: coretek; Owner: audit
--

ALTER TABLE ONLY coretek.ship_to_address
    ADD CONSTRAINT ship_to_customer_sell_id_fkey FOREIGN KEY (customer_sell_id) REFERENCES coretek.customer_sell(id) NOT VALID;


--
-- TOC entry 3530 (class 2606 OID 35740)
-- Name: drive drive_customer_job_id_fkey; Type: FK CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.drive
    ADD CONSTRAINT drive_customer_job_id_fkey FOREIGN KEY (customer_job_id) REFERENCES coretek.customer_job(id);


--
-- TOC entry 3531 (class 2606 OID 35745)
-- Name: drive drive_drive_model_id_fkey; Type: FK CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.drive
    ADD CONSTRAINT drive_drive_model_id_fkey FOREIGN KEY (drive_model_id) REFERENCES drive_r2.drive_model(id);


--
-- TOC entry 3532 (class 2606 OID 35808)
-- Name: drive_not_working drive_not_working_customer_job_id_fkey; Type: FK CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.drive_not_working
    ADD CONSTRAINT drive_not_working_customer_job_id_fkey FOREIGN KEY (customer_job_id) REFERENCES coretek.customer_job(id) NOT VALID;


--
-- TOC entry 3528 (class 2606 OID 35753)
-- Name: smart_table smart_table_drive_id_fkey; Type: FK CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.smart_table
    ADD CONSTRAINT smart_table_drive_id_fkey FOREIGN KEY (drive_id) REFERENCES drive_r2.drive(id) NOT VALID;


--
-- TOC entry 3529 (class 2606 OID 35758)
-- Name: smart_table smart_table_smart_attribute_id_fkey; Type: FK CONSTRAINT; Schema: drive_r2; Owner: coretek
--

ALTER TABLE ONLY drive_r2.smart_table
    ADD CONSTRAINT smart_table_smart_attribute_id_fkey FOREIGN KEY (smart_attribute_id) REFERENCES drive_r2.smart_attribute(id) NOT VALID;


--
-- TOC entry 3668 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA coretek; Type: ACL; Schema: -; Owner: audit
--

GRANT USAGE ON SCHEMA coretek TO coretek;


--
-- TOC entry 3669 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA drive_r2; Type: ACL; Schema: -; Owner: audit
--

GRANT USAGE ON SCHEMA drive_r2 TO coretek;


--
-- TOC entry 3670 (class 0 OID 0)
-- Dependencies: 8
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO audit;


--
-- TOC entry 3673 (class 0 OID 0)
-- Dependencies: 445
-- Name: FUNCTION _get_audit_fields(aid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek._get_audit_fields(aid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek._get_audit_fields(aid bigint) TO coretek;


--
-- TOC entry 3674 (class 0 OID 0)
-- Dependencies: 446
-- Name: FUNCTION _get_audit_options(aid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek._get_audit_options(aid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek._get_audit_options(aid bigint) TO coretek;


--
-- TOC entry 3675 (class 0 OID 0)
-- Dependencies: 428
-- Name: FUNCTION _get_audit_quantity_available(aid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek._get_audit_quantity_available(aid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek._get_audit_quantity_available(aid bigint) TO coretek;


--
-- TOC entry 3676 (class 0 OID 0)
-- Dependencies: 457
-- Name: FUNCTION audit_bulk_move(loc_name character varying, assets integer[], force_pass boolean, user_id integer, is_admin boolean, OUT audit_id bigint[], OUT perm smallint[]); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_bulk_move(loc_name character varying, assets integer[], force_pass boolean, user_id integer, is_admin boolean, OUT audit_id bigint[], OUT perm smallint[]) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_bulk_move(loc_name character varying, assets integer[], force_pass boolean, user_id integer, is_admin boolean, OUT audit_id bigint[], OUT perm smallint[]) TO coretek;


--
-- TOC entry 3677 (class 0 OID 0)
-- Dependencies: 456
-- Name: FUNCTION audit_change_locations(v_location character varying, v_asset bigint, v_user_id integer, v_datetime_active timestamp without time zone); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_change_locations(v_location character varying, v_asset bigint, v_user_id integer, v_datetime_active timestamp without time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_change_locations(v_location character varying, v_asset bigint, v_user_id integer, v_datetime_active timestamp without time zone) TO coretek;


--
-- TOC entry 3678 (class 0 OID 0)
-- Dependencies: 321
-- Name: FUNCTION audit_delete(vid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_delete(vid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_delete(vid bigint) TO coretek;


--
-- TOC entry 3679 (class 0 OID 0)
-- Dependencies: 439
-- Name: FUNCTION audit_edit(vuserid integer, vauditid integer, vclass integer, vquantity integer, vnotes character varying, vfields jsonb, voptions integer[]); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_edit(vuserid integer, vauditid integer, vclass integer, vquantity integer, vnotes character varying, vfields jsonb, voptions integer[]) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_edit(vuserid integer, vauditid integer, vclass integer, vquantity integer, vnotes character varying, vfields jsonb, voptions integer[]) TO coretek;


--
-- TOC entry 3680 (class 0 OID 0)
-- Dependencies: 479
-- Name: FUNCTION audit_get_available(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_available() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_available() TO coretek;


--
-- TOC entry 3681 (class 0 OID 0)
-- Dependencies: 385
-- Name: FUNCTION audit_get_datetime_history(vid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_datetime_history(vid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_datetime_history(vid bigint) TO coretek;


--
-- TOC entry 3682 (class 0 OID 0)
-- Dependencies: 440
-- Name: FUNCTION audit_get_datetime_single(vid integer, vdatetime timestamp without time zone); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_datetime_single(vid integer, vdatetime timestamp without time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_datetime_single(vid integer, vdatetime timestamp without time zone) TO coretek;


--
-- TOC entry 3683 (class 0 OID 0)
-- Dependencies: 381
-- Name: FUNCTION audit_get_field_type(vfield_type integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_field_type(vfield_type integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_field_type(vfield_type integer) TO coretek;


--
-- TOC entry 3684 (class 0 OID 0)
-- Dependencies: 460
-- Name: FUNCTION audit_get_info_and_order(intval integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_info_and_order(intval integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_info_and_order(intval integer) TO coretek;


--
-- TOC entry 3685 (class 0 OID 0)
-- Dependencies: 384
-- Name: FUNCTION audit_get_jobid(_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_jobid(_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_jobid(_id integer) TO coretek;


--
-- TOC entry 3686 (class 0 OID 0)
-- Dependencies: 455
-- Name: FUNCTION audit_get_last_entry(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_last_entry(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_last_entry(vid integer) TO coretek;


--
-- TOC entry 3687 (class 0 OID 0)
-- Dependencies: 444
-- Name: FUNCTION audit_get_permission(vid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_permission(vid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_permission(vid bigint) TO coretek;


--
-- TOC entry 3688 (class 0 OID 0)
-- Dependencies: 478
-- Name: FUNCTION audit_get_preset(vclass integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_get_preset(vclass integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_get_preset(vclass integer) TO coretek;


--
-- TOC entry 3689 (class 0 OID 0)
-- Dependencies: 449
-- Name: FUNCTION audit_set_fmv(audits jsonb); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audit_set_fmv(audits jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audit_set_fmv(audits jsonb) TO coretek;


--
-- TOC entry 3690 (class 0 OID 0)
-- Dependencies: 459
-- Name: FUNCTION audits_find(vclass integer, vfields jsonb, voptions jsonb); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.audits_find(vclass integer, vfields jsonb, voptions jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.audits_find(vclass integer, vfields jsonb, voptions jsonb) TO coretek;


--
-- TOC entry 3691 (class 0 OID 0)
-- Dependencies: 383
-- Name: FUNCTION class_add_field(vname character varying, vuuid character varying, vbox integer, vclass integer, vorder integer, vmax_entries integer, vrequired boolean); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.class_add_field(vname character varying, vuuid character varying, vbox integer, vclass integer, vorder integer, vmax_entries integer, vrequired boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.class_add_field(vname character varying, vuuid character varying, vbox integer, vclass integer, vorder integer, vmax_entries integer, vrequired boolean) TO coretek;


--
-- TOC entry 3692 (class 0 OID 0)
-- Dependencies: 312
-- Name: FUNCTION class_add_issue(classid integer, issueid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.class_add_issue(classid integer, issueid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.class_add_issue(classid integer, issueid integer) TO coretek;


--
-- TOC entry 3693 (class 0 OID 0)
-- Dependencies: 356
-- Name: FUNCTION class_add_new(class_name character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.class_add_new(class_name character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.class_add_new(class_name character varying) TO coretek;


--
-- TOC entry 3694 (class 0 OID 0)
-- Dependencies: 426
-- Name: FUNCTION class_add_option_field(vid integer, vname character varying, vclass_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.class_add_option_field(vid integer, vname character varying, vclass_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.class_add_option_field(vid integer, vname character varying, vclass_id integer) TO coretek;


--
-- TOC entry 3695 (class 0 OID 0)
-- Dependencies: 317
-- Name: FUNCTION class_delete(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.class_delete(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.class_delete(vid integer) TO coretek;


--
-- TOC entry 3696 (class 0 OID 0)
-- Dependencies: 403
-- Name: FUNCTION class_get_fields(class_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.class_get_fields(class_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.class_get_fields(class_id integer) TO coretek;


--
-- TOC entry 3697 (class 0 OID 0)
-- Dependencies: 391
-- Name: FUNCTION classes_get(); Type: ACL; Schema: coretek; Owner: rafael
--

REVOKE ALL ON FUNCTION coretek.classes_get() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.classes_get() TO audit;
GRANT ALL ON FUNCTION coretek.classes_get() TO coretek;


--
-- TOC entry 3698 (class 0 OID 0)
-- Dependencies: 438
-- Name: FUNCTION field_change_properties(vid integer, classid integer, vorder integer, ventries integer, vrequired boolean); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.field_change_properties(vid integer, classid integer, vorder integer, ventries integer, vrequired boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.field_change_properties(vid integer, classid integer, vorder integer, ventries integer, vrequired boolean) TO coretek;


--
-- TOC entry 3699 (class 0 OID 0)
-- Dependencies: 336
-- Name: FUNCTION field_delete_option(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.field_delete_option(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.field_delete_option(vid integer) TO coretek;


--
-- TOC entry 3700 (class 0 OID 0)
-- Dependencies: 427
-- Name: FUNCTION field_get_values(field_id integer, vclass_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.field_get_values(field_id integer, vclass_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.field_get_values(field_id integer, vclass_id integer) TO coretek;


--
-- TOC entry 3701 (class 0 OID 0)
-- Dependencies: 450
-- Name: FUNCTION get_all_permissions(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.get_all_permissions() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.get_all_permissions() TO coretek;


--
-- TOC entry 3702 (class 0 OID 0)
-- Dependencies: 313
-- Name: FUNCTION insert_contractor(v_login_id integer); Type: ACL; Schema: coretek; Owner: postgres
--

GRANT ALL ON FUNCTION coretek.insert_contractor(v_login_id integer) TO coretek;


--
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 419
-- Name: FUNCTION insert_person(first_name character varying, last_name character varying, login character varying, passwd character, generated_token character varying, ident character); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.insert_person(first_name character varying, last_name character varying, login character varying, passwd character, generated_token character varying, ident character) TO coretek;


--
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 319
-- Name: FUNCTION issue_add(vissue character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.issue_add(vissue character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.issue_add(vissue character varying) TO coretek;


--
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 320
-- Name: FUNCTION issue_delete(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.issue_delete(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.issue_delete(vid integer) TO coretek;


--
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 379
-- Name: FUNCTION issue_delete_from_class(classid integer, optionid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.issue_delete_from_class(classid integer, optionid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.issue_delete_from_class(classid integer, optionid integer) TO coretek;


--
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 393
-- Name: FUNCTION issue_get(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.issue_get() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.issue_get() TO coretek;


--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 398
-- Name: FUNCTION issue_get_from_class(classid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.issue_get_from_class(classid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.issue_get_from_class(classid integer) TO coretek;


--
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 360
-- Name: FUNCTION job_add_customer_job(vsalesman integer, vcustomer integer, vjobname integer, vnumber integer, vplacement integer, vplant integer, vexpectation character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_add_customer_job(vsalesman integer, vcustomer integer, vjobname integer, vnumber integer, vplacement integer, vplant integer, vexpectation character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_add_customer_job(vsalesman integer, vcustomer integer, vjobname integer, vnumber integer, vplacement integer, vplant integer, vexpectation character varying) TO coretek;


--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 335
-- Name: FUNCTION job_add_number(job_id integer, job_number character varying, job_date date); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_add_number(job_id integer, job_number character varying, job_date date) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_add_number(job_id integer, job_number character varying, job_date date) TO coretek;


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 359
-- Name: FUNCTION job_add_placement(vplace character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_add_placement(vplace character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_add_placement(vplace character varying) TO coretek;


--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 281
-- Name: FUNCTION job_add_service(svcr character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_add_service(svcr character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_add_service(svcr character varying) TO coretek;


--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 337
-- Name: FUNCTION job_delete(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_delete(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_delete(vid integer) TO coretek;


--
-- TOC entry 3714 (class 0 OID 0)
-- Dependencies: 399
-- Name: FUNCTION job_delete_number(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_delete_number(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_delete_number(vid integer) TO coretek;


--
-- TOC entry 3715 (class 0 OID 0)
-- Dependencies: 409
-- Name: FUNCTION job_delete_plant(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_delete_plant(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_delete_plant(vid integer) TO coretek;


--
-- TOC entry 3716 (class 0 OID 0)
-- Dependencies: 282
-- Name: FUNCTION job_delete_reg_placement(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_delete_reg_placement(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_delete_reg_placement(vid integer) TO coretek;


--
-- TOC entry 3717 (class 0 OID 0)
-- Dependencies: 331
-- Name: FUNCTION job_delete_salesman(userid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_delete_salesman(userid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_delete_salesman(userid integer) TO coretek;


--
-- TOC entry 3718 (class 0 OID 0)
-- Dependencies: 344
-- Name: FUNCTION job_delete_service(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_delete_service(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_delete_service(vid integer) TO coretek;


--
-- TOC entry 3719 (class 0 OID 0)
-- Dependencies: 357
-- Name: FUNCTION job_edit_customer(vid integer, vname character varying, vaddress character varying, vcity character varying, vstate character varying, vzip integer, vfname character varying, vlname character varying, vphone character varying, vcellphone character varying, vnotes character varying, vcountry character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_edit_customer(vid integer, vname character varying, vaddress character varying, vcity character varying, vstate character varying, vzip integer, vfname character varying, vlname character varying, vphone character varying, vcellphone character varying, vnotes character varying, vcountry character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_edit_customer(vid integer, vname character varying, vaddress character varying, vcity character varying, vstate character varying, vzip integer, vfname character varying, vlname character varying, vphone character varying, vcellphone character varying, vnotes character varying, vcountry character varying) TO coretek;


--
-- TOC entry 3720 (class 0 OID 0)
-- Dependencies: 416
-- Name: FUNCTION job_edit_customer_services(job_id integer, services json); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_edit_customer_services(job_id integer, services json) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_edit_customer_services(job_id integer, services json) TO coretek;


--
-- TOC entry 3721 (class 0 OID 0)
-- Dependencies: 334
-- Name: FUNCTION job_edit_name(vid integer, vname character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_edit_name(vid integer, vname character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_edit_name(vid integer, vname character varying) TO coretek;


--
-- TOC entry 3722 (class 0 OID 0)
-- Dependencies: 413
-- Name: FUNCTION job_edit_placement_options(place_id integer, placement json); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_edit_placement_options(place_id integer, placement json) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_edit_placement_options(place_id integer, placement json) TO coretek;


--
-- TOC entry 3723 (class 0 OID 0)
-- Dependencies: 402
-- Name: FUNCTION job_get(vplaceid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get(vplaceid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get(vplaceid integer) TO coretek;


--
-- TOC entry 3724 (class 0 OID 0)
-- Dependencies: 382
-- Name: FUNCTION job_get_audit_permission(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_audit_permission(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_audit_permission(vid integer) TO coretek;


--
-- TOC entry 3725 (class 0 OID 0)
-- Dependencies: 448
-- Name: FUNCTION job_get_audits(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_audits(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_audits(vid integer) TO coretek;


--
-- TOC entry 3726 (class 0 OID 0)
-- Dependencies: 392
-- Name: FUNCTION job_get_customer(uid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_customer(uid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_customer(uid integer) TO coretek;


--
-- TOC entry 3727 (class 0 OID 0)
-- Dependencies: 388
-- Name: FUNCTION job_get_customers(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_customers() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_customers() TO coretek;


--
-- TOC entry 3728 (class 0 OID 0)
-- Dependencies: 396
-- Name: FUNCTION job_get_from_customer(iid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_from_customer(iid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_from_customer(iid integer) TO coretek;


--
-- TOC entry 3729 (class 0 OID 0)
-- Dependencies: 390
-- Name: FUNCTION job_get_full_name(vplaceid integer, OUT job_full_name text, OUT v_expectation character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_full_name(vplaceid integer, OUT job_full_name text, OUT v_expectation character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_full_name(vplaceid integer, OUT job_full_name text, OUT v_expectation character varying) TO coretek;


--
-- TOC entry 3730 (class 0 OID 0)
-- Dependencies: 418
-- Name: FUNCTION job_get_number_from_name(job_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_number_from_name(job_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_number_from_name(job_id integer) TO coretek;


--
-- TOC entry 3731 (class 0 OID 0)
-- Dependencies: 380
-- Name: FUNCTION job_get_permissions(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_permissions(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_permissions(vid integer) TO coretek;


--
-- TOC entry 3732 (class 0 OID 0)
-- Dependencies: 386
-- Name: FUNCTION job_get_place_perm(uid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_place_perm(uid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_place_perm(uid integer) TO coretek;


--
-- TOC entry 3733 (class 0 OID 0)
-- Dependencies: 387
-- Name: FUNCTION job_get_placement_names(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_placement_names() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_placement_names() TO coretek;


--
-- TOC entry 3734 (class 0 OID 0)
-- Dependencies: 406
-- Name: FUNCTION job_get_plants(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_plants() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_plants() TO coretek;


--
-- TOC entry 3735 (class 0 OID 0)
-- Dependencies: 410
-- Name: FUNCTION job_get_reg_placement(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_reg_placement() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_reg_placement() TO coretek;


--
-- TOC entry 3736 (class 0 OID 0)
-- Dependencies: 417
-- Name: FUNCTION job_get_salesman(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_salesman() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_salesman() TO coretek;


--
-- TOC entry 3737 (class 0 OID 0)
-- Dependencies: 395
-- Name: FUNCTION job_get_services(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_services() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_services() TO coretek;


--
-- TOC entry 3738 (class 0 OID 0)
-- Dependencies: 280
-- Name: FUNCTION job_get_specific_place(jobid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_get_specific_place(jobid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_get_specific_place(jobid integer) TO coretek;


--
-- TOC entry 3739 (class 0 OID 0)
-- Dependencies: 355
-- Name: FUNCTION job_insert_customer(vname character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, fname character varying, lname character varying, vphone character varying, cell character varying, notes character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_insert_customer(vname character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, fname character varying, lname character varying, vphone character varying, cell character varying, notes character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_insert_customer(vname character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, fname character varying, lname character varying, vphone character varying, cell character varying, notes character varying) TO coretek;


--
-- TOC entry 3740 (class 0 OID 0)
-- Dependencies: 358
-- Name: FUNCTION job_insert_job_name(vid integer, vname character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_insert_job_name(vid integer, vname character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_insert_job_name(vid integer, vname character varying) TO coretek;


--
-- TOC entry 3741 (class 0 OID 0)
-- Dependencies: 318
-- Name: FUNCTION job_move_audit_place(vid integer, vnew_place integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_move_audit_place(vid integer, vnew_place integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_move_audit_place(vid integer, vnew_place integer) TO coretek;


--
-- TOC entry 3742 (class 0 OID 0)
-- Dependencies: 407
-- Name: FUNCTION job_set_plant(vname character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_set_plant(vname character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_set_plant(vname character varying) TO coretek;


--
-- TOC entry 3743 (class 0 OID 0)
-- Dependencies: 330
-- Name: FUNCTION job_set_salesman(user_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.job_set_salesman(user_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.job_set_salesman(user_id integer) TO coretek;


--
-- TOC entry 3744 (class 0 OID 0)
-- Dependencies: 447
-- Name: FUNCTION jobs_search_customer(job_customeri integer, job_customerf integer, job_namei integer, job_namef integer, job_numberi integer, job_numberf integer, salesmani integer, salesmanf integer, planti integer, plantf integer); Type: ACL; Schema: coretek; Owner: rafael
--

REVOKE ALL ON FUNCTION coretek.jobs_search_customer(job_customeri integer, job_customerf integer, job_namei integer, job_namef integer, job_numberi integer, job_numberf integer, salesmani integer, salesmanf integer, planti integer, plantf integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.jobs_search_customer(job_customeri integer, job_customerf integer, job_namei integer, job_namef integer, job_numberi integer, job_numberf integer, salesmani integer, salesmanf integer, planti integer, plantf integer) TO audit;
GRANT ALL ON FUNCTION coretek.jobs_search_customer(job_customeri integer, job_customerf integer, job_namei integer, job_namef integer, job_numberi integer, job_numberf integer, salesmani integer, salesmanf integer, planti integer, plantf integer) TO coretek;


--
-- TOC entry 3745 (class 0 OID 0)
-- Dependencies: 333
-- Name: FUNCTION login_get_attempts(ip inet, v_login_name character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.login_get_attempts(ip inet, v_login_name character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.login_get_attempts(ip inet, v_login_name character varying) TO coretek;


--
-- TOC entry 3746 (class 0 OID 0)
-- Dependencies: 325
-- Name: FUNCTION login_set_bad_attempt(ip inet, v_login_name character varying); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.login_set_bad_attempt(ip inet, v_login_name character varying) TO coretek;


--
-- TOC entry 3747 (class 0 OID 0)
-- Dependencies: 326
-- Name: FUNCTION login_set_token_failed(v_ip inet); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.login_set_token_failed(v_ip inet) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.login_set_token_failed(v_ip inet) TO coretek;


--
-- TOC entry 3748 (class 0 OID 0)
-- Dependencies: 480
-- Name: FUNCTION order_create(customer_id integer, ship_id integer, payed numeric, paystatus integer, vnotes character varying, orderstaus integer, audit_pack jsonb, OUT audit_over_quantity bigint[], OUT query_status integer, OUT new_order_id bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_create(customer_id integer, ship_id integer, payed numeric, paystatus integer, vnotes character varying, orderstaus integer, audit_pack jsonb, OUT audit_over_quantity bigint[], OUT query_status integer, OUT new_order_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_create(customer_id integer, ship_id integer, payed numeric, paystatus integer, vnotes character varying, orderstaus integer, audit_pack jsonb, OUT audit_over_quantity bigint[], OUT query_status integer, OUT new_order_id bigint) TO coretek;


--
-- TOC entry 3749 (class 0 OID 0)
-- Dependencies: 424
-- Name: FUNCTION order_create_customer(fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_create_customer(fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_create_customer(fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) TO coretek;


--
-- TOC entry 3750 (class 0 OID 0)
-- Dependencies: 452
-- Name: FUNCTION order_create_payment_status(pstatus character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_create_payment_status(pstatus character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_create_payment_status(pstatus character varying) TO coretek;


--
-- TOC entry 3751 (class 0 OID 0)
-- Dependencies: 420
-- Name: FUNCTION order_create_permission(vname character varying, order_permission integer, audit_permission integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_create_permission(vname character varying, order_permission integer, audit_permission integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_create_permission(vname character varying, order_permission integer, audit_permission integer) TO coretek;


--
-- TOC entry 3752 (class 0 OID 0)
-- Dependencies: 408
-- Name: FUNCTION order_delete_customer(v_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_delete_customer(v_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_delete_customer(v_id integer) TO coretek;


--
-- TOC entry 3753 (class 0 OID 0)
-- Dependencies: 436
-- Name: FUNCTION order_delete_order(v_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_delete_order(v_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_delete_order(v_id integer) TO coretek;


--
-- TOC entry 3754 (class 0 OID 0)
-- Dependencies: 454
-- Name: FUNCTION order_delete_payment_status(v_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_delete_payment_status(v_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_delete_payment_status(v_id integer) TO coretek;


--
-- TOC entry 3755 (class 0 OID 0)
-- Dependencies: 401
-- Name: FUNCTION order_delete_permissions(v_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_delete_permissions(v_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_delete_permissions(v_id integer) TO coretek;


--
-- TOC entry 3756 (class 0 OID 0)
-- Dependencies: 411
-- Name: FUNCTION order_delete_shipping(v_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_delete_shipping(v_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_delete_shipping(v_id integer) TO coretek;


--
-- TOC entry 3757 (class 0 OID 0)
-- Dependencies: 404
-- Name: FUNCTION order_edit_customer(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_edit_customer(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_edit_customer(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) TO coretek;


--
-- TOC entry 3758 (class 0 OID 0)
-- Dependencies: 429
-- Name: FUNCTION order_edit_order(vid integer, vpay_status integer, vorder_status integer, vpaid numeric, vnotes character varying, vaudits jsonb, OUT audit_over bigint[], OUT quantity_over integer[]); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_edit_order(vid integer, vpay_status integer, vorder_status integer, vpaid numeric, vnotes character varying, vaudits jsonb, OUT audit_over bigint[], OUT quantity_over integer[]) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_edit_order(vid integer, vpay_status integer, vorder_status integer, vpaid numeric, vnotes character varying, vaudits jsonb, OUT audit_over bigint[], OUT quantity_over integer[]) TO coretek;


--
-- TOC entry 3759 (class 0 OID 0)
-- Dependencies: 397
-- Name: FUNCTION order_edit_permissions(v_audit integer, v_order integer, v_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_edit_permissions(v_audit integer, v_order integer, v_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_edit_permissions(v_audit integer, v_order integer, v_id integer) TO coretek;


--
-- TOC entry 3760 (class 0 OID 0)
-- Dependencies: 405
-- Name: FUNCTION order_edit_shipping(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_edit_shipping(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_edit_shipping(v_id integer, fname character varying, mname character varying, lname character varying, vphone character varying, vcell character varying, vaddress character varying, vcity character varying, vstate character varying, vcountry character varying, vzip integer, vnotes character varying) TO coretek;


--
-- TOC entry 3761 (class 0 OID 0)
-- Dependencies: 425
-- Name: FUNCTION order_find_customer_ship(fv_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_find_customer_ship(fv_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_find_customer_ship(fv_id integer) TO coretek;


--
-- TOC entry 3762 (class 0 OID 0)
-- Dependencies: 394
-- Name: FUNCTION order_get_audit_permissions(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_get_audit_permissions() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_get_audit_permissions() TO coretek;


--
-- TOC entry 3763 (class 0 OID 0)
-- Dependencies: 437
-- Name: FUNCTION order_get_full_specific_history(vid bigint, vdatetime timestamp without time zone); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_get_full_specific_history(vid bigint, vdatetime timestamp without time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_get_full_specific_history(vid bigint, vdatetime timestamp without time zone) TO coretek;


--
-- TOC entry 3764 (class 0 OID 0)
-- Dependencies: 432
-- Name: FUNCTION order_get_history(vid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_get_history(vid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_get_history(vid bigint) TO coretek;


--
-- TOC entry 3765 (class 0 OID 0)
-- Dependencies: 431
-- Name: FUNCTION order_get_info(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_get_info(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_get_info(vid integer) TO coretek;


--
-- TOC entry 3766 (class 0 OID 0)
-- Dependencies: 453
-- Name: FUNCTION order_get_payment_status(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_get_payment_status() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_get_payment_status() TO coretek;


--
-- TOC entry 3767 (class 0 OID 0)
-- Dependencies: 421
-- Name: FUNCTION order_get_reg_permissions(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_get_reg_permissions() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_get_reg_permissions() TO coretek;


--
-- TOC entry 3768 (class 0 OID 0)
-- Dependencies: 400
-- Name: FUNCTION order_get_status_permissions(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_get_status_permissions() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_get_status_permissions() TO coretek;


--
-- TOC entry 3769 (class 0 OID 0)
-- Dependencies: 332
-- Name: FUNCTION order_search_customer_only_name(vafname character varying, vamname character varying, valname character varying, vaphone character varying, vacell character varying, vaaddress character varying, vacity character varying, vastate character varying, vacountry character varying, vazip integer, vanotes character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_search_customer_only_name(vafname character varying, vamname character varying, valname character varying, vaphone character varying, vacell character varying, vaaddress character varying, vacity character varying, vastate character varying, vacountry character varying, vazip integer, vanotes character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_search_customer_only_name(vafname character varying, vamname character varying, valname character varying, vaphone character varying, vacell character varying, vaaddress character varying, vacity character varying, vastate character varying, vacountry character varying, vazip integer, vanotes character varying) TO coretek;


--
-- TOC entry 3770 (class 0 OID 0)
-- Dependencies: 433
-- Name: FUNCTION order_search_customer_order(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_search_customer_order(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_search_customer_order(vid integer) TO coretek;


--
-- TOC entry 3771 (class 0 OID 0)
-- Dependencies: 434
-- Name: FUNCTION order_search_from_order_pay_status(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_search_from_order_pay_status(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_search_from_order_pay_status(vid integer) TO coretek;


--
-- TOC entry 3772 (class 0 OID 0)
-- Dependencies: 435
-- Name: FUNCTION order_search_from_order_status(vid bigint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.order_search_from_order_status(vid bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.order_search_from_order_status(vid bigint) TO coretek;


--
-- TOC entry 3773 (class 0 OID 0)
-- Dependencies: 462
-- Name: FUNCTION other_delete_announce(vid smallint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.other_delete_announce(vid smallint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.other_delete_announce(vid smallint) TO coretek;


--
-- TOC entry 3774 (class 0 OID 0)
-- Dependencies: 464
-- Name: FUNCTION other_delete_announce(vid integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.other_delete_announce(vid integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.other_delete_announce(vid integer) TO coretek;


--
-- TOC entry 3775 (class 0 OID 0)
-- Dependencies: 463
-- Name: FUNCTION other_set_annonce(announce character varying, v_show boolean, user_id integer, OUT newid smallint); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.other_set_annonce(announce character varying, v_show boolean, user_id integer, OUT newid smallint) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.other_set_annonce(announce character varying, v_show boolean, user_id integer, OUT newid smallint) TO coretek;


--
-- TOC entry 3776 (class 0 OID 0)
-- Dependencies: 466
-- Name: FUNCTION others_announce_change_status(vid integer, stat boolean); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.others_announce_change_status(vid integer, stat boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.others_announce_change_status(vid integer, stat boolean) TO coretek;


--
-- TOC entry 3777 (class 0 OID 0)
-- Dependencies: 467
-- Name: FUNCTION others_delete_my_reminder(user_id integer, v_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.others_delete_my_reminder(user_id integer, v_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.others_delete_my_reminder(user_id integer, v_id integer) TO coretek;


--
-- TOC entry 3778 (class 0 OID 0)
-- Dependencies: 461
-- Name: FUNCTION others_get_all_announces(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.others_get_all_announces() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.others_get_all_announces() TO coretek;


--
-- TOC entry 3779 (class 0 OID 0)
-- Dependencies: 468
-- Name: FUNCTION others_get_announce(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.others_get_announce() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.others_get_announce() TO coretek;


--
-- TOC entry 3780 (class 0 OID 0)
-- Dependencies: 470
-- Name: FUNCTION others_get_my_reminders(user_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.others_get_my_reminders(user_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.others_get_my_reminders(user_id integer) TO coretek;


--
-- TOC entry 3781 (class 0 OID 0)
-- Dependencies: 465
-- Name: FUNCTION others_set_self_reminder(user_id integer, vreminder character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.others_set_self_reminder(user_id integer, vreminder character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.others_set_self_reminder(user_id integer, vreminder character varying) TO coretek;


--
-- TOC entry 3782 (class 0 OID 0)
-- Dependencies: 458
-- Name: FUNCTION statistics_get_all_auditers(date_low date, date_high date); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.statistics_get_all_auditers(date_low date, date_high date) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.statistics_get_all_auditers(date_low date, date_high date) TO coretek;


--
-- TOC entry 3783 (class 0 OID 0)
-- Dependencies: 469
-- Name: FUNCTION user_change_password(vident character varying, vnew_pass character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_change_password(vident character varying, vnew_pass character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_change_password(vident character varying, vnew_pass character varying) TO coretek;


--
-- TOC entry 3784 (class 0 OID 0)
-- Dependencies: 415
-- Name: FUNCTION user_edit(v_id integer, vfirstname character varying, vlastname character varying, vlogin character varying, vnewtoken character varying, vhash character varying); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_edit(v_id integer, vfirstname character varying, vlastname character varying, vlogin character varying, vnewtoken character varying, vhash character varying) TO coretek;


--
-- TOC entry 3785 (class 0 OID 0)
-- Dependencies: 340
-- Name: FUNCTION user_edit_adm(user_id integer, uadm_level integer); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_edit_adm(user_id integer, uadm_level integer) TO coretek;


--
-- TOC entry 3786 (class 0 OID 0)
-- Dependencies: 338
-- Name: FUNCTION user_edit_permissions(user_id integer, permission_array json); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_edit_permissions(user_id integer, permission_array json) TO coretek;


--
-- TOC entry 3787 (class 0 OID 0)
-- Dependencies: 323
-- Name: FUNCTION user_extend_token(user_token character, user_identification character); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_extend_token(user_token character, user_identification character) TO coretek;


--
-- TOC entry 3788 (class 0 OID 0)
-- Dependencies: 389
-- Name: FUNCTION user_get_all(); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_get_all() FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_get_all() TO coretek;


--
-- TOC entry 3789 (class 0 OID 0)
-- Dependencies: 471
-- Name: FUNCTION user_get_credentials(username character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_get_credentials(username character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_get_credentials(username character varying) TO coretek;


--
-- TOC entry 3790 (class 0 OID 0)
-- Dependencies: 472
-- Name: FUNCTION user_get_pass_from_ident(vident character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_get_pass_from_ident(vident character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_get_pass_from_ident(vident character varying) TO coretek;


--
-- TOC entry 3791 (class 0 OID 0)
-- Dependencies: 353
-- Name: FUNCTION user_get_specific_credentials(user_id integer); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_get_specific_credentials(user_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_get_specific_credentials(user_id integer) TO rafael;
GRANT ALL ON FUNCTION coretek.user_get_specific_credentials(user_id integer) TO coretek;


--
-- TOC entry 3792 (class 0 OID 0)
-- Dependencies: 315
-- Name: FUNCTION user_get_specific_permissions(user_id integer); Type: ACL; Schema: coretek; Owner: rafael
--

REVOKE ALL ON FUNCTION coretek.user_get_specific_permissions(user_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_get_specific_permissions(user_id integer) TO audit;
GRANT ALL ON FUNCTION coretek.user_get_specific_permissions(user_id integer) TO coretek;


--
-- TOC entry 3793 (class 0 OID 0)
-- Dependencies: 329
-- Name: FUNCTION user_login_token(v_token character, v_identification character); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_login_token(v_token character, v_identification character) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_login_token(v_token character, v_identification character) TO coretek;


--
-- TOC entry 3794 (class 0 OID 0)
-- Dependencies: 328
-- Name: FUNCTION user_login_username(v_username character varying); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_login_username(v_username character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_login_username(v_username character varying) TO coretek;


--
-- TOC entry 3795 (class 0 OID 0)
-- Dependencies: 316
-- Name: FUNCTION user_my_id(v_identification character, v_token character); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_my_id(v_identification character, v_token character) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_my_id(v_identification character, v_token character) TO coretek;


--
-- TOC entry 3796 (class 0 OID 0)
-- Dependencies: 314
-- Name: FUNCTION user_self_adm_level(uidentifier character, utoken character); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_self_adm_level(uidentifier character, utoken character) TO coretek;


--
-- TOC entry 3797 (class 0 OID 0)
-- Dependencies: 341
-- Name: FUNCTION user_self_permissions(my_ident character varying, my_token character varying); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_self_permissions(my_ident character varying, my_token character varying) TO coretek;


--
-- TOC entry 3798 (class 0 OID 0)
-- Dependencies: 414
-- Name: FUNCTION user_token_intrusion(ip inet); Type: ACL; Schema: coretek; Owner: audit
--

REVOKE ALL ON FUNCTION coretek.user_token_intrusion(ip inet) FROM PUBLIC;
GRANT ALL ON FUNCTION coretek.user_token_intrusion(ip inet) TO coretek;


--
-- TOC entry 3799 (class 0 OID 0)
-- Dependencies: 324
-- Name: FUNCTION user_update_token(old_token character, new_token character); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_update_token(old_token character, new_token character) TO coretek;


--
-- TOC entry 3800 (class 0 OID 0)
-- Dependencies: 327
-- Name: FUNCTION user_verify_permission(owner_token character, owner_ident character, v_permission_id integer); Type: ACL; Schema: coretek; Owner: audit
--

GRANT ALL ON FUNCTION coretek.user_verify_permission(owner_token character, owner_ident character, v_permission_id integer) TO coretek;


--
-- TOC entry 3801 (class 0 OID 0)
-- Dependencies: 476
-- Name: FUNCTION drive_get_job_report(v_id integer, v_detail integer); Type: ACL; Schema: drive_r2; Owner: coretek
--

REVOKE ALL ON FUNCTION drive_r2.drive_get_job_report(v_id integer, v_detail integer) FROM PUBLIC;


--
-- TOC entry 3802 (class 0 OID 0)
-- Dependencies: 475
-- Name: FUNCTION insert_new_drive(vjob_id integer, vmodel character varying, vsize integer, vserial_number character varying, vpower_on_hours integer, vhealth integer, vlifetime_writes numeric, vstatus integer, vwipe_start timestamp without time zone, vwipe_end timestamp without time zone, push_new_drive boolean); Type: ACL; Schema: drive_r2; Owner: coretek
--

REVOKE ALL ON FUNCTION drive_r2.insert_new_drive(vjob_id integer, vmodel character varying, vsize integer, vserial_number character varying, vpower_on_hours integer, vhealth integer, vlifetime_writes numeric, vstatus integer, vwipe_start timestamp without time zone, vwipe_end timestamp without time zone, push_new_drive boolean) FROM PUBLIC;


--
-- TOC entry 3803 (class 0 OID 0)
-- Dependencies: 474
-- Name: FUNCTION insert_not_working_drive(vjob_id integer, vsize integer, vserial_number character varying, vforce boolean); Type: ACL; Schema: drive_r2; Owner: coretek
--

REVOKE ALL ON FUNCTION drive_r2.insert_not_working_drive(vjob_id integer, vsize integer, vserial_number character varying, vforce boolean) FROM PUBLIC;


--
-- TOC entry 3804 (class 0 OID 0)
-- Dependencies: 473
-- Name: FUNCTION insert_smart_table(vdrive_id integer, vsmart character varying[]); Type: ACL; Schema: drive_r2; Owner: coretek
--

REVOKE ALL ON FUNCTION drive_r2.insert_smart_table(vdrive_id integer, vsmart character varying[]) FROM PUBLIC;


--
-- TOC entry 3805 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE login_attempts_ip; Type: ACL; Schema: coretek; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,TRIGGER,UPDATE ON TABLE coretek.login_attempts_ip TO audit;


--
-- TOC entry 3806 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE login_attempts_token; Type: ACL; Schema: coretek; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,TRIGGER,UPDATE ON TABLE coretek.login_attempts_token TO audit;


--
-- TOC entry 3807 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE login_attempts_user; Type: ACL; Schema: coretek; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,TRIGGER,UPDATE ON TABLE coretek.login_attempts_user TO audit;


--
-- TOC entry 3808 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE login_credentials; Type: ACL; Schema: coretek; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,TRIGGER,UPDATE ON TABLE coretek.login_credentials TO audit;


--
-- TOC entry 3809 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE permission_name; Type: ACL; Schema: coretek; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,TRIGGER,UPDATE ON TABLE coretek.permission_name TO audit;


--
-- TOC entry 3810 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE person_permission; Type: ACL; Schema: coretek; Owner: postgres
--

GRANT ALL ON TABLE coretek.person_permission TO audit;


--
-- TOC entry 2168 (class 826 OID 17141)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: coretek; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA coretek GRANT ALL ON FUNCTIONS  TO audit;


--
-- TOC entry 2169 (class 826 OID 17142)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: coretek; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA coretek GRANT SELECT,INSERT,DELETE,TRIGGER,UPDATE ON TABLES  TO audit;


-- Completed on 2023-02-16 22:11:25 EST

--
-- PostgreSQL database dump complete
--

