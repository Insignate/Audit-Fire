import { NextApiRequest, NextApiResponse } from "next";
import { getAllPermissions } from "../../database/postgres/permissionList";
import { validateLoginHeader } from "../../schemas/dataValidation";
import { userTokenIdent } from "../../schemas/user";


export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const svrResp = await getAllPermissions();
  res.status(200).json(svrResp)
}
export default validateLoginHeader(userTokenIdent, handler)

