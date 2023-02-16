import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { SelfLockSubmitButton } from '../../../components/buttons'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IAuditerPerformance, IRespAuditerPerformance } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { jFetch } from '../../../utils/fetchs'
import { ModalsContext } from '../../../utils/Modals'

interface IAct{
  type: EAct
  field?: string
  value?: string | number | boolean | Array<IAuditerPerformance>
  dateStart?: string
  dateEnd?: string
}

enum EAct {
  rootField,
  changeDateRange
}

const reducer = (state: Init, action: IAct) => {
  switch(action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    case EAct.changeDateRange:
      return {...state, searchDateStart: action.dateStart, searchDateEnd: action.dateEnd}
    default: return state
  }
}
class Init{
  //server data
  svrAuditerProductivity: Array<IAuditerPerformance> = []
  //program variables
  searchDateStart = new Date().toJSON().slice(0,10).replace(/-/g,'-');
  searchDateEnd = new Date().toJSON().slice(0,10).replace(/-/g,'-');
}
const Employee = () => {
  const [state, dispatch] = useReducer(reducer, new Init())
  const {showWindow} = useContext(ModalsContext)
  const {searchDateStart, 
    searchDateEnd,
    svrAuditerProductivity
  } = state

  const getProductivity = useCallback( async () => {
    const svrResp:IRespAuditerPerformance = await jFetch('reports/get-employee-productivity', 'POST', {start: searchDateStart, end: searchDateEnd})
    if (svrResp.success)
      dispatch({type: EAct.rootField, field: 'svrAuditerProductivity', value: svrResp.values})
    else{
      dispatch({type: EAct.rootField, field: 'svrAuditerProductivity', value: []})
      showWindow(svrResp)
    }
  
  }, [searchDateStart, searchDateEnd])
  
  return (
    <div className='root-div'>
      <style jsx>{`
        section{
          float: left;
        }
        tbody > tr > td{
          border-top: 1px solid var(--foreground);
        }
        th, td{
          padding: 2px 4px;
        }
        .root-div{
          display: inline-block;
        }
        .window{
          margin: 6px;
        }
        .search-dates{
          display: flex;
          flex-direction: column;
        }
        
      `}</style>
      <Head>
        <title>Employee Statistics</title>
      </Head>
      <section className='window window-lookup search-dates'>
        <label>Search Audit By Date</label>
        <hr />
        <label htmlFor="idate">Initial Date:</label>
        {useMemo(() => <input 
          type="date" 
          id="idate" 
          value={searchDateStart}
          onChange={e => dispatch({type: EAct.rootField, field: 'searchDateStart', value: e.target.value})}
        />, [searchDateStart])}
        <label htmlFor="edate">End Date:</label>
        {useMemo(() => <input 
          type="date" 
          id="edate" 
          value={searchDateEnd}
          onChange={e => dispatch({type: EAct.rootField, field: 'searchDateEnd', value: e.target.value})}
        />, [searchDateEnd])}
        <hr style={{margin: '6px 0'}} />
        <SelfLockSubmitButton 
          text='Search'
          loadingText='Searching...' 
          onClick={() => getProductivity()} 
        />
      </section>
      <section className='window window-lookup search-dates'>
        <table>
          <caption>Employee Productivity</caption>
          <thead>
            <tr>
              <th>Name</th>
              <th>Assets</th>
            </tr>
          </thead>
          <tbody>
            {svrAuditerProductivity.map(({name, qtt_audited}, index) => 
              <tr key={index}>
                <td>{name}</td>
                <td>{qtt_audited}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default Employee

export const getServerSideProps = async ({req, res} : {req: NextApiRequest, res: NextApiResponse}) => {

  const value = await nextValidateLoginHeader(userTokenIdent, req, res, async () => {
    const {token, ident} = getCookie(req)
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissions(ident, token)
    
    if(reqPermission.canLogin !== true ) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canEmployeeStatistics === true) return {props: {
      check: true
    }};
    else return {notFound : true}
  })
  return value
}