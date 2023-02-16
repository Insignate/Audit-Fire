import { NextApiRequest, NextApiResponse } from "next";
import { dbUserPermissions } from "../../permissions/dbRegisterPerm";
import RequesterInfo from "../../permissions/requester";
import { validateDataInput, validateHeader} from "../../schemas/dataValidation";
import { IChangeMyPassword, newEmployee, schemaGetEmployee, vChangeMyPassword, vEditEmployee } from "../../schemas/inputValidation";
import { hashPassword, verifyHash } from "../../utils/argon";
import { createIdent, createToken } from "../../utils/cryptograph";
import { getCookie } from "../../utils/customCookies";
import { editSpecificUser, getAllEmployees, getPassFromIdent, getSpecificUser, getSpecificUserPermissions, insertNewEmployee, saveUserNewPass, setAdmLevel, setUserPermission } from "./userData";
interface IRequestBody {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  repassword:string;
  admLevel: number;
  checkbox: [{
    v_id: number;
    checked: boolean;
  }]
}

interface IEditBody{
  userId: number
  firstName: string
  lastName: string
  login: string
  password: string
  repassword:string
  admLevel: number
  checkbox: [{
    v_id: number
    checked: boolean
  }]
}

export const registerNewEmployee = async (req: NextApiRequest, res: NextApiResponse):Promise<{success?: string | number, error?: string, newUserId?: number}> => {
  let newAdmLevel = 0
  const newCheckbox = []
  
  const svrResp = await validateDataInput(newEmployee, req, res)
  if (svrResp !== true) return {error: "Re-log to the system (press F5)"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  else if (userPermissions.canRegisterPerson !== true) return userPermissions.canRegisterPerson
  
  
  const {firstName, lastName, login, password, repassword, admLevel,
    checkbox}: IRequestBody = req.body
  
  if (password !== repassword) return {error: "Passwords do not match"}
  for(let i in checkbox){ 
    if(checkbox[i].v_id === dbUserPermissions.admin && checkbox[i].checked === true){
      newAdmLevel = admLevel
      if(userPermissions.isAdmin !== true)
        return {error: "You do not have permissions to register an admin"}
      if(userPermissions.myAdminLevel < admLevel)
        return {error: "Your admin level should be greater than the one you are trying to register"}
    }
    newCheckbox.push({v_id: checkbox[i].v_id, checked: checkbox[i].checked})
  }

  const newToken = createToken()
  const newIdent = createIdent()
  const newHash = await hashPassword(password)

  const insertEmp = await insertNewEmployee(firstName, lastName, login, newHash, newToken, newIdent)
  
  if(!insertEmp.success) return insertEmp
  const checkBoxResp = await setUserPermission(insertEmp.success, JSON.stringify(newCheckbox))
  if (!checkBoxResp.success){}
  if (admLevel > 0){
    const admLevelResp = await setAdmLevel(insertEmp.success, newAdmLevel)
    if (!admLevelResp.success) return {error: 'Could not set the AdmLevel'}
  }
  return {success: "User Registered", newUserId: insertEmp.success}

} 

export const getEmployees = async (req: NextApiRequest, res: NextApiResponse) => {
  const svrResp = await validateHeader(req, res)
  if (svrResp !== true) return {error: "Please re-log to the system (press F5)"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  else if (userPermissions.canRegisterPerson !== true && userPermissions.isAdmin !== true) return userPermissions.canRegisterPerson
  
  const employees = getAllEmployees()

  return employees
}

export const editEmployee = async (req: NextApiRequest, res: NextApiResponse) => {
  let newAdmLevel = 0
  const newCheckbox = []

  const svrResp = await validateDataInput(vEditEmployee, req, res)
  if (svrResp !== true) return {error: "Re-log to the system (press F5)"}
  
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  else if (userPermissions.canRegisterPerson !== true) return userPermissions.canRegisterPerson
  
  const {userId, firstName, lastName, login, password, repassword, 
    admLevel, checkbox}: IEditBody = req.body
  
  for(let i in checkbox){ 
    if(checkbox[i].v_id === dbUserPermissions.admin && checkbox[i].checked === true){
      newAdmLevel = admLevel
      if(userPermissions.isAdmin !== true)
        return {error: "You do not have permissions to edit to an admin"}
      if(userPermissions.myAdminLevel < admLevel)
        return {error: "Your admin level should be greater than the one you are trying to edit"}
    }
    newCheckbox.push({v_id: checkbox[i].v_id, checked: checkbox[i].checked})
  }

  const toBeEditedUser = await getSpecificUser(userId)

  if (!toBeEditedUser.success) return toBeEditedUser

  if (toBeEditedUser.success.userid === userPermissions.myUserId)
  return {info: "You cannot edit yourself"}


  if(toBeEditedUser.success.admin_level < userPermissions.myAdminLevel){
    if (password.length > 7){
      const newToken = createToken()
      const newPassword = await hashPassword(password)

      const svrResp = editSpecificUser(userId, firstName, lastName, login, JSON.stringify(checkbox),
      admLevel, newToken, newPassword)
      return svrResp
    }
    else {
      return editSpecificUser(userId, firstName, lastName, login, JSON.stringify(checkbox),
      admLevel, "", "")
    }
  }
  return {info: "Your admin level is lower than the one you are trying to edit"}

} 

export const getSpecificUserInfo = async (req: NextApiRequest, res: NextApiResponse) => {
  const inputValidation = await validateDataInput(schemaGetEmployee, req, res)
  if (inputValidation !== true) return {error: "Re-log to the system (press F5)"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  else if (userPermissions.canRegisterPerson !== true) return userPermissions.canRegisterPerson
  
  const specificUser = await getSpecificUser(req.body.userId)
  if(!specificUser.success) return specificUser
  
  const specUserPermissions = await getSpecificUserPermissions(req.body.userId)

  const send = {success: {userInfo: specificUser.success, userPerm: specUserPermissions}}
  return send
}

export const changeMyPassword = async (req: NextApiRequest, res: NextApiResponse) => {
  const inputValidation = await validateDataInput(vChangeMyPassword, req, res)
  if (inputValidation !== true) return {error: "Re-log to the system (press F5)"}

  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin

  const {ident} = getCookie(req)
  
  const userArgonPass = await getPassFromIdent(ident)
  if (!userArgonPass.success) return userArgonPass
  const {oldPass, newPass}:IChangeMyPassword = req.body
  if (await verifyHash(oldPass, userArgonPass.value) !== true) return {info: 'Incorrect Old Password Entered'}

  const hashNewPass = await hashPassword(newPass)
  // send new password to the database

  return await saveUserNewPass(ident, hashNewPass)
}