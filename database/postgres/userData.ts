import { getDB } from './connection'
import { createToken } from '../../utils/cryptograph';
import { IUserCredentials } from '../../tsTypes/login';
import { IBasicResponse, INumberResponse, IUserInfo, IUserPerm } from '../../tsTypes/psqlResponses';
import { psqlErrorException } from '../../errors/messages';
const { db } = getDB()

interface IEmployee{  
  userid: number
  fname: string
  lName: string
}

interface IEmployees extends Array<IEmployee>{}

interface IResponseEmployees{
  success?: IEmployees
  error?: string
}


export const getUserCredentials = (username: string):Promise<IUserCredentials> => {
  return new Promise( async (resolve, reject) => {
    return db.func('user_get_credentials', [username])
    .then(query => {
      if (query.length === 1){
        const formatedQuery:IUserCredentials = {success: query[0]}
        resolve(formatedQuery)
      } 
      else resolve({info: "Wrong username or password"})
    })
    .catch(error => {
      console.error(`userData.ts getUserCredentials: ${error}` )
      reject({error: "Talk to a middleware administrator"})
    })
  })
}

export const updateToken = async (oldToken: string) => {
  try {
    const newToken = createToken();
    const svrResp = await db.func('user_update_token', [oldToken, newToken]);
    if (svrResp[0].user_update_token === true) return {success: newToken}
    else return {error: "Failed to update the new token"}
  } catch (error) {
    console.error(`userData.ts: ${error}` )
    return {error: "Talk to a middleware administrator"}
  }
}

export const extendToken = (ident: string, token: string):Promise<IBasicResponse> => {
  return new Promise( async (resolve, reject) => {
    return db.func('user_extend_token', [token, ident])
    .then(query => {
      const extendedToken = query[0].user_extend_token;
      if (extendedToken) return resolve({success: "Token Extended"})
      else return resolve({info: "Token Expired"})
    })
    .catch(error => {
      console.error(`userData.ts: ${error}`)
      reject({error: "Talk to a middleware administrator"})
    })
  })
}

export const getPermissions = (ident:string, token:string):Promise<{success?: Array<{perm: number}>, info?: string}> => {
  return new Promise( async (resolve, reject) => {
    return db.func("user_self_permissions", [ident, token])
    .then(e => {
      if(e.length > 0) resolve({success: e})
      else resolve({info: "User has no permissions"})
    })
    .catch(e => {
      console.error(e)
      reject({error: "Talk to a database administrator"})
    })
  })
}

export const getAdminLevel = (ident:string, token: string): Promise<INumberResponse> => {
  return new Promise(async(resolve, reject) => {
    return db.func("user_self_adm_level", [ident, token])
    .then(e => {
      const {user_self_adm_level} = e[0]
      if (user_self_adm_level > 0) resolve({success: user_self_adm_level})
      else resolve({info: "You dont have Administrator rights"})
    })
    .catch(error => {
      console.error(error)
      reject({error: "Talk to a database administrator"})
    })
  })
}

export const getMyUserId = (ident: string, token: string): Promise<IBasicResponse> => {
  return new Promise(async(resolve, reject) => {
    return db.func("user_my_id", [ident, token])
    .then(e => {
      const {user_my_id} = e[0]
      if (user_my_id > 0){
        resolve({success: user_my_id})
      }
      else reject({info: "You don't have an id tied to your name"})
    })
    .catch(e => {
      console.error(`userData.ts: ${e}` )
      reject({error: "Talk to a database administrator"})
    })
  })
}

export const insertNewEmployee = async (
  firstName:string, 
  lastName: string,
  login: string,
  hash: string,
  newToken: string,
  newIdent: string): Promise<INumberResponse> => {
    try {
      const svrResp =  await db.func('insert_person', [firstName,
      lastName,
      login,
      hash,
      newToken,
      newIdent])
      
      const {insert_person} = svrResp[0];
      return {success: insert_person}
    } catch (error) {
      console.error(error)
      return psqlErrorException(error.code, "First and Last name or Login already exists!")
      
    }

}

export const setAdmLevel = async(uId: number, admLevel: number): Promise<IBasicResponse> => {
  try {
    const insertAdm = await db.func("user_edit_adm", [uId, admLevel]);
    return {success: insertAdm[0].user_edit_adm}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not set the adm level"}
  }
}

export const setUserPermission = async (userId: number, permissions: string): Promise<IBasicResponse> => {
  try {
    const svrResp = await db.func('user_edit_permissions', [userId, permissions]);
    const {user_edit_permissions} = svrResp[0];
    return user_edit_permissions;
  } catch (err) {
    console.error(err.message);
    return {error: "Could not set Permissions for user"}
  }
  
}

export const getAllEmployees = async (): Promise<IResponseEmployees>  => {
  try {
    const users: IEmployees = await db.func("user_get_all");
    if(users.length > 0) return {success: users}
    else return {error: "No registered Employees"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Employees"}
  }
}

export const getSpecificUser = async (userId: number): Promise<IUserInfo> => {
  try {
    const user = await db.func("user_get_specific_credentials", [userId]);
    if (user.length > 0) return {success: user[0]}
    return {info: "User doesn't exists!"};
  } catch (err) {
    console.error(err);
    return {error: "Could not retrieve user"};
  }
}

export const getSpecificUserPermissions = async(userId: number): Promise<IUserPerm> => {
  try {
    const user = await db.func("user_get_specific_permissions", [userId]);
    if(user.length > 0){
      const newPerm = user.map(({user_get_specific_permissions}) => {return {v_id: user_get_specific_permissions}})
      return {success: newPerm}
    }
    
    else return {info: "User has no permissions"}
  } catch (err) {
    console.error(err);
    return {error: "Could not get user permissions"}
  }
}

export const editSpecificUser = async(uId: number, firstName: string, lastName: string, login: string, checkbox: string, admLevel: number, newToken: string, hash: string) => {
  try {
    const svrResp = await db.func("user_edit", [uId, firstName, lastName, login, newToken, hash]);
    if (svrResp[0].user_edit <= 0){
      return {error: "User was not edited"};
    }
    const setPermission = await setUserPermission(uId, checkbox);//@ts-ignore
    if (setPermission !== true){
      return {error: "Could not set permissions"};
    }
    setAdmLevel(uId, admLevel);
    return {success: "User Edited"};
  } catch (err) {
    console.error(err.message)
    return {error: "Could not set user information"};
  }
}
export const getPassFromIdent = async (ident: string): Promise<any> => {
  try {
    const psqlResp = await db.func("user_get_pass_from_ident", [ident]);
    if (psqlResp[0].user_get_pass_from_ident !== null) return {success: 'User Found', value: psqlResp[0].user_get_pass_from_ident}
    return {info: 'Token might be expired, please relog into the system'}
  } catch (err) {
    console.error(err)
    console.error(err.message);
    return {error: "Could not change the password"}
  }
}

export const saveUserNewPass = async (ident: string, newHashPass: string): Promise<IBasicResponse> => {
  try {
    const psqlResp = await db.func("user_change_password", [ident, newHashPass]);
    if (psqlResp[0].user_change_password > 0) return {success: 'Password Changed'}
    return {info: 'Token might be expired, please relog into the system'}
  } catch (err) {
    console.error(err)
    console.error(err.message);
    return {error: "Could not change the password"}
  }
}