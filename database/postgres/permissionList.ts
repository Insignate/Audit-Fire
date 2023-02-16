import {getDB} from './connection'
const { db } = getDB()

interface IPermission {
  v_id: number
  v_permission: string
  v_group: number
  checked: boolean
}

export interface IPermissionsArray extends Array<IPermission>{}

export interface IPermissions {
  success?: IPermissionsArray
  info?: string
  error?: string
}

export const getAllPermissions = async (): Promise<IPermissions> => {
  
  return new Promise(async (resolve, reject)  => {
    return await db.func("get_all_permissions")
    .then((e: IPermissionsArray ) => {
      if (e.length > 0) return resolve({success: e})
      else return resolve({info: 'No permissions found'})
    })
    .catch(error => {
      console.error(error)
      return reject({error: 'talk to the system administrator'})
    })
  })
  
}