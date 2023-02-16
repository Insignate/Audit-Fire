import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react'
import AuditBase, { EAuditBaseActionType, IAuditBasic } from '../../../components/AuditFields/AuditBase'
import { LockSubmitButton, SelfLockSubmitButton } from '../../../components/buttons'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IGetValueVidVname, ISendAuditValues, IValuesFromClass } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { EFieldTypes } from '../../../utils/enums'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { Loading } from '../../../utils/Loading'
import { DialogModalContext, EDialogWindowType } from '../../../utils/ModalDialog'
import { ModalsContext } from '../../../utils/Modals'
import { IAuditValues } from '../Audit/inAudit/[vid]'

enum EActionType {
  searchAudit,
  cancelSearch,
  setEditAudit,
  setClasses,
  auditNotFound,
  rootField
}

enum ESearchType{
  none,
  searching,
  showAudit,
  auditNotFound
}

interface IActionType{
  type: EActionType|EAuditBaseActionType
  string?: string
  searchTimeout?: NodeJS.Timeout
  editAudit?: ISendAuditValues['success']
  vidName?: IGetVidVname['success']
  classValues?: IValuesFromClass['value']
  classFields?: Array<IAuditValues>
  number?: number
  number2?: number
  number3?: number
  name?: string
  field?: string
  value?: string | number | boolean
}

const reducer = (state: Init, action:IActionType) => {
  switch(action.type){
    case EActionType.searchAudit:
      clearInterval(state.inputSearchTimeout)
      return {...state,  searchWindowType: ESearchType.searching, inputSearchTimeout: action.searchTimeout, inputAudits: action.string }
    case EActionType.cancelSearch:
      clearInterval(state.inputSearchTimeout)
      return {...state , searchWindowType: ESearchType.none, inputAudits: ''}
    case EActionType.setClasses:
      return {...state, classes: action.vidName}
    case EActionType.setEditAudit:
      let merged = []
      if (action.editAudit.fields !== null){
        merged = action.classValues.map(item => {
          for(let i = 0; i <= action.editAudit.fields.length-1; i++){
            if(action.editAudit.fields[i].v_id === item.v_id)
              if (item.v_field === EFieldTypes.checkbox)
                return ({...item, values: action.editAudit.fields[i].value_arr.map(vItem => vItem === 'true' ? true : false)})
              else if (item.v_field === EFieldTypes.numericbox)
                return ({...item, values: action.editAudit.fields[i].value_arr.map(vItem => parseFloat(vItem))})
              else if (item.v_field === EFieldTypes.selectbox)
                return ({...item, values: action.editAudit.fields[i].value_arr.map(vItem => parseInt(vItem))})
              else return ({...item, values: action.editAudit.fields[i].value_arr})
          }
          if (item.v_field === EFieldTypes.checkbox)
            return {...item, values: [false]}
          else if (item.v_field === EFieldTypes.numericbox || item.v_field === EFieldTypes.selectbox)
            return {...item, values: [0]}
          return {...item, values: ['']}
        })
      }
      
      let normOptions: Array<number>
      if (action.editAudit.options !== null){
        normOptions = action.editAudit.options.map(({issue_id}) => issue_id)
        normOptions[normOptions.length] = 0
      }
      else normOptions = [0]

      return {...state, 
        auditNumber: action.number,
        auditBasicInfo: {...state.auditBasicInfo, quantity: action.editAudit.audit.quantity, 
          notes: action.editAudit.audit.notes,
          selectedClass: action.editAudit.audit.audit_class_id ,
          jobId: action.editAudit.audit.job_id, 
          name: action.editAudit.audit.v_name,
          date: action.editAudit.audit.date_placed
        },
        showAudit: true,
        selectedOptions: normOptions,
        activeClassFields: merged,
        options: action.vidName,
        searchWindowType: ESearchType.showAudit
      }
    case EAuditBaseActionType.setClassFields:
      return {...state, 
        activeClassFields: action.classFields, 
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
    case EActionType.auditNotFound:
      return {...state, searchWindowType: ESearchType.auditNotFound}
    case EActionType.rootField:
      return {...state, [action.field]: action.value}
    default: return state
  }
}

class Init{
  inputAudits: string = ''
  inputSearchTimeout: NodeJS.Timeout = setTimeout(() => {}, 500);

  auditNumber: number = 0;
  
  classes: IGetValueVidVname['value'] = [];
  activeClassFields: Array<IAuditValues> = [];
  
  options: IGetValueVidVname['value'] = [];
  selectedOptions: Array<number> = [0];

  searchWindowType:ESearchType = ESearchType.none

  auditBasicInfo:IAuditBasic = {
    quantity: 1,
    notes: '',
    selectedClass: 0,
    jobId: 0,
    name: '',
    date: ''
  }
}

const Index = () => {
  const router = useRouter()
  const auditId = parseInt(router.query.vid[0])
  const [state, dispatch] = useReducer(reducer, new Init)
  const {
    auditNumber, 
    inputAudits, 
    classes, 
    activeClassFields, 
    auditBasicInfo, 
    selectedOptions, 
    options, 
    searchWindowType,
  } = state
  const [lockSubmit, setLockSubmit] = useState<boolean>(false)

  const {showWindow} = useContext(ModalsContext)
  const {showDialog} = useContext(DialogModalContext)

  const getClassFields = useCallback(async(value: number) => {
    const classResp: IValuesFromClass = await jFetch('class-manip/get-fields-from-class', 'POST', {vid: value})
    return classResp
  }, [])
  const getOptions = useCallback(async (value: number) => {
    const svrResp: IGetValueVidVname = await jFetch('class-manip/get-options-from-class', 'POST', {vid: value})
    return svrResp
  }, [])
  const searchAuditTimeout = useCallback(async (values: number) => {
    const svrResp:ISendAuditValues = await jFetch('audit/get-last-audit', 'POST', {vid: values})
    if (svrResp.success){
      const classResp = await getClassFields(svrResp.success.audit.audit_class_id)
      const options = await getOptions(svrResp.success.audit.audit_class_id)
      if (classResp.success && options.success){
        dispatch({type: EActionType.setEditAudit, editAudit: svrResp.success, classValues: classResp.value, vidName: options.value, number: values})
      }
      else if (classResp.success && options.info){
        dispatch({type: EActionType.setEditAudit, editAudit: svrResp.success, classValues: classResp.value, vidName: [], number: values})
      }
      else dispatch({type: EActionType.auditNotFound})
    }
    else dispatch({type: EActionType.auditNotFound})
  }, [getClassFields, getOptions])
  const searchAudit = useCallback((values: string) => {
    const parsedVal = parseInt(values)
    if (!isNaN(parsedVal))
      dispatch({type: EActionType.searchAudit, string: values, searchTimeout: setTimeout(() => searchAuditTimeout(parsedVal), 500) })
    else 
      dispatch({type: EActionType.cancelSearch})  
  }, [searchAuditTimeout])
  
  const sendAuditToDb = useCallback(async (asked_to_audit = false) => {
    const vclass = auditBasicInfo.selectedClass
    const quantity = auditBasicInfo.quantity
    const fields = activeClassFields.map(({v_id, v_field, values}) => ({v_id, v_field, v_values: values}))
    const options = selectedOptions
    const notes = auditBasicInfo.notes
    const svrResp = await jFetch('audit/edit-audit', 'POST', {
      asked_to_audit,
      vclass, 
      audit: auditNumber,
      quantity, 
      fields, 
      options, 
      notes
    })
    if (svrResp.ask){
      dispatch({type: EActionType.rootField, field: 'asked_to_audit', value: true})
      showDialog('Info', svrResp.ask, EDialogWindowType.orange, () => sendAuditToDb(true), 'Confirm', 'Cancel')
    }
    else {
      showWindow(svrResp)
    }
  }, [auditBasicInfo.selectedClass, 
    auditNumber, auditBasicInfo.quantity, 
    activeClassFields, 
    selectedOptions, 
    auditBasicInfo.notes, showDialog, showWindow])

  const editAudit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    setLockSubmit(true)
    e.preventDefault()
    await sendAuditToDb()
    setLockSubmit(false)
  }, [sendAuditToDb])
  
  useEffect(() => {
    const getClasses = async () => {
      const svrResp:IGetValueVidVname = await getFetch('class-manip/get-classes')
      if (svrResp.success)
      dispatch({type: EActionType.setClasses, vidName: svrResp.value})
    }
    getClasses()
    searchAuditTimeout(auditId)
    dispatch({type: EActionType.rootField, field: 'inputAudits', value: auditId})
    dispatch({type: EActionType.rootField, field: 'auditNumber', value: auditId})
  }, [])

  return (
    <div className='container'>
      <style jsx>{`
      .container{
        display: inline-block;
      }
      .container-inside{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .window{
        margin: 8px;
      }
      .search-form{
        display: flex;
        flex-direction: row;
      }
      .search-form > hr{
        margin: 0 6px;
      }
      `}</style>
      <Head>
        <title>Edit Audit</title>
      </Head>
      <div className='container-inside'>

        <form onSubmit={e => e.preventDefault()} className='search-form window window-lookup'>
          <div>
            <label>Edit Asset:</label><br />
            <input type='number' required value={inputAudits} onChange={e => searchAudit(e.target.value)} />
          </div>
          
          {searchWindowType === ESearchType.showAudit && <><hr />
          <div>
            <label >Job Name:</label><br />
            <label>{auditBasicInfo.name}</label>
          </div>
          </>}
          
        </form>
        {searchWindowType === ESearchType.auditNotFound && <label style={{margin: '8px'}}>Audit not found</label>}
        {searchWindowType === ESearchType.searching && <Loading customMargin='240px 100px' />}
        {searchWindowType === ESearchType.showAudit && 
        <form onSubmit={e => editAudit(e)} className='window window-attention'>
          <AuditBase 
            classes={classes} 
            selectedOptions={selectedOptions} 
            dispatch={dispatch} 
            basicInfo={auditBasicInfo} 
            activeClassFields={activeClassFields} 
            options={options}
            commands={<LockSubmitButton text={'Edit Audit'} loadingText={'Editing Audit...'} onClick={() => {}} disabled={lockSubmit} />} 
          />
        </form>}
      </div>
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
    if(reqPermission.canAudit === true) return {props: {
      check: true
    }};
    else return {notFound : true}
  })
  return value
}