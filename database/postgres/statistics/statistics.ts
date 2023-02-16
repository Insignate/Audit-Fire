import { NextApiRequest, NextApiResponse } from "next";
import RequesterInfo from "../../../permissions/requester";
import { castInput, validateDataInput } from "../../../schemas/dataValidation";
import { vGetEmployeeProductivity } from "../../../schemas/inputValidation";
import * as db from "./dbCom";

export const getAuditersProductivity = async (req: NextApiRequest, res: NextApiResponse) => {  
  castInput(vGetEmployeeProductivity, req)
  const val = await validateDataInput(vGetEmployeeProductivity, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canEmployeeStatistics !== true) return userPermissions.canFmvPriceChange

  const {start, end} = req.body
  return await db.getAuditersProductivity(start, end)
}