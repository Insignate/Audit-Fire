import { NextApiRequest, NextApiResponse } from "next"
import RequesterInfo from "../../../permissions/requester"
import { validateDataInput } from "../../../schemas/dataValidation"
import { vCheckIntVid, vSearchCustomer, vSetAuditFmv } from "../../../schemas/inputValidation"
import * as db from "./dbCom"

export const searchCustomer = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vSearchCustomer, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canFmvPriceChange !== true) return userPermissions.canFmvPriceChange

  const {jobSelected, jobName, jobNumber, salesman, plant} = req.body
  return await db.searchCustomer(jobSelected, jobName, jobNumber, salesman, plant)
}

export const getJobAudits = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vCheckIntVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canFmvPriceChange !== true) return userPermissions.canFmvPriceChange

  const {vid} = req.body
  return await db.getJobAudits(vid)
}

export const setAuditFmv = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vSetAuditFmv, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canFmvPriceChange !== true) return userPermissions.canFmvPriceChange

  const {audits} = req.body
  return await db.setAuditFmv(audits)
}

