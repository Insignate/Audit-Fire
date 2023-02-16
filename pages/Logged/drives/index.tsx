import { NextApiRequest, NextApiResponse } from 'next'
import React, { ChangeEvent, useCallback, useEffect, useReducer } from 'react'
import { SelfLockSubmitButton } from '../../../components/buttons'
import Selectbox from '../../../components/Selectbox'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IJobPlacementPerm, IJobPlacementSelected, ISvrGetJobDriveReport, ISvrSingleJobDriveReport, ISvrSingleJobNotWorkingDriveReport } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { formatDateTimeUs } from '../../../utils/dateTimeFormat'
import { DocumentReport } from '../../../utils/documents/documentReports'
import { getFetch, jFetch } from '../../../utils/fetchs'

interface IAct{
  type: EAct
  value?: any
  field?: string
  number?: number
  vidNameExpect?: IJobPlacementSelected['success']
  wipedDrives?: Array<ISvrSingleJobDriveReport>
  destroyedDrives?: Array<ISvrSingleJobDriveReport>
  notWorkingDestroyedDrives?: Array<ISvrSingleJobNotWorkingDriveReport>
}

enum EAct {
  rootField,
  setJobsFromPlace,
  setJobDriveReport
}

const reducer = (state: Init, action: IAct) => {
  switch(action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    case EAct.setJobsFromPlace:
      return {
        ...state, 
        activePlacement: action.number, 
        jobPlacementSelection: action.vidNameExpect,
        jobToAuditSelected: undefined
      }
    case EAct.setJobDriveReport:
      return {
        ...state,
        wipedDrives: action.wipedDrives,
        destroyedDrives: action.destroyedDrives,
        notWorkingDestroyedDrives: action.notWorkingDestroyedDrives
      }
    default: return state
  }
}

class Init{
  jobPlacements: IJobPlacementPerm['success'] = []
  jobPlacementSelection: IJobPlacementSelected['success'] = []
  wipedDrives: Array<ISvrSingleJobDriveReport> = []
  destroyedDrives: Array<ISvrSingleJobDriveReport> = []
  notWorkingDestroyedDrives: Array<ISvrSingleJobNotWorkingDriveReport> = []

  activePlacement = 0
  jobToAuditSelected: string = undefined
  activeReportType = '0'
  activeReportDetail = '0'
  reportName = ""
}


const Index = () => {

  const [ state, dispatch ] = useReducer(reducer, new Init)

  const {
    jobPlacements,
    activePlacement,
    jobToAuditSelected,
    jobPlacementSelection,
    activeReportType,
    activeReportDetail,
    wipedDrives,
    destroyedDrives,
    notWorkingDestroyedDrives,
    reportName
  } = state;
  
  const getJobsFromPlacement = useCallback(async(e: ChangeEvent<HTMLSelectElement>["target"]) => {
    const parseValue = parseInt(e.value)
    if (!isNaN(parseValue)){
      const svrResp:IJobPlacementSelected = await jFetch("job-types/get-job-placement", "POST", {vid: parseValue})
      if (svrResp.success){
        dispatch({type: EAct.setJobsFromPlace, number: parseValue, vidNameExpect: svrResp.success})
      }
      else dispatch({type: EAct.setJobsFromPlace, number: undefined, vidNameExpect: []})
    }
    else dispatch({type: EAct.setJobsFromPlace, number: undefined, vidNameExpect: []})
  }, [])

  const getJobDriveReport = useCallback(async () => {
    const svrResp:ISvrGetJobDriveReport = await jFetch('r2drives/get-job-drive-report', 'POST', {
      vid: parseInt(jobToAuditSelected), 
      type: parseInt(activeReportType), 
      detail: parseInt(activeReportDetail)
    })

    if (svrResp.success){
      let dDrives:Array<ISvrSingleJobDriveReport> = []
      let wDrives:Array<ISvrSingleJobDriveReport> = []
      let ndDrives: Array<ISvrSingleJobNotWorkingDriveReport> = []
      
      ndDrives = svrResp.success.not_working_drives === null ? [] : svrResp.success.not_working_drives

      svrResp.success.working_drives.forEach(item => {
        if (item.wipe_end !== null){
          const {time: sTime, date: sDate} = formatDateTimeUs(new Date(item.wipe_start))
          const {time: eTime, date: eDate} = formatDateTimeUs(new Date(item.wipe_end))
          wDrives.push({...item, wipe_start: sDate + " " + sTime, wipe_end: eDate + " " + eTime})
        }
        else dDrives.push(item)
      })
      
      dispatch({type: EAct.setJobDriveReport, 
        wipedDrives: wDrives,
        destroyedDrives: dDrives,
        notWorkingDestroyedDrives: ndDrives
      })
    }
  }, [activeReportType, jobToAuditSelected, activeReportDetail])

  const createReport = useCallback(async () => {
    const docReport = new DocumentReport()
    docReport.fileName = reportName
    if (activeReportType === '2'){
      await docReport.drives(wipedDrives, destroyedDrives, notWorkingDestroyedDrives)
    }
    else {
      await docReport.destroyDrives([...wipedDrives, ...destroyedDrives], notWorkingDestroyedDrives)
    }
    
  }, [wipedDrives, destroyedDrives, notWorkingDestroyedDrives, reportName])
  useEffect(() => {
    const getJobPlacement = async () => {
      const svrResp: IJobPlacementPerm = await getFetch("job-types/get-all-placements-with-permissions")
      if (svrResp.success)
        dispatch({type: EAct.rootField, field: 'jobPlacements', value: svrResp.success})
    }
    getJobPlacement()
  }, [])



  return (
    <div className='root-field'>
      <style jsx>{`
      .root-field{
        display: flex;
        flex-direction: column;
        align-items: baseline;
      }
      .window{
        margin: 6px;
      }
      .searched-jobs{
        display: flex;
        flex-direction: column;
      }
      .searched-jobs-container{
        display: flex;
      }
      .searched-jobs-container > hr{
        margin: 0 6px;
      }
      .report-type{
        align-self: flex-start;
        display: flex;
        flex-direction: column;
      }
      .drives-found{
        text-align: center;
      }
      `}</style>
      <section className='window window-lookup searched-jobs-container'>
        <div className='searched-jobs'>
          <header>
            <form>
              <div>
                <label>Job Placement: </label>
                <Selectbox 
                  valueSelected={activePlacement} 
                  onChange={(e: ChangeEvent<HTMLSelectElement>["target"]) =>{getJobsFromPlacement(e) }} 
                  selectInfoText={'---Select Active Placement---'} 
                  styling={''} 
                  obj={jobPlacements} 
                />
              </div>
              
            </form>
          </header>
          <hr style={{marginTop: '6px'}}/>
          <div style={{overflow: "auto"}}>
            <label style={{position: "sticky", left: "0"}}>Select a job below</label><br />
            <Selectbox 
              valueSelected={jobToAuditSelected} 
              onChange={(e: ChangeEvent<HTMLSelectElement>["target"]) => dispatch({type: EAct.rootField, field: "jobToAuditSelected", value: e.value})} 
              styling={'min-width: max-content; width: fill-available; width: -moz-available; width: -webkit-fill-available; margin: 6px 0;'} 
              showHelper={false}
              size={16}
              obj={jobPlacementSelection} 
            />
          </div>
        </div>
        <hr />
        <div>
          <fieldset className='report-type'>
            <legend>Report Type</legend>
              <label><input 
                type="radio" 
                value='1' 
                onChange={e => dispatch({type: EAct.rootField, field: 'activeReportType', value: e.target.value})}
                name="report-type" 
                checked={activeReportType === '1'}
              /> R2</label>
              <label><input 
                type="radio" 
                value='2' 
                onChange={e => dispatch({type: EAct.rootField, field: 'activeReportType', value: e.target.value})}
                name="report-type" 
                checked={activeReportType === '2'}
              /> R2+</label>
              <label><input 
                type="radio" 
                value='3' 
                onChange={e => dispatch({type: EAct.rootField, field: 'activeReportType', value: e.target.value})}
                checked={activeReportType === '3'}
                name="report-type" 
              /> COD</label>
              <hr style={{marginTop: '6px'}} />
              <label><input 
                type="radio" 
                value='1' 
                onChange={e => dispatch({type: EAct.rootField, field: 'activeReportDetail', value: e.target.value})}
                checked={activeReportDetail === '1'}
                name="report-detail" 
              /> Simple</label>
              <label><input 
                type="radio" 
                value='2' 
                onChange={e => dispatch({type: EAct.rootField, field: 'activeReportDetail', value: e.target.value})}
                checked={activeReportDetail === '2'}
                name="report-detail" 
              /> Per Drive</label>
          </fieldset>
          <fieldset>
            <legend>Generate Report</legend>
            <label htmlFor="report-name">Report Name</label><br />
            <input 
              type="text" 
              id="report-name"
              onChange={e => dispatch({type: EAct.rootField, field: 'reportName', value: e.target.value})}
              value={reportName}
              placeholder="Enter Report Name"
            /><br />
            <hr style={{margin: '6px 0'}} />
            <SelfLockSubmitButton 
              text='Get Job Drives' 
              loadingText={'Loading...'} 
              onClick={getJobDriveReport}   
              styling='width: 100%;'       
            />
            <br />
            <SelfLockSubmitButton 
              text='Generate Report' 
              loadingText='Generating...'
              onClick={createReport} 
              styling='width: 100%;'
            />
          </fieldset>
          
        </div>
      </section>
      <section className='window window-read drives-found'>
        <table>
        <caption>Digitally Sanitized</caption>
          <thead>
            <tr>
              <th>name</th>
              <th>serial number</th>
              <th>size</th>
              <th>wipe config</th>
              <th>wipe start</th>
              <th>wipe end</th>
            </tr>
            </thead>
          <tbody>
            {wipedDrives.map(({name, serial_number, size, wipe_config, wipe_start, wipe_end}) => {
              return <tr key={serial_number} >
                <td>{name}</td>
                <td>{serial_number}</td>
                <td>{size > 999 ? size/1000 + " tb" : size + " gb"}</td>
                <td>{wipe_config}</td>
                <td>{wipe_start}</td>
                <td>{wipe_end}</td>
              </tr>
            })}
          </tbody>
        </table>
        <table>
          <caption>Destroyed Drives</caption>
          <thead>
            <tr>
              <th>name</th>
              <th>serial number</th>
              <th>size</th>
              <th>wipe config</th>
              <th>wipe start</th>
              <th>wipe end</th>
            </tr>
            </thead>
          <tbody>
            {destroyedDrives.map(({name, serial_number, size, wipe_config, wipe_start, wipe_end}) => {
              return <tr key={serial_number} >
                <td>{name}</td>
                <td>{serial_number}</td>
                <td>{size > 999 ? size/1000 + " tb" : size + " gb"}</td>
                <td>{wipe_config}</td>
                <td>{wipe_start}</td>
                <td>{wipe_end}</td>
              </tr>
            })}
          </tbody>
        </table>
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
    
    if(reqPermission.canLogin !== true) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canDriveR2 === true) return {props: {
      pass: true
    }};
    else return {notFound : true}
  })
  return value
}