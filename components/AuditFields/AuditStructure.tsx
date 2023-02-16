import React, { Fragment } from 'react'
import { IAuditValues } from '../../pages/Logged/Audit/inAudit/[vid]'
import { EFieldTypes } from '../../utils/enums'
import Image from '../Image'
import Selectbox from '../Selectbox'

interface IAuditStructure{
  classFields: Array<IAuditValues> 
  addField?: (e: number, l: number) => void
  removeField?: (e: number, l: number) => void
  changeValue?: (value: string, v_id: number, index: number) => void
  modifiable?: boolean
  deleteField?: (fieldId: number) => void
  copyField?: (fieldIndex: number) => void
}


const AuditStructure = ({
  classFields, 
  addField = () => {}, 
  removeField = () => {}, 
  changeValue = () => {},
  modifiable = true,
  deleteField = () => {},
  copyField = () => {}
}:IAuditStructure ) => {

  const labelClick = (v_id: number, index: number) => {
    deleteField(v_id)
    copyField(index)
  }

  return (<>
    <style jsx>{`
    tr td:nth-child(1){
      text-align: right;
      width: 100px;
    }
    label{
      word-wrap: anywhere;
    }
    input, select{
      width: fill-available;
    }
    tr td:nth-child(3){
      width: 30px;
    }
    input[type='checkbox']{
      width: 30px;
      height: 30px;
    }
    label{
      transition: color var(--fast-transition);
    }
    .copy-main{
      color: var(--copying-from-main);
    }
    `}</style>
    {classFields.map(({v_id, v_name, v_field, v_label,
      v_max_entries, v_required, v_fieldValues, values, copy}, index) => 
        <tr key={v_id}>
          <td><label className={`${copy === true ? 'copy-main' : ''}`}
            onClick={() => labelClick(v_id, index)} htmlFor={v_name}>{v_label}: 
          </label></td>
          {v_field === EFieldTypes.textbox ? 
            <Fragment>
              <td>
                {values.map((iVal,index) => <Fragment key={index} ><input 
                  onChange={e => changeValue(e.target.value, v_id, index)} 
                  id={v_name} 
                  value={iVal} 
                  required={v_required} 
                  placeholder={v_label}
                  type="text" /><br />
                </Fragment>)}
              </td>
              <td>
                {modifiable && v_max_entries > values.length && <Image onClick={() => addField(v_id, values.length)} src='/pictures/plus.svg' alt={'add'} width={'30px'} height={'30px'} verticalAlign='bottom' />}
                {modifiable && 1 < values.length && <Image onClick={() => removeField(v_id, values.length-1)} src='/pictures/minus.svg' alt={'remove'} width={'30px'} height={'30px'}  verticalAlign='bottom' />}
              </td>
            </Fragment>
            : v_field === EFieldTypes.selectbox ? 
              <Fragment>
                <td>
                  {values.map((iVal,index) => <Fragment key={index}><Selectbox 
                    valueSelected={iVal} 
                    onChange={e => changeValue(e.value, v_id, index)} 
                    obj={v_fieldValues}
                    selectInfoText='---Select---'
                    id={v_name}
                    required={v_required}
                    styling='width: fill-available; width: -moz-available;'
                    /><br />
                  </Fragment>)}
                </td>
                <td>
                  {modifiable && v_max_entries > values.length && <Image onClick={() => addField(v_id, values.length)} src='/pictures/plus.svg' alt={'add'} width={'30px'} height={'30px'} verticalAlign='bottom' />}
                  {modifiable && 1 < values.length && <Image onClick={() => removeField(v_id, values.length-1)} src='/pictures/minus.svg' alt={'remove'} width={'30px'} height={'30px'}  verticalAlign='bottom' />}
                </td>
              </Fragment>
            : v_field === EFieldTypes.numericbox ?
              <Fragment>
                <td>
                  {values.map((iVal,index) => <Fragment key={index}><input 
                    step='0.000001'
                    id={v_name}
                    type="number" 
                    onChange={e => changeValue(e.target.value, v_id, index)}  
                    value={iVal}
                    required={v_required}
                  /><br /></Fragment>) }
                </td>
                <td>
                  {modifiable && v_max_entries > values.length && <Image onClick={() => addField(v_id, values.length)} src='/pictures/plus.svg' alt={'add'} width={'30px'} height={'30px'} verticalAlign='bottom' />}
                  {modifiable && 1 < values.length && <Image onClick={() => removeField(v_id, values.length-1)} src='/pictures/minus.svg' alt={'remove'} width={'30px'} height={'30px'}  verticalAlign='bottom' />}
                </td>
              </Fragment>    
            : v_field === EFieldTypes.checkbox && 
            <Fragment>
              <td>
                {values.map((iVal, index) => <Fragment key={index}><input 
                  id={v_name}
                  type='checkbox'//@ts-ignore
                  onChange={() => changeValue(!iVal, v_id, index)}
                  checked={iVal}
                /></Fragment>)}
              </td>
              <td>
                  {modifiable && v_max_entries > values.length && <Image onClick={() => addField(v_id, values.length)} src='/pictures/plus.svg' alt={'add'} width={'30px'} height={'30px'} verticalAlign='bottom' />}
                  {modifiable && 0 < values.length && <Image onClick={() => removeField(v_id, values.length-1)} src='/pictures/minus.svg' alt={'remove'} width={'30px'} height={'30px'}  verticalAlign='bottom' />}
              </td>
            </Fragment>
          }
        </tr>
      )}
    </>
  )
}

export default AuditStructure


export const getStaticProps = () => {
  return {notFound: true}
}