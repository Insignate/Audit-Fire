import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { Fragment, useCallback, useContext, useEffect, useReducer } from 'react'
import AuditBase, { EAuditBaseActionType, IAuditBasic } from '../../../components/AuditFields/AuditBase'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IGetAuditHistoryDatetime, IGetDbAuditHistorySingle, IGetValueVidVname, IObjValuesFromClass, IValuesFromClass } from '../../../tsTypes/psqlResponses'
import { mergeAuditFields } from '../../../utils/auditManage'
import { getCookie } from '../../../utils/customCookies'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { ModalsContext } from '../../../utils/Modals'
import { SimpleLoading } from '../../../utils/SimpleLoading'
import { IAuditValues } from '../Audit/inAudit/[vid]'

interface IActionType{
  type: EActionType | EAuditBaseActionType
  timeout?: NodeJS.Timeout
  number?: number
  auditHistory?: IGetAuditHistoryDatetime['value'] 
  setClasses?: Array<{
    v_id: number
    v_name: string
    fields: Array<IObjValuesFromClass>
    options: IGetValueVidVname['value']
  }>
  fields?: Array<IObjValuesFromClass>
  options?: IGetValueVidVname['value']
  pushAuditHistory?: IOpenedAudits
  date?: Date
}
interface IOpenedAudits{
  basicInfo: IAuditBasic
  activeClassFields: Array<IAuditValues>
  options: IGetVidVname['success']
  selectedOptions: Array<number>
}
enum ESearchType{
  none,
  searching,
  searchFound,
  notFound
}
enum EActionType {
  setAuditSearch,
  cancelAuditSearch,
  setAuditHistory,
  auditNotFound,
  setSingleFullAudit,
  setClasses,
  attachFields,
  attachOptions
}
const reducer = (state: Init, action: IActionType) => {

  switch(action.type){
    case EActionType.setAuditSearch:
      clearInterval(state.auditSearchTimeout)
      return {...state, auditSearchTimeout: action.timeout, searchType: ESearchType.searching, auditToSearch: action.number, auditHistory: []}
    case EActionType.cancelAuditSearch:
      clearInterval(state.auditSearchTimeout)
      return {...state, searchType: ESearchType.none, auditToSearch: '', auditHistory: []}
    case EActionType.setAuditHistory:
      return {...state, auditHistory: action.auditHistory, searchType: ESearchType.searchFound}
    case EActionType.auditNotFound:
      return {...state, searchType: ESearchType.notFound}
    case EActionType.setClasses:
      return {...state, classes: action.setClasses}
    case EActionType.attachFields:
      return {...state, classes: state.classes.map(item => item.v_id === action.number ? {...item, fields: action.fields}: item)}
    case EActionType.attachOptions:
      return {...state, classes: state.classes.map(item => item.v_id === action.number ? {...item, options: action.options}: item)}
    case EActionType.setSingleFullAudit:
      return {...state, openedAudits: [...state.openedAudits, {...action.pushAuditHistory}]}
    case EAuditBaseActionType.removeDisplayingHistory:
      return {...state, openedAudits: state.openedAudits.filter(item => 
        (new Date(item.basicInfo.date)).getTime() !== (new Date(action.date)).getTime())}
    
    default: return state
  }
  
}
class Init {
  auditToSearch = ''
  auditSearchTimeout = setTimeout(() => {}, 500)
  searchType = ESearchType.none
  auditHistory: IGetAuditHistoryDatetime['value'] = [] 
  classes: Array<{
    v_id: number;
    v_name: string;
    fields: Array<IAuditValues>;
    options: IGetValueVidVname['value']
  }> = []
  
  openedAudits: Array<IOpenedAudits> = []
}
const Index = () => { 

  const [state, dispatch] = useReducer(reducer, new Init)
  const {auditToSearch, auditHistory, searchType, classes, openedAudits} = state
  const {showWindow} = useContext(ModalsContext)
  const searchAuditDateTime = useCallback( async (vid: number) => {
    const svrResp: IGetAuditHistoryDatetime = await jFetch('audit/get-datetime-history', 'POST', {vid})
    if (svrResp.value){
      dispatch({type: EActionType.setAuditHistory, auditHistory: svrResp.value})
    }
    else dispatch({type: EActionType.auditNotFound})
  }, [])
  const auditTimeout = useCallback((value: string) => {
    const parsedVal = parseInt(value)
    if (!isNaN(parsedVal))
      dispatch({type: EActionType.setAuditSearch, timeout: setTimeout(() => searchAuditDateTime(parsedVal), 500), number: parsedVal})
    else dispatch({type: EActionType.cancelAuditSearch})
  }, [searchAuditDateTime])
  const getSpecificAudit = useCallback( async (vid: number, date: Date) => {
    
    const found = openedAudits.find(item => (new Date(item.basicInfo.date)).getTime() === (new Date(date)).getTime())

    if(found !== undefined) return  
    const getSpecificAudit:IGetDbAuditHistorySingle = await jFetch('audit/get-specific-history', 'POST', {vid, date})
    //@ts-ignore
    if (!getSpecificAudit.success) return showWindow(getSpecificAudit)
    let classFound = classes.find(item => item.v_id == getSpecificAudit.value.audit.selectedClass)
    if (classFound.fields.length <= 0){
      const classFields: IValuesFromClass = await jFetch('class-manip/get-fields-from-class', 'POST', {vid: getSpecificAudit.value.audit.selectedClass})
      
      if (classFields !== null)
        dispatch({type: EActionType.attachFields, number: classFound.v_id, fields: classFields.value})
      const classOptions: IGetValueVidVname = await jFetch('class-manip/get-options-from-class', 'POST', {vid: getSpecificAudit.value.audit.selectedClass})
      if (classOptions !== null)
        dispatch({type: EActionType.attachOptions, number: classFound.v_id, options: classOptions.value})
      
      classFound.fields = classFields.value
      classFound.options = classOptions.value
    }
    const postAudit: IOpenedAudits = {
      basicInfo: getSpecificAudit.value.audit,
      activeClassFields: mergeAuditFields(classFound.fields, getSpecificAudit.value),
      options: classFound.options,
      selectedOptions: getSpecificAudit.value.options !== null ? getSpecificAudit.value.options.map(({issue_id}) => issue_id) : []
    }
    dispatch({type: EActionType.setSingleFullAudit, pushAuditHistory: postAudit})
    
  }, [classes, openedAudits, showWindow])
  useEffect(() => {
    const getClasses = async () => {
      const svrResp:IGetValueVidVname = await getFetch('class-manip/get-classes')
      if (svrResp.success)
      dispatch({type: EActionType.setClasses, setClasses: svrResp.value.map(item => ({...item, fields: [], options: []}))})
    }

    getClasses()
  }, [])

  return (
    <div className='container'>
      <style jsx>{`
      .window{
        margin: 8px;
      }
      .window-lookup > input{
        width: fill-available;
      }
      .container{
        display: flex;
      }
      .audit-history{
        display: flex;
        flex-wrap: wrap;
        transition: margin var(--fast-transition);
        align-items: flex-start;
      }
      .search-window{
        position: sticky;
        transition: top var(--fast-transition), position var(--fast-transition);
        top: 8px;
        width: 180px;
        z-index: 5;
      }
      .search-window > *{
        width: fill-available;
      }
      .search-form{
        transition: width var(--fast-transition);
        width: 210px;
      }
      .history-buttons{
        overflow-y: auto;
        max-height: calc(100vh - 90px);
      }
      .history-buttons > button{
        width: fill-available;
      }
      @media screen and (max-width: 800px){
        .audit-history{
          margin-top: 40px;
        }
        .history-buttons{
          display: none;
          pointer-events: none;
        }
        .search-window{
          transition: top var(--fast-transition), position var(--fast-transition) 0.3s;
          position: fixed;
          top: -100px;
          min-height: 110px;
        }
        .search-window:hover, .search-window:focus-within{
          top: 0;
        }
        .search-window:hover .history-buttons, .search-window:focus-within .history-buttons{
          display: block;
          pointer-events: auto;
        }
        .search-form{
          width: 0;
        }
      }

      `}</style>
      <Head>
        <title>Audit History</title>
      </Head>
      <form className='search-form' onSubmit={e => e.preventDefault()}>
        <div className='search-window window window-lookup'>
          <label htmlFor="search-history">Search Audit:</label><br />
          <input onChange={e => auditTimeout(e.target.value)} value={auditToSearch} type='number' id='search-history' required/>
          
          <div className='history-buttons'>
            <hr style={{margin: '6px 0'}} />
            {searchType === ESearchType.searching && <div style={{display: 'flex', justifyContent: 'center'}}><SimpleLoading quantity={5} /></div> }
            {searchType === ESearchType.notFound && <label>Audit not found</label>}
            {searchType === ESearchType.searchFound && auditHistory.map(({datetime}) => {
              const dateTime = new Date(datetime)
              const date = `${dateTime.getMonth()+1}/${dateTime.getDate()}/${dateTime.getFullYear()}`
              const time = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}:${dateTime.getSeconds().toString().padStart(2, '0')}`
              //@ts-ignore
              return <Fragment key={datetime}><button onClick={() => getSpecificAudit(auditToSearch, datetime)}>{date} - {time}</button><br /></Fragment>
            })} 
          </div>
        </div>
      </form>
      <section className='audit-history'>     
      {openedAudits.map(item => <div key={item.basicInfo.date} className='window window-read'>
        <AuditBase 
          classes={classes} 
          selectedOptions={item.selectedOptions} 
          dispatch={dispatch} 
          basicInfo={item.basicInfo} 
          activeClassFields={item.activeClassFields} 
          options={item.options} 
          commands={<></>} 
          modifiable={false}
          closable={true}
        />
      </div>)}
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
    if(reqPermission.canSearchAuditHistory === true) return {props: {
      check: true
    }};
    else return {notFound : true}
  })
  return value
}