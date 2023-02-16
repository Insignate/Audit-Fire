import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { useCallback, useContext, useMemo, useReducer } from 'react'
import CurrencyInput from 'react-currency-input-field'
import CompactView from '../../../components/auditInfo/CompactView'
import { SelfLockSubmitButton } from '../../../components/buttons'
import CustomerJob from '../../../components/customerJobSelection/CustomerJob'
import FieldValueModifi from '../../../components/fmvManage/FieldValueModifi'
import SearchCustomerJob from '../../../components/fmvManage/SearchCustomerJob'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IGetJobAudits, IGetValueVidVname } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { jFetch } from '../../../utils/fetchs'
import { ModalsContext } from '../../../utils/Modals'

enum EAct {
  rootField,
  changeFoundCustomers,
  changeFmv,
  pushFieldValue,
  removeFieldHeader,
  removeField,
  setAllPrice,
  setOrPrice,
  setAndPrice
}

interface IJobFoundChain{
  fnChangeValues?: () => void
  fnGetData?: () => void
} 
interface IAct{
  type: number
  number?: number
  auditId?: number
  vidName?: IGetValueVidVname['value']
  value?: string | number | boolean | IGetValueVidVname['value'] | IGetJobAudits['value']
  field?: string
  string?: string
}

const reducer = (state: Init, action: IAct) => {
  switch(action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    case EAct.changeFoundCustomers:
      return {...state, jobsFound: action.vidName, fullJobSelected: undefined}
    case EAct.changeFmv:
      return {...state, auditsFound: state.auditsFound.map(item =>
        item.id === action.auditId ? ({...item, fmv: typeof(action.string) === 'undefined' ? '0': action.string}) : item
      )}
    case EAct.pushFieldValue:
      if (state.selectedFieldsChangeFmv.length <=0)
        return {...state, selectedFieldsChangeFmv: [{header: action.string, value: [action.field]}]}
      const itemHeader = state.selectedFieldsChangeFmv.find(item => item.header === action.string)
      if (itemHeader !== undefined){
        const foundValue = itemHeader.value.find(item => item === action.field)
        if (foundValue === undefined)
          return {...state, selectedFieldsChangeFmv: state.selectedFieldsChangeFmv.map(item => 
            item.header === action.string ? {...item, value: [...item.value, action.field]} : item
          )}
      }
      else return {
        ...state, 
        selectedFieldsChangeFmv: [...state.selectedFieldsChangeFmv, 
          {header: action.string, value: [action.field]}
        ]
      }
      return state
    case EAct.removeFieldHeader:
      return {...state, 
        selectedFieldsChangeFmv: state.selectedFieldsChangeFmv.filter(item => item.header !== action.string)}
    case EAct.removeField:
      const findValue = state.selectedFieldsChangeFmv.find(item => item.header === action.string)
      if(findValue.value.length <=1 && findValue.value[0] === action.field) 
        return {...state, 
          selectedFieldsChangeFmv: state.selectedFieldsChangeFmv.filter(item => item.header !== action.string)}
      return {...state,
        selectedFieldsChangeFmv: state.selectedFieldsChangeFmv.map(item => 
          ({...item, value: item.value.filter(item2 => 
            item2 !== action.field)})
        )}
    case EAct.setOrPrice:
      return {...state, auditsFound: state.auditsFound.map(auditItem => {
        for (let i = 0; i < auditItem.fields.length; i++){
          const auditFields = auditItem.fields[i]
          for (let j = 0; j < state.selectedFieldsChangeFmv.length; j++) {
            const fmvItem = state.selectedFieldsChangeFmv[j]
            if (fmvItem.header === auditFields.field_name)
              for(let k = 0; k < auditFields.vvalues.length; k++){
                const auditValue = auditFields.vvalues[k]
                for(let l = 0; l < fmvItem.value.length; l++){
                  const fmvValue = fmvItem.value[l]
                  if (fmvValue === auditValue){
                    return {...auditItem, fmv: state.fmvValueChange}
              }}}}}
        return auditItem
      })}
    case EAct.setAndPrice:
      return  {...state, auditsFound: state.auditsFound.map(auditItem => {
        for (let j = 0; j < state.selectedFieldsChangeFmv.length; j++) {
          let headerFound = false
          const fmvItem = state.selectedFieldsChangeFmv[j]
          for (let i = 0; i < auditItem.fields.length; i++){
            const auditFields = auditItem.fields[i]
            if (fmvItem.header === auditFields.field_name){ 
              headerFound = true
              for(let l = 0; l < fmvItem.value.length; l++){
                let fieldFound = false
                const fmvValue = fmvItem.value[l]
                for(let k = 0; k < auditFields.vvalues.length; k++){
                  const auditValue = auditFields.vvalues[k]
                  if (fmvValue === auditValue) fieldFound = true
                }
                if (fieldFound !== true) return auditItem
              }
            }
          }
          if(headerFound !== true) return auditItem
        }
        return {...auditItem, fmv: state.fmvValueChange}
      })}
    case EAct.setAllPrice:
      return  {...state, auditsFound: state.auditsFound.map(auditItem => 
        ({...auditItem, fmv: state.fmvValueChange})
      )}
    default: return state
  }
}
class Init{
  // svr data holder
  jobsFound: IGetValueVidVname['value'] = []
  auditsFound: IGetJobAudits['value'] = []

  //program variables
  fmvValueChange='0'
  jobSelected = 0
  jobName = 0 
  jobNumber = 0
  salesman = 0
  plant = 0
  fullJobSelected:string = undefined

  selectedFieldsChangeFmv:Array<{header: string, value: Array<string>}> = []
}

const Index = () => {

  const [state, dispatch] = useReducer(reducer, new Init())
  const {showWindow} = useContext(ModalsContext)
  const {
    selectedFieldsChangeFmv,
    auditsFound,
    fullJobSelected,
    jobsFound,
    jobSelected,
    jobName,
    jobNumber,
    salesman,
    plant,
    fmvValueChange,
  } = state;
  
  const searchCustomer = useCallback(async () => {
    const svrResp = await jFetch('job-fmv/search-customer', 'POST', {
      jobSelected,
      jobName,
      jobNumber,
      salesman,
      plant,
    })
    if(svrResp.success) {
      dispatch({type: EAct.changeFoundCustomers, vidName: []})
      dispatch({type: EAct.changeFoundCustomers, vidName: svrResp.value})
    }
    else{
      dispatch({type: EAct.changeFoundCustomers, vidName: []})
      showWindow(svrResp)
    } 
  }, [jobSelected, jobName, jobNumber, salesman, plant])
  
  const getSelectedJob = useCallback(async() => {
    const svrResp:IGetJobAudits = await jFetch('job-fmv/get-job-audits', 'POST', {vid: parseInt(fullJobSelected)})
    if (svrResp.success){
      dispatch({type: EAct.rootField, field: 'auditsFound', value: svrResp.value})
    }
    else dispatch({type: EAct.rootField, field: 'auditsFound', value: []})
    
  }, [fullJobSelected])

  const changeFmvs = useCallback(async () => {
    const fmvValues = auditsFound.map(({fmv, id}) => ({fmv: parseFloat(fmv), auditId: id}))
    const svrResp = await jFetch('job-fmv/set-audit-fmv', 'POST', {audits: fmvValues})
    showWindow(svrResp)
  }, [auditsFound])

  return (
    <div className='root-div'>
      <style jsx>{`
      .root-div{
        display: inline-block;
      }
      .window{
        margin: 6px;
        display: inline-block;
      }
      .search-fields{
        display: flex;
        flex-direction: column;
      }
      .search-container{
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .customer-selection{
        min-width: 300px;
      }
      .audit-container{
        display: flex;
        flex-direction: row;
      }
      .audit-container > hr{
        margin: 0 6px;
      }
      .change-bulk-fmv > hr{
        margin: 4px 0;
      }
      .change-bulk-fmv{
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 6px;
        align-self: flex-start;
      }
      `}</style>
      <Head>
        <title>Fmv Manager</title>
      </Head>
      <div className='search-container'>
        <form onSubmit={e => e.preventDefault()} className='window window-lookup search-fields'>
          <label>Search Customer Job</label>
          <hr style={{margin: '6px 0'}} />
          <CustomerJob
            fnCustomer={(e: number) => dispatch({type: EAct.rootField, field: 'jobSelected', value: e})}
            fnJobName={(e: number) => dispatch({type: EAct.rootField, field: 'jobName', value: e})}
            fnJobNumber={(e: number) => dispatch({type: EAct.rootField, field: 'jobNumber', value: e})}
            fnSalesman={(e: number) => dispatch({type: EAct.rootField, field: 'salesman', value: e})}
            fnPlant={(e: number) => dispatch({type: EAct.rootField, field: 'plant', value: e})}
          />
          <hr style={{margin: '6px 0'}} />
          <SelfLockSubmitButton
            text='Search' 
            loadingText='Searching...' 
            onClick={searchCustomer} 
          />          
        </form>
        <form onSubmit={e => e.preventDefault()} className='window window-lookup customer-selection'>
          <SearchCustomerJob 
            jobsFound={jobsFound}
            selectedJob={fullJobSelected}
            fnSelectedJob={(e: string) => dispatch({type: EAct.rootField, field: 'fullJobSelected', value: e})} 
          />
          <hr style={{margin: '6px 0'}} />
          <SelfLockSubmitButton 
            text='Get Job Audits' 
            loadingText='Loading...'
            onClick={getSelectedJob} 
          />      
        </form>
      </div>
      <div style={auditsFound.length <= 0 ? {display: 'none'}: {}} className='audit-container window window-alert'>
        <div className='audits'>
          {auditsFound.map(({id, notes, fmv, name, options, fields}) => 
            <CompactView 
              key={id}
              audit_id={id} 
              order_qtt={0} 
              qtt_audit={0} 
              fmvChange={fmv}
              fnFmvChange={(id, value) => dispatch({type: EAct.changeFmv, auditId: id, string: value})}
              fnFieldClick={(fieldHeader, fieldValue) => dispatch({type: EAct.pushFieldValue, string: fieldHeader, field: fieldValue})}
              notes={notes} 
              class_name={name}  
              fields={fields} 
              options={options} 
            />
          )}
        </div>
        <hr />
        <aside className='change-bulk-fmv form-type'>
          <label>Fields selected</label>
          <hr />
          <FieldValueModifi 
            fields={selectedFieldsChangeFmv} 
            fnHeaderClick={(header) => dispatch({type: EAct.removeFieldHeader, string: header})}
            fnFieldClick={(header, field) => dispatch({type: EAct.removeField, string: header, field})}
          />
          <label>Change Fmv</label> 
          <CurrencyInput 
            placeholder='Price'
            value={fmvValueChange}
            decimalsLimit={2}
            onValueChange={e => dispatch({type: EAct.rootField, field: 'fmvValueChange', value: e === undefined ? "0" : e})}
            prefix='$'
            maxLength={15}
          />
          <button onClick={() => dispatch({type: EAct.setAllPrice})}>ALL Set</button>
          <button onClick={() => dispatch({type: EAct.setAndPrice})}>AND Set</button>
          <button onClick={() => dispatch({type: EAct.setOrPrice})}>OR Set</button>
          <hr />
          <SelfLockSubmitButton 
            text='Submit' 
            loadingText='Changing Fmvs...' 
            onClick={() => changeFmvs()}
          />
        </aside>
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
    
    if(reqPermission.canLogin !== true) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canFmvPriceChange === true) return {props: {
      check: true
    }};
    else return {notFound : true}
  })
  return value
}