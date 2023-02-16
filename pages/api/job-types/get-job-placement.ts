import { NextApiRequest, NextApiResponse } from "next";
import { getJobsFromPlacement } from "../../../database/postgres/jobRegistry/customer";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await getJobsFromPlacement(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler