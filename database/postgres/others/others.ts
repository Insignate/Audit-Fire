import { NextApiRequest, NextApiResponse } from "next";
import RequesterInfo from "../../../permissions/requester";
import { validateDataInput, validateHeader } from "../../../schemas/dataValidation";
import { IChangeAnnounceStatus, IGetVid, ISetAnnounce, ISetNewReminder, vChangeAnnounceStatus, vGetVid, vSetAnnounce, vSetNewReminder } from "../../../schemas/inputValidation";
import * as db from "./dbCom"

export const setAnnounce = async (req: NextApiRequest, res: NextApiResponse) => {  
  const val = await validateDataInput(vSetAnnounce, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAnnounce !== true) return userPermissions.canAnnounce

  await userPermissions.setIdReq(req)

  const {announce, show}: ISetAnnounce = req.body
  return await db.setAnnounce(announce, show, userPermissions.myUserId)
}
export const deleteAnnounce = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAnnounce !== true) return userPermissions.canAnnounce

  const {v_id}:IGetVid = req.body
  return await db.deleteAnnounce(v_id)
}
export const getAllAnnounces = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAnnounce !== true) return userPermissions.canAnnounce

  return await db.getAllAnnounces()
}
export const changeAnnounceStatus = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vChangeAnnounceStatus ,req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAnnounce !== true) return userPermissions.canAnnounce

  const {id, status}:IChangeAnnounceStatus = req.body
  return await db.changeAnnounceStatus(id, status)
}
export const getAnnounces = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin

  return await db.getAnnounces()
}
export const saveSelfReminder = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vSetNewReminder, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPerm = new RequesterInfo()
  await userPerm.initiateReq(req)
  if (userPerm.canLogin !== true) return userPerm.canLogin

  await userPerm.setIdReq(req)
  const {newReminder}:ISetNewReminder = req.body

  return await db.saveSelfReminder(userPerm.myUserId, newReminder)
}
export const deleteSelfReminder = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPerm = new RequesterInfo()
  await userPerm.initiateReq(req)
  if (userPerm.canLogin !== true) return userPerm.canLogin

  await userPerm.setIdReq(req)
  const {v_id}:IGetVid = req.body

  return await db.deleteSelfReminder(userPerm.myUserId, v_id)
}
export const getMyReminders = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPerm = new RequesterInfo()
  await userPerm.initiateReq(req)
  if (userPerm.canLogin !== true) return userPerm.canLogin

  await userPerm.setIdReq(req)

  return await db.getMyReminders(userPerm.myUserId)
}