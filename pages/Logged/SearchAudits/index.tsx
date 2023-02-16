import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { useCallback, useContext, useEffect, useReducer } from 'react'
import AuditBase, { EAuditBaseActionType, IAuditBasic } from '../../../components/AuditFields/AuditBase'
import CompactView from '../../../components/auditInfo/CompactView'
import { SelfLockSubmitButton } from '../../../components/buttons'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IAuditCompactInfo, IAuditsFound, IGetValueVidVname, ISvrAuditCompactInfo, IUISingleAuditSearched } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { EFieldTypes } from '../../../utils/enums'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { EWindowType, ModalsContext } from '../../../utils/Modals'
import { IAuditValues } from '../Audit/inAudit/[vid]'

interface IAct{
  type: EAct | EAuditBaseActionType
  field?: string
  value?: string | number | boolean | IGetValueVidVname['value'] | ISvrAuditCompactInfo['value']
  number?: number
  classFields?: Array<IAuditValues>
  number2?: number
  number3?: number
  string?: string
  name?: string
  vidName?: IGetValueVidVname['value']
  multiAudits?: ISvrAuditCompactInfo['value']
}

enum EAct {
  rootField,
  setSearchedAudits
}

enum ESearchType{
  full,
  class
}

const reducer = (state: Init, action: IAct) => {
  switch (action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    case EAuditBaseActionType.setClassFields:
      return {...state, 
        activeClassFields: action.classFields.map(item => ({...item, v_max_entries: item.v_field === 1 ? 1 : 6, v_required: false})), 
        auditBasicInfo: {...state.auditBasicInfo, 
          selectedClass: action.number,
        },
        selectedOptions: [0]}
    case EAuditBaseActionType.changeOption:
      const optionValue = isNaN(action.number) ? 0 : action.number
      if (state.selectedOptions.includes(optionValue)) return state
      state.selectedOptions[action.number2] = optionValue
      if (action.number2+1 >= action.number3) state.selectedOptions[action.number2+1] = 0
      return {...state}
    case EAuditBaseActionType.removeOption:
      if (action.number >= 0){
        state.selectedOptions.length = action.number
        state.selectedOptions[action.number] = 0
        return {...state}
      }
      else return state
    case EAuditBaseActionType.removeField:
      let find2 = state.activeClassFields.find(item => item.v_id === action.number)
      find2.values.length = action.number2
      return {...state}
    case EAuditBaseActionType.changeField:
      let find3 = state.activeClassFields.find(item => item.v_id === action.number)
      if (find3.v_field === EFieldTypes.textbox) find3.values[action.number2] = action.string 
      else if (find3.v_field === EFieldTypes.selectbox){
        const value = parseInt(action.string)
        if (!isNaN(value))
        find3.values[action.number2] = value
        else find3.values[action.number2] = ''
      }
      else if (find3.v_field === EFieldTypes.numericbox){
        const value = parseFloat(action.string)
        if (!isNaN(value))
          find3.values[action.number2] = value
        else find3.values[action.number2] = ''
        
      }
      else if (find3.v_field === EFieldTypes.checkbox){
        find3.values[action.number2] = action.string
      }
      return {...state}
    case EAuditBaseActionType.addField:
      let find = state.activeClassFields.find(item => item.v_id === action.number)
      if (find.v_field === EFieldTypes.textbox) find.values[action.number2]=''
      else if (find.v_field === EFieldTypes.numericbox) find.values[action.number2]=0
      else if (find.v_field === EFieldTypes.selectbox) find.values[action.number2]=''
      else if (find.v_field === EFieldTypes.checkbox) find.values[action.number2]=true
      return {...state}
    case EAuditBaseActionType.changeBaseField:
      if (action.name === 'quantity'){
        const parsedVal = parseInt(action.string)
        if (!isNaN(parsedVal))
          return {...state, auditBasicInfo: {...state.auditBasicInfo, quantity: parsedVal}}
        else return {...state, auditBasicInfo: {...state.auditBasicInfo, quantity: ''}}
      }
      else if (action.name === 'notes')
        return {...state, auditBasicInfo: {...state.auditBasicInfo, notes: action.string}}
      return state
    case EAuditBaseActionType.setOptions:
      return {...state, options: action.vidName, selectedOptions: [0]}
    case EAct.setSearchedAudits:
      return {...state, auditsFound: action.multiAudits}
    default: return state
  }
}

class Init{
  classes: IGetValueVidVname['value'] = []
  selectedOptions: Array<number> = [0]
  auditBasicInfo: IAuditBasic = {
    notes: '',
    selectedClass: 0,
    jobId: 0,
    name: '',
    date: ''
  }
  activeClassFields: Array<IAuditValues> = []
  options: IGetValueVidVname['value'] = []
  searchType = 0
  
  auditsFound: Array<IAuditCompactInfo> = []
}
const Index = ({can_edit_audit, can_orders}:{can_edit_audit: boolean, can_orders: boolean}) => {

  const {showCustomWindow, showWindow} = useContext(ModalsContext)

  const [state, dispatch] = useReducer(reducer, new Init())
  const {classes,
    selectedOptions,
    auditBasicInfo,
    activeClassFields,
    options,
    searchType,
    auditsFound
  } = state

  const searchAudits = useCallback(async () => {

    const fieldsToSearch = []
    activeClassFields.forEach(item => {
      const newElement = []
      item.values.forEach(element => {
        if (element !== '' &&  item.v_field !== EFieldTypes.selectbox) newElement.push(element) 
        else if (item.v_field === EFieldTypes.selectbox && element !== 0 && element !== '') newElement.push(element)
      })
      if (newElement.length > 0) fieldsToSearch.push({v_id: item.v_id, field_id: item.v_field, fields: newElement})
    })
    const options = []
    selectedOptions.forEach(item => {
      if (item !== 0) options.push(item)
    })
    if(fieldsToSearch.length > 0){
      const svrResp:ISvrAuditCompactInfo= await jFetch('audit/search-all-audits', 'POST', {search: fieldsToSearch, options, classId: searchType === ESearchType.class ? auditBasicInfo.selectedClass : 0})
      if (svrResp.success){
        dispatch({type: EAct.rootField, field: 'auditsFound', value: svrResp.value})
      }
      else showWindow(svrResp)
    }
    else showCustomWindow('Info', 'You need to enter data for at least 1 field, To search for every available item, enter % in any text field', EWindowType.info)
    
  }, [activeClassFields, selectedOptions ,searchType, auditBasicInfo.selectedClass, showWindow, showCustomWindow])
  const importInventory = useCallback(async () => {
    const svrResp = await getFetch('audit/get-available-inventory')
    console.log(svrResp)
  }, [])
  
  const formCommands = () => {
    return (<>
      <fieldset style={{marginBottom: '6px'}}>
        <legend>Class Search Type</legend>
        <p><label>
            <input 
              type="radio"
              name='search-type' 
              checked={searchType === ESearchType.full ? true : false}
              onChange={() => dispatch({type: EAct.rootField, field: 'searchType', value: ESearchType.full})}
            />Full
          </label></p>
          <p>
            <label>
              <input 
                type="radio"
                name='search-type' 
                checked={searchType === ESearchType.class ? true : false}
                onChange={() => dispatch({type: EAct.rootField, field: 'searchType', value: ESearchType.class})}
              />Class Specific
            </label>
          </p>
      </fieldset>
      <SelfLockSubmitButton 
        text='Search'
        loadingText='Searching...'
        onClick={() => searchAudits()} 
        styling='width: 100%;'
      /> <br />
      <SelfLockSubmitButton 
        text='Import Inventory' 
        loadingText='Importing...' 
        onClick={() => importInventory()}
        styling='width: 100%;'
        type='button'
      />
    </>)
  }
  useEffect(() => {
    const getAuditClass = async () => {
      const classes:IGetValueVidVname = await getFetch('class-manip/get-classes') 
      if (classes.success)
        dispatch({type: EAct.rootField, field: 'classes', value: classes.value})
    }
    getAuditClass()
  }, [])
  
  return (
    <div className='root-tag'>
      <style jsx>{`
      .root-tag{
        
      }
      .window{
        margin: 6px;
        float: left;
      }
      `}</style>
      <Head>
        <title>Audit Search</title>
      </Head>
      <form onSubmit={e => e.preventDefault()} className='window window-alert'>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <label style={{whiteSpace: 'nowrap'}}>Search Items</label>
        </div>
        <hr style={{margin: '6px 0'}} />
        <AuditBase 
          classes={classes} 
          selectedOptions={selectedOptions} 
          dispatch={dispatch} 
          basicInfo={auditBasicInfo} 
          activeClassFields={activeClassFields} 
          options={options}
          commands={formCommands()}
        />
      </form>
      <section style={auditsFound.length <= 0 ? {display: 'none'} : {}} className='window window-alert'>
      {auditsFound.map(({audit, notes, quantity, class_name, order_id, fields, options}) =>
        <CompactView 
          key={audit}
          audit_id={audit} 
          order_qtt={0} 
          qtt_audit={quantity} 
          notes={notes} 
          class_name={class_name} 
          fields={fields} 
          options={options} 
          order_id={order_id}
          can_edit={can_edit_audit}
          can_orders={can_orders}
        />
      )}
      </section>
    </div>
  )
}

export default Index

export const getServerSideProps = async ({req, res} : {req: NextApiRequest, res: NextApiResponse}) => {

  const value = await nextValidateLoginHeader(userTokenIdent, req, res, async () => {
    const {token, ident} = getCookie(req)
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissions(ident, token)
    
    if(reqPermission.canLogin !== true ) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canAudit === true || reqPermission.canPlaceOrders === true) return {props: {
      can_edit_audit: reqPermission.canAudit === true ? true : false,
      can_orders: reqPermission.canPlaceOrders === true ? true : false 
    }};
    else return {notFound : true}
  })
  return value
}