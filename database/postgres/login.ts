import { NextApiRequest } from "next";
import { canAttemptLogin, checkLoginFromToken, checkTokenIntrusion, setBadLogin } from "./loginAttempts"
import { extendToken, getUserCredentials, updateToken } from "./userData";
import { verifyHash } from "../../utils/argon";
import { IUserCredentials } from "../../tsTypes/login";
import { IBasicResponse } from "../../tsTypes/psqlResponses";
import { ITokenIdent } from "../../tsTypes/psqlResponses";
import { getCookie } from "../../utils/customCookies";
import { loginException } from "../../errors/messages";
import RequesterInfo from "../../permissions/requester";


//verifies and gets the token for a certain user
export const getIdentToken = async (req: NextApiRequest): Promise<ITokenIdent> => {
  const { username, password } = req.body;
  const ip = req.socket.remoteAddress
  
  const pass: ITokenIdent = await canAttemptLogin(ip, username)
  if(!pass.success) return pass
  const tokenPass = await checkTokenIntrusion(ip)
  
  if(!tokenPass.success)return tokenPass
  const userCredentials: IUserCredentials = await getUserCredentials(username)
  if(!userCredentials.success){
    setBadLogin(ip, username)
    return {info: "Wrong username or password"}
  } 
  const { user_password, user_token, user_identification, token_expired, change_pass } = userCredentials.success;
  
  const userPermissions = new RequesterInfo()
  await userPermissions.setPermissions(user_identification, user_token)
  if (userPermissions.canLogin !== true) return {error: "You are not able to login"}

  try {
    if(await verifyHash(password, user_password) !== true){
      setBadLogin(ip, username)
      return {info: "Wrong username or password"}
    }
  } catch (error) {
    console.error(error)
    throw loginException("error hashing the password")
  }
  
  
  if (token_expired === true){

    const newToken = await updateToken(user_token)
    if (newToken.success) {
      const credentials: ITokenIdent = {success: "Accepted", token: newToken.success, ident: user_identification, change_pass}
      return credentials
    }
    else return {error: "Token creation failed"}
  }
  else return {success: "Accepted", token: user_token, ident: user_identification, change_pass};
}

export const verifyToken = async (req: NextApiRequest): Promise<IBasicResponse> => {
  console.log(req.socket.remoteAddress)
  const {ident, token} = getCookie(req);
  const ip = req.socket.remoteAddress
  const tokenPass = await checkTokenIntrusion(ip)
  if(!tokenPass.success)return tokenPass
  const loginToken = await checkLoginFromToken(token, ident);
  if (!loginToken.success) return loginToken
  const isExtended = await extendToken(ident, token)
  return isExtended
}