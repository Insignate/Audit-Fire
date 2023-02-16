import { NextApiRequest, NextApiResponse } from "next";
import { setAuditFmv } from "../../../database/postgres/priceManage/price";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await setAuditFmv(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler