import { NextApiRequest, NextApiResponse } from "next";
import { getJobDriveReport } from "../../../database/postgres/drive/drive";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await getJobDriveReport(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler