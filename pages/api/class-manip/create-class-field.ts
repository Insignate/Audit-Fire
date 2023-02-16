import { NextApiRequest, NextApiResponse } from "next";
import { addClassField } from "../../../database/postgres/classManip/classManip";


export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await addClassField(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: "Could Not Add Class Field"})
  } 
}

export default handler