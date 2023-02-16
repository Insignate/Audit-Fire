import { NextApiRequest, NextApiResponse } from "next";
import { getAuditersProductivity } from "../../../database/postgres/statistics/statistics";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await getAuditersProductivity(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler