import { NextApiRequest, NextApiResponse } from "next";
import { getFieldsFromClass } from "../../../database/postgres/classManip/classManip";


export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await getFieldsFromClass(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: "Could not retrieve class fields"})
  } 
}

export default handler