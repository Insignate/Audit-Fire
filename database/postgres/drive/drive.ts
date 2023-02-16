import { NextApiRequest, NextApiResponse } from "next";
import RequesterInfo from "../../../permissions/requester";
import { validateDataInput, castInput } from "../../../schemas/dataValidation";
import { cvInsertNewDrive, cvInsertNotWorkingDrive, IGetJobDriveReport, IInsertNewDrive, IInsertNotWorkingDrive, vCheckIntVid, vGetJobDriveReport } from "../../../schemas/inputValidation";
import * as db from "./dbCom"

export const insertNewDrive = async (req: NextApiRequest, res: NextApiResponse) => { 
  castInput(cvInsertNewDrive, req)
  const val = await validateDataInput(cvInsertNewDrive, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  
  const {JobId, Model, Size, Serial, PowerOnHours, Health, LifetimeWrites, SmartDATA, ZeroSectorRaw, PushDriveToDb}:IInsertNewDrive = req.body
  return await db.insertNewDrive(JobId, Model, Size, Serial, PowerOnHours, Health, LifetimeWrites, SmartDATA, ZeroSectorRaw.Status, ZeroSectorRaw.StartWipe, ZeroSectorRaw.EndWipe, PushDriveToDb)
  
}

export const insertNotWorkingDrive = async (req: NextApiRequest, res: NextApiResponse) => { 
  const val = await validateDataInput(cvInsertNotWorkingDrive, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  
  const {JobId, Size, SerialNumber, Force}:IInsertNotWorkingDrive = req.body

  return await db.insertNotWorkingDrive(JobId, Size, SerialNumber, Force)
  
}

export const getJobDriveReport = async (req: NextApiRequest, res: NextApiResponse) => { 
  const val = await validateDataInput(vGetJobDriveReport, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canDriveR2 !== true) return userPermissions.canDriveR2
  
  const {vid, type, detail}:IGetJobDriveReport = req.body

  const jobReport = await db.getJobDriveReport(vid, detail)
  return jobReport
}