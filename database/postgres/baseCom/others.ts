import { NextApiRequest, NextApiResponse } from "next";
import RequesterInfo from "../../../permissions/requester";
import { validateDataInput } from "../../../schemas/dataValidation";
import { getDB } from "../connection";
import * as db from "./dbCom"

// export const 'name' = async (req: NextApiRequest, res: NextApiResponse) => {  
//   const val = await validateDataInput(, req, res)
//   if (val !== true) return {info: "Relog to the system"}
//   const userPermissions = new RequesterInfo()
//   await userPermissions.initiateReq(req)
//   if (userPermissions.canLogin !== true) return userPermissions.canLogin
//   if (userPermissions. !== true) return userPermissions.

//   const {} = req.body
//   return await db
// }