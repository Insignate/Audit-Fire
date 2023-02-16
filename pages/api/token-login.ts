import { NextApiRequest, NextApiResponse } from "next";
import { validateLoginHeader } from "../../schemas/dataValidation";
import { userTokenIdent } from "../../schemas/user";


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({success: "validated"})
}
export default validateLoginHeader(userTokenIdent, handler)


