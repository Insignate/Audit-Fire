import { IRespAuditerPerformance } from "../../../tsTypes/psqlResponses";
import { getDB } from "../connection";
const { db } = getDB()

export const getAuditersProductivity = async (start: Date, end: Date): Promise<IRespAuditerPerformance> => {
  try {
    const psqlResp = await db.func("statistics_get_all_auditers", [start, end])
    if (psqlResp.length > 0) 
      return {success: 'Auditers Found', values: psqlResp}
    else return {info: 'No Audits Found'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not retrieve auditer statistics'}
  }
}