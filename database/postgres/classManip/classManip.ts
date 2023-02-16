import { NextApiRequest, NextApiResponse } from "next"
import { ObjectShape, OptionalObjectSchema } from "yup/lib/object"
import RequesterInfo from "../../../permissions/requester"
import { validateDataInput, validateHeader } from "../../../schemas/dataValidation"
import { IAddClassField, IAddIssue, IAddIssueToClass, IChangePreDefinedOptions, ICheckIntVid, ICheckShortVid, IDeleteClassField, IDeleteClassOption,  IPreDefinedOption, vAddClass, vAddClassField, vAddIssue, vAddIssueToClass, vChangePreDefinedOptions, vCheckIntVid, vCheckShortVid, vDeleteClassField, vDeleteClassOption, vPreDefinedOption } from "../../../schemas/inputValidation"
import { IValueResponse } from "../../../tsTypes/psqlResponses"
import * as db from "./dbCom"


export const addClass = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {
  const resp = await validityInput(vAddClass ,req, res)
  if(resp !== true) return resp
  const {name} = req.body
  return db.addDbClass(name)
}
export const getClasses = async (req: NextApiRequest, res: NextApiResponse) => {
  const resp = await valHeaderOrderAuditHistory(req, res)
  if(resp !== true) return resp
  return db.getDbClasses()
}
export const deleteClass = async (req: NextApiRequest, res: NextApiResponse) => {
  const resp = await validityInput(vCheckIntVid,req, res)
  if(resp !== true) return resp
  const {vid} = req.body
  return db.deleteDbClass(vid)
}
export const addClassField = async (req: NextApiRequest, res: NextApiResponse) => {
  const resp = await validityInput(vAddClassField, req, res)
  if (resp !== true) return resp
  const {name, boxSelected, classSelected, order, entries, required}:IAddClassField = req.body
  return db.addDbClassField(name, boxSelected, classSelected, order, entries, required)
}
export const deleteFieldClass = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vDeleteClassField, req, res)
  if (val !== true) return val
  const {vid, classId}: IDeleteClassField = req.body
  return db.deleteDbFieldClass(vid, classId)
}
export const addPreDefinedOption = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vPreDefinedOption, req, res)
  if (val !== true) return val
  const {vid, name, classId}: IPreDefinedOption = req.body
  return db.addDbPreDefinedOption(vid, name, classId)
}
export const changeFieldProperties = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vChangePreDefinedOptions, req, res)
  if (val !== true) return val
  const {vid, class_id, order, entries, required}: IChangePreDefinedOptions = req.body
  return db.changeDbFieldProperties(vid, class_id, order, entries, required)
}
export const deleteOptionField = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vCheckIntVid, req, res)
  if (val !== true) return val
  const {vid}:ICheckIntVid = req.body
  return db.deleteDbOptionField(vid)
}
export const addIssue = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vAddIssue , req, res)
  if (val !== true) return val
  const {name}: IAddIssue = req.body
  return db.addDbIssue(name)
}
export const getIssues = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await defaultHeaderValidity(req, res)
  if (val !== true) return val
  return db.getDbIssues()
}
export const deleteIssue = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vCheckIntVid , req, res)
  if (val !== true) return val
  const {vid}: ICheckIntVid = req.body
  return db.deleteDbIssue(vid)
}
export const addIssueToClass = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vAddIssueToClass , req, res)
  if (val !== true) return val
  const {classId, issueId}: IAddIssueToClass = req.body
  return db.addDbIssueToClass(classId, issueId)
}
export const getClassIssues = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckIntVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true && 
    userPermissions.canAudit !== true &&
    userPermissions.canPlaceOrders !== true &&
    userPermissions.canSearchInventory !== true) 
    return {error: "You do not have permissions to manipulate classes or audit"}
  const {vid}: ICheckIntVid = req.body
  return db.getDbClassIssues(vid)
}
export const deleteClassOption = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validityInput(vDeleteClassOption , req, res)
  if (val !== true) return val
  const {classId, optionId}: IDeleteClassOption = req.body
  return db.deleteDbClassOption(classId, optionId)
}
export const getFieldsFromClass = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckIntVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true && 
    userPermissions.canAudit !== true &&
    userPermissions.canPlaceOrders !== true &&
    userPermissions.canSearchInventory !== true) 
    return {error: "You do not have permissions to manipulate classes or audit"}
  const {vid}:ICheckIntVid = req.body
  return db.getDbFieldsFromClass(vid)
}

const defaultHeaderValidity = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true) return userPermissions.canManipulateClass
  
  return true
}
const validityInput = async  (schema: OptionalObjectSchema<ObjectShape>, req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(schema, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true) return userPermissions.canManipulateClass
  return true
}

const valHeaderAudit = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true && userPermissions.canAudit !== true) 
    return {error: "You do not have permissions to manipulate classes or audit"}
  
  return true
}
const valHeaderAuditHistory = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true && 
    userPermissions.canAudit !== true &&
    userPermissions.canSearchAuditHistory !== true) 
    return {error: "You do not have permissions to get classes"}
  
  return true
}

const valHeaderOrderAuditHistory = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true && 
    userPermissions.canAudit !== true &&
    userPermissions.canSearchAuditHistory !== true &&
    userPermissions.canPlaceOrders !== true && 
    userPermissions.canSearchInventory !== true) 
    return {error: "You do not have permissions to get classes"}
  
  return true
}


const valInputHeaderAudit = async (schema: OptionalObjectSchema<ObjectShape>, req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(schema, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canManipulateClass !== true && userPermissions.canAudit !== true) 
    return {error: "You do not have permissions to manipulate classes or audit"}
  
  return true
}

