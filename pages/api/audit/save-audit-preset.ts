import { NextApiRequest, NextApiResponse } from "next";
import { saveAuditPreset } from "../../../database/postgres/audit/audit";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await saveAuditPreset(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: 'Could not Save Preset'})
  } 
}

export default handler