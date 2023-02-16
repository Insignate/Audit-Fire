import { NextApiRequest, NextApiResponse } from "next";
import { insertNewDrive } from "../../../database/postgres/drive/drive";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await insertNewDrive(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error})
  } 
}

export default handler