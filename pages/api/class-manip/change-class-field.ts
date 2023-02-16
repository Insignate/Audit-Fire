import { NextApiRequest, NextApiResponse } from "next";
import { changeFieldProperties } from "../../../database/postgres/classManip/classManip";


export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await changeFieldProperties(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: "Could Not Change item"})
  } 
}

export default handler