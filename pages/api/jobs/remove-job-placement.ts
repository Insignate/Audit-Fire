import { NextApiRequest, NextApiResponse } from "next";
import { removeJobPlace } from "../../../database/postgres/Jobs/jobs";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await removeJobPlace(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json(error)
  } 
}

export default handler