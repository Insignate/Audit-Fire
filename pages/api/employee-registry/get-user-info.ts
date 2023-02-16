import { NextApiRequest, NextApiResponse } from "next";
import { getSpecificUserInfo } from "../../../database/postgres/registry";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await getSpecificUserInfo(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json(error)
  } 
}

export default handler