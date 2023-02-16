import { NextApiRequest, NextApiResponse } from "next";
import { bulkMove } from "../../../database/postgres/audit/audit";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await bulkMove(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: 'Could not create audit'})
  } 
}

export default handler