import { NextApiRequest, NextApiResponse } from "next"
import { EOrderAuditPermission } from "../../../permissions/dbRegisterPerm"
import JobPermissions from "../../../permissions/jobPermission"
import RequesterInfo from "../../../permissions/requester"
import { castInput, validateDataInput, validateHeader } from "../../../schemas/dataValidation"
import { IBulkAuditChange, ICreateAudit, IEditAudit, IGetAuditPreset, IGetVid, ISaveAuditPreset, ISearchAudits, vBulkAuditChange, vBulkAuditMove, vCheckIntVid, vCreateAudit, vEditAudit, vGetAuditPreset, vGetAuditSpecificHistory, vGetVid, vSaveAuditPreset, vSearchAudits } from "../../../schemas/inputValidation"
import { IMultipleAuditSearch, ISvrGetAuditPreset } from "../../../tsTypes/psqlResponses"
import * as db from "./dbCom"

export const editAudit = async (req: NextApiRequest, res: NextApiResponse) => {
  
  const val = await validateDataInput(vEditAudit, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAudit !== true) return userPermissions.canAudit
  
  const {asked_to_audit, vclass, audit, quantity, fields, options, notes}:IEditAudit = req.body

  await userPermissions.setIdReq(req)
  const auditPermission = await getAuditPermission(audit)

  if (EOrderAuditPermission.askForEditing === auditPermission && asked_to_audit !== true)
    return {ask: 'This audit is currently in an order, do you wish to change this audit?' }
  else if(EOrderAuditPermission.onlyAdminEdit === auditPermission 
    && (asked_to_audit !== true 
    || userPermissions.isAdmin !== true))
    return {ask: 'This audit can only be modified by administrators, if you are, make sure you can change this audit'}
  else if (EOrderAuditPermission.lockedFromEditing === auditPermission) return {alert: 'This audit cannot be modified because it is in an order that does not support editing'}
  
  return db.editAudit(vclass, audit, quantity, fields, options, notes, userPermissions.myUserId)
}

export const getAuditPermission = (audit: number) => {
  return db.getAuditPermission(audit)
}

export const createAudit = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCreateAudit, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAudit !== true) return userPermissions.canAudit
  
  const {jobId, vclass, audit, quantity, fields, options, editFields, editOptions, asIsAudit, editNotes, notes}:ICreateAudit = req.body
  const jobPerm = new JobPermissions();
  await jobPerm.getDbPermissions(jobId)
  if (jobPerm.canAudit !== true) return jobPerm.canAudit

  await userPermissions.setIdReq(req)
  
  const newAuditResult = await db.addNewAudit(jobId, vclass, audit, quantity, fields, options, notes, userPermissions.myUserId)
  if (newAuditResult.success && asIsAudit === true){
    console.log("awaiting 1.5 seconds")
    await sleep(1500)
    console.log("awaiting complete")
    return await db.editAudit(vclass, audit, quantity, editFields, editOptions, editNotes, userPermissions.myUserId)
  }
  else return newAuditResult
}

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const getEditAudit = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckIntVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAudit !== true) return userPermissions.canAudit
  const {vid} = req.body
  await userPermissions.setIdReq(req)
  
  return db.getLastAudit(vid)

}

export const getAuditHistory = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckIntVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canSearchAuditHistory !== true) return userPermissions.canSearchAuditHistory
  const {vid} = req.body

  return db.getDbAuditHistory(vid)
}

export const getSpecificAuditHistory = async (req: NextApiRequest, res: NextApiResponse) => {
  castInput(vGetAuditSpecificHistory, req)
  const val = await validateDataInput(vGetAuditSpecificHistory, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canSearchAuditHistory !== true) return userPermissions.canSearchAuditHistory
  const {vid, date} = req.body
  return db.getAuditByDateTime(vid, date)
}

export const bulkChange = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vBulkAuditChange, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAudit !== true) return userPermissions.canAudit
  await userPermissions.setIdReq(req)

  const {ask_to_change, audits, quantity, notes, options, fields, vclass}: IBulkAuditChange = req.body

  return db.auditBulkChange(
    audits, 
    options, 
    quantity, 
    notes, 
    fields, 
    vclass, 
    userPermissions.myUserId, 
    ask_to_change, 
    userPermissions.isAdmin !== true ? false : true)
}

export const bulkMove = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vBulkAuditMove, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAudit !== true && userPermissions.canBulkMoveAudit !== true) return {error: 'You do not have permissions to bulk move the audit'}

  let {assets, location, force} = req.body

  if(location.trim() === '') return {info: 'Location needs be filled'}
  
  assets = assets.map(item => parseInt(item)).flat()

  await userPermissions.setIdReq(req)
  if (assets.length <= 0) return {info: 'You need to enter assets to be changed'}
  return db.auditBulkMove(location, assets, force, userPermissions.myUserId, userPermissions.isAdmin === true ? true : false)
}

export const searchAudits = async (req: NextApiRequest, res: NextApiResponse): Promise<IMultipleAuditSearch> => {  
  const val = await validateDataInput(vSearchAudits, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true &&
    userPermissions.canAudit !== true) return {info: 'You do not have permissions to search Audits'}

  const {search, options, classId}:ISearchAudits = req.body

  return await db.searchAudits(options, search, classId)
  
}

export const saveAuditPreset = async (req: NextApiRequest, res: NextApiResponse): Promise<IMultipleAuditSearch> => {  
  const val = await validateDataInput(vSaveAuditPreset, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true &&
    userPermissions.canAudit !== true) return {info: 'You do not have permissions to search Audits'}

  const {preset, options, class_id, name, presetEdit, editOptions}:ISaveAuditPreset = req.body

  return await db.saveAuditPreset(name, class_id, preset, options, presetEdit, editOptions)
  
}

export const getAuditPresets = async (req: NextApiRequest, res: NextApiResponse): Promise<ISvrGetAuditPreset> => {  
  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true &&
    userPermissions.canAudit !== true) return {info: 'You do not have permissions to search Audits'}

  const {v_id}:IGetVid = req.body

  return await db.getAuditPresets(v_id)
  
}
export const getAvailableInventory = async (req: NextApiRequest, res: NextApiResponse): Promise<ISvrGetAuditPreset> => {  
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canSearchInventory !== true &&
    userPermissions.canAudit !== true) return {info: 'You do not have permissions to search Audits'}

  const inventory = await db.getAvailableInventory()
  if (inventory.success){
    
  }
  
}