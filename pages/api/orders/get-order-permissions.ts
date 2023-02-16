import { NextApiRequest, NextApiResponse } from "next";
import { getOrderPermissions } from "../../../database/postgres/orders/orders";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await getOrderPermissions(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler