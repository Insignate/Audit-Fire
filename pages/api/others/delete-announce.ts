import { NextApiRequest, NextApiResponse } from "next";
import { deleteAnnounce } from "../../../database/postgres/others/others";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await deleteAnnounce(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler