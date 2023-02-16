import { IGetJobAudits } from "../../../tsTypes/psqlResponses";
import { values } from "../../../utils/valueConfig";
import { getDB } from "../connection";
const { db } = getDB()

export const searchCustomer = async (
  jobSelected: number, 
  jobName: number, 
  jobNumber: number, 
  salesman: number,
  plant: number
):Promise<any> => {
  let jobCustI = jobSelected, 
    jobCustF = jobSelected, 
    jobNameI = jobName, 
    jobNameF = jobName,
    jobNumberI = jobNumber,
    jobNumberF = jobNumber,
    salesmanI = salesman,
    salesmanF = salesman,
    plantI = plant,
    plantF = plant

  if (jobSelected === 0) jobCustF = values.maxInt
  if (jobName === 0) jobNameF = values.maxInt
  if (jobNumber === 0) jobNumberF = values.maxInt
  if (salesman === 0) salesmanF = values.maxInt
  if (plant === 0) plantF = values.maxInt
  try {
    const psqlResp = await db.func("jobs_search_customer", [
      jobCustI,
      jobCustF,
      jobNameI,
      jobNameF,
      jobNumberI,
      jobNumberF,
      salesmanI,
      salesmanF,
      plantI,
      plantF
    ]);
    if (psqlResp.length > 0) return {success: 'Customers Found', value: psqlResp}
    else return {info: "No Customer Jobs Found"}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: "Could not get customer jobs"}
  }
}

export const getJobAudits = async (
  jobId: number
):Promise<IGetJobAudits> => {
  try {
    const psqlResp = await db.func("job_get_audits", [jobId])
    if (psqlResp[0].job_get_audits.audits) 
      return {success: 'Audits Found', value: psqlResp[0].job_get_audits.audits}
    else return {info: 'No audits under the job specified'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: "Could not get customer jobs"}
  }
}
export const setAuditFmv = async (audits: Array<{fmv: number, auditId: number}>) => {
  try {
    const psqlResp = await db.func("audit_set_fmv", [JSON.stringify(audits)])
    if (psqlResp[0].audit_set_fmv === 0) 
      return {success: 'Audits Fmv Changed'}
    else return {info: 'No audits have changed'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not change audits fmv'}
  }
}