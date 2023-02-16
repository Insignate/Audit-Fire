import { NextApiRequest, NextApiResponse } from "next";
import { setNewPlacementJob } from "../../../database/postgres/Jobs/jobs";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const svrResp = await setNewPlacementJob(req, res)
    res.status(200).json(svrResp)
  } catch (error) {
    console.error(error)
    return res.status(200).json({error: error.message})
  } 
}

export default handler