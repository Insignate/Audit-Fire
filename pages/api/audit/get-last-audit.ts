import { NextApiRequest, NextApiResponse } from "next";
import { getEditAudit } from "../../../database/postgres/audit/audit";



export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await getEditAudit(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: 'Could not retrieve audit'})
  } 
}

export default handler