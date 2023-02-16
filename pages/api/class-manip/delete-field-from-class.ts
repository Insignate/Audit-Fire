import { NextApiRequest, NextApiResponse } from "next";
import { deleteFieldClass } from "../../../database/postgres/classManip/classManip";


export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await deleteFieldClass(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: "Could not delete field from class"})
  } 
}

export default handler