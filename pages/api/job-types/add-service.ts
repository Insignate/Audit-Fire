import { NextApiRequest, NextApiResponse } from "next";
import { addService } from "../../../database/postgres/jobRegistry/customer";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await addService(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler