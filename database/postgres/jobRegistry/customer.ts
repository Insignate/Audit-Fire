import { NextApiRequest, NextApiResponse } from "next";
import RequesterInfo from "../../../permissions/requester";
import { castInput, validateDataInput, validateHeader } from "../../../schemas/dataValidation";
import { vCheckShortVid, ICheckShortVid, vContactInfo, vGetVid, IGetVid, vEditExistingCustomerJob, vCheckName, vCheckIntVid, vCheckVidVname, vAddJobNumberUsingJobName, vAddPlant, IAddPlant, vAddService, IAddService, ICheckName, ICheckIntVid, vAddNewCustomerJob, IAddNewCustomerJob, IMoveJobPlace, vMoveJobPlace } from "../../../schemas/inputValidation";
import { IValueResponse } from "../../../tsTypes/psqlResponses";
import { addDbCustomerJob, addDbJobNumber, addDbService, deleteDbJobNumber, deleteDbPlacedJob, deleteDbPlant, deleteDbService, editDbCustomer, editDbJobName, getDbCustomers, getDbDetailedCustomer, getDbEmployees, getDbJobNumberFromJobName, getDbJobPlacementPerm, getDbJobsFromCustomer, getDbJobsFromPlacement, getDbPlants, getDbSalesman, getDbServices, IGetVidVname, IRespContactInfo, moveDbJobPlacement, registerDbCustomer, registerNewJobName, removeDbSalesman, setDbPlant, setDbSalesman } from "./dbCom";


export const getEmployees = async (req: NextApiRequest, res: NextApiResponse): Promise<IGetVidVname> => {
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true &&
    userPermissions.canFmvPriceChange !== true) return {error: 'You do not have permissions to get employees'}

  const employees: IGetVidVname = await getDbEmployees()

  return employees
}

export const getRegSalesman = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const salesman = getDbSalesman()
  return salesman
}

export const setNewSalesman = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckShortVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  const {vid}: ICheckShortVid = req.body
  const salesman = setDbSalesman(vid)

  return salesman
}

export const removeRegSalesman = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckShortVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  const {vid}: ICheckShortVid = req.body

  const salesman = removeDbSalesman(vid)

  return salesman

}

export const registerNewCustomer = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vContactInfo, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const svrResp = registerDbCustomer(req.body)

  return svrResp
}

export const getCustomers = async (req: NextApiRequest, res: NextApiResponse): Promise<IGetVidVname> => {
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true &&
    userPermissions.canFmvPriceChange !== true) 
    return {error: 'You dont have permissions to get customers'}

  const svrResp = getDbCustomers()

  return svrResp
}

export const getDetailedCustomer = async (req: NextApiRequest, res: NextApiResponse):Promise<IRespContactInfo> => {
  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const {v_id}: IGetVid = req.body

  const svrResp = getDbDetailedCustomer(v_id)

  return svrResp
}

export const editDetaliedCustomer = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vEditExistingCustomerJob, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const svrResp = editDbCustomer(req.body)

  return svrResp

}

export const addNewJobName = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckName, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const {linkId, name} = req.body

  return registerNewJobName(linkId, name)
}

export const getJobsFromCustomer = async (req: NextApiRequest, res: NextApiResponse):Promise<IValueResponse> => {

  const val = await validateDataInput(vCheckIntVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true &&
    userPermissions.canFmvPriceChange !== true) 
    return {error: 'You cannot get Job Names'}

  const {vid} = req.body

  return getDbJobsFromCustomer(vid)
}

export const editJobName = async (req: NextApiRequest, res: NextApiResponse) => {
  const val = await validateDataInput(vCheckVidVname, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const {vid, name} = req.body
  
  return editDbJobName(vid, name)

}

export const addJobNumberFromJobName = async(req: NextApiRequest, res: NextApiResponse) => {
  castInput(vAddJobNumberUsingJobName, req)
  const valuInput = await validateDataInput(vAddJobNumberUsingJobName, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const {name, date, linkId} = req.body

  return addDbJobNumber(name, date, linkId)
}

export const getJobNumberFromJobName = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vCheckIntVid, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true &&
    userPermissions.canFmvPriceChange !== true) return {error: 'You cannot get job numbers'}

  const {vid} = req.body

  return getDbJobNumberFromJobName(vid)
}

export const deleteJobNumber = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vCheckIntVid, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  const {vid} = req.body
  return deleteDbJobNumber(vid)

}

export const getPlants = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateHeader(req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true && 
    userPermissions.isAdmin !== true &&
    userPermissions.canFmvPriceChange !== true &&
    userPermissions.canAudit !== true) return {error: "You dont have permissions to get job plants"}

  return getDbPlants()
}

export const setPlants = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vAddPlant, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  if (userPermissions.isAdmin !== true) return userPermissions.isAdmin
  const {name}:IAddPlant = req.body

  return setDbPlant(name)
}

export const deletePlant = async(req: NextApiRequest, res: NextApiResponse) => {

  const valuInput = await validateDataInput(vCheckShortVid, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  if (userPermissions.isAdmin !== true) return userPermissions.isAdmin

  const {vid}:ICheckShortVid = req.body

  return deleteDbPlant(vid)
}

export const addService = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vAddService, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  if (userPermissions.isAdmin !== true) return userPermissions.isAdmin

  const {name}: IAddService = req.body

  return addDbService(name)

}

export const getServices = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateHeader(req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  return getDbServices()
}

export const removeService = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vCheckIntVid, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  if (userPermissions.isAdmin !== true) return userPermissions.isAdmin
  const {vid}:ICheckIntVid = req.body

  return deleteDbService(vid)  
}

export const addCustomerJob = async(req: NextApiRequest, res: NextApiResponse) => {  
  const valuInput = await validateDataInput(vAddNewCustomerJob, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  const {salesman, customer, jobName, jobNumber, plant, expectation, placement, checkbox}: IAddNewCustomerJob = req.body
  
  return await addDbCustomerJob(salesman, customer, jobName, jobNumber, plant, expectation, placement, checkbox)
}

export const getJobsFromPlacement = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vCheckIntVid, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) 
    return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true &&
    userPermissions.canAudit !== true &&
    userPermissions.canDriveR2 !== true)
    return {error: "You are not able to get jobs from placement"}

  const {vid}:ICheckIntVid = req.body

  return getDbJobsFromPlacement(vid)
}

export const deletePlacedJob = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vCheckIntVid, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs

  const {vid} = req.body

  return deleteDbPlacedJob(vid)
}

export const getJobPlacementPerm = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateHeader(req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true &&
    userPermissions.canAudit !== true &&
    userPermissions.canDriveR2 !== true)
  return {error: "You are not able to view this window"}

  return getDbJobPlacementPerm()
}

export const moveJobPlacement = async(req: NextApiRequest, res: NextApiResponse) => {
  const valuInput = await validateDataInput(vMoveJobPlace, req, res)
  if (valuInput !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissionsReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canCreateJobs !== true) return userPermissions.canCreateJobs
  const {selectedJob, movePlacement}:IMoveJobPlace = req.body

  return moveDbJobPlacement(selectedJob, movePlacement)

}
  