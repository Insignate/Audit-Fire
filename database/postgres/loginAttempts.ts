import {IBasicResponse} from '../../tsTypes/psqlResponses'
import {getDB} from './connection'
const { db } = getDB()

//verifying if the user can log in using the ip address and the user name
export const canAttemptLogin = async (ip: string, username: string): Promise<IBasicResponse> => {
  return new Promise( async (resolve, reject) => {
    return db.func('login_get_attempts', [ip, username])
    .then(query => {
      const {ip_disabled, user_disabled} = query[0]
      if(ip_disabled !== false) return resolve({error: "Connection Disabled"})
      else if (user_disabled !== false) return resolve({error: "User Disabled"})
      else return resolve({success: "Can connect"})
    })
    .catch(error => {
      console.error(error.message);
      reject({error: "Talk to a database administrator"})
    })
  })
}

//verifying if user is not trying to invade with token
export const checkTokenIntrusion = async (ip: string): Promise<IBasicResponse> => {
  return new Promise( async (resolve, reject) => {
    return db.func('user_token_intrusion', [ip])
    .then(query => {
      const {user_token_intrusion} = query[0]
      if (user_token_intrusion === false) return resolve({success: "Not Intruded"})
      else return reject({error: "User Disabled"})
    })
    .catch(error => {
      console.error("loginAttempts.ts:", error.message);
      return {error: "Talk to a database administrator"}
    })
  })
}

export const checkLoginFromToken = async (token: string, ident: string): Promise<IBasicResponse> => {
  return new Promise( async (resolve, reject) => {
    return db.func('user_login_token', [token, ident])
    .then(query => {
      const {user_login_token} = query[0];
      if (user_login_token !== true) return resolve({error: "Cannot Login"}) 
      else resolve({success: "Can Login"})
      return user_login_token
    })
    .catch(error => {
      console.error({error: "loginAttempts.ts: " + error.message})
      return reject({error: "Talk with a database administrator"})
    })
  })
}


//sends the ip to the database (only use this when the attempt has failed)
export const setBadLogin = (ip: string, username: string): void => {
  try {
      db.func('login_set_bad_attempt', [ip, username]);
  } catch (err) {
      console.error(err.message);
  }
}

//sets a bad ip attempt from token (only use this when the attempt has failed)
export const setBadTokenIpLogin = (ip: string): void =>{
  try {
    db.func('login_set_token_failed', [ip]);
  } catch (err) {
    console.error(err.message);
  }
}

