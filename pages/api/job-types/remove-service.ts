import { NextApiRequest, NextApiResponse } from "next";
import { removeService } from "../../../database/postgres/jobRegistry/customer";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await removeService(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler