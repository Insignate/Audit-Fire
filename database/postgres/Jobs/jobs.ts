import { NextApiRequest, NextApiResponse } from "next"
import RequesterInfo from "../../../permissions/requester"
import { validateDataInput, validateHeader } from "../../../schemas/dataValidation"
import { IEditJobPlacement, IGetVid, IInsertJobPlacement, IRemoveJobPlace, vEditJobPlacement, vGetVid, vInsertJobPlacement, vRemoveJobPlace } from "../../../schemas/inputValidation"
import { getDbJobPlacementPerm } from "../jobRegistry/dbCom"
import { editJobPlacementOptions, getJobPlacementPermission, getJobPlacePermission, IJobPlacementPermission, removeJobPlacement, setJobPlacement } from "./dbCom"

export const getJobPermissions = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canJobPlacement !== true) return userPermissions.canJobPlacement

  const jobs = await getJobPlacePermission()
  
  if(jobs.success) return jobs
  else return {info: "Could not get jobs"}
}

export const setNewPlacementJob = async (req: NextApiRequest, res: NextApiResponse) => {

  const val = await validateDataInput(vInsertJobPlacement, req, res)
  if(val !== true) return {error: "Data Verification Failed"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canJobPlacement !== true) return userPermissions.canJobPlacement
  const {placementName, checkbox}: IInsertJobPlacement = req.body

  const svrResp = await setJobPlacement(placementName, checkbox)

  return svrResp
}

export interface IJobPlacements{
  success?: Array<{
    v_id: number
    v_name: string
  }>
  error?: string
  info?: string
}

export const getAllPlacements = async (req: NextApiRequest, res: NextApiResponse): Promise<IJobPlacements> => {

  const val = await validateHeader(req, res)
  if(val !== true) return {error: "Data Verification Failed"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canJobPlacement !== true &&
    userPermissions.canAudit !== true && 
    userPermissions.canCreateJobs !== true) 
    return {error: "You are not able to retrieve job placements"}

  const svrResp = getDbJobPlacementPerm()
  return svrResp
}

export const getSpecificPlacementPermission = async (req: NextApiRequest, res: NextApiResponse):Promise<IJobPlacementPermission> => {
  const val = await validateDataInput(vGetVid, req, res)
  if(val !== true) return {error: "Data Verification Failed"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canJobPlacement !== true) return userPermissions.canJobPlacement
  
  const {v_id}: IGetVid = req.body

  const svrResp = getJobPlacementPermission(v_id)

  return svrResp

}

export const editSpecificPlacement = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vEditJobPlacement, req, res)
  if(val !== true) return {error: "Data Verification Failed"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canJobPlacement !== true) return userPermissions.canJobPlacement

  const {vid, checkbox}: IEditJobPlacement = req.body

  const svrResp = await editJobPlacementOptions(vid, checkbox)
  return svrResp
}

export const removeJobPlace = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vRemoveJobPlace, req, res)
  if(val !== true) return {error: "Data Verification Failed"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canJobPlacement !== true) return userPermissions.canJobPlacement

  const {vid}: IRemoveJobPlace = req.body

  const svrResp = await removeJobPlacement(vid)

  return svrResp
}

