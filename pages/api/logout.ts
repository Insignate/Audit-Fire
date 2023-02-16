import {NextApiRequest, NextApiResponse} from "next"
import { deleteCookies } from "../../utils/customCookies"


export default function handler(req : NextApiRequest, res: NextApiResponse) {
  if (req.headers.cookie !== undefined)
    deleteCookies(res)  
  res.status(200).json({success: "Logged out"})
}
