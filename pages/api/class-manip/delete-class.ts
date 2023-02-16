import { NextApiRequest, NextApiResponse } from "next";
import { deleteClass } from "../../../database/postgres/classManip/classManip";


export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await deleteClass(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: "Could not delete class"})
  } 
}

export default handler