import {object, string, TypeOf} from 'yup'
export const userLoginInfo = object({
  username: string().required().min(2).max(20),
  password: string().required().min(6).max(50)
})

export type userType = TypeOf<typeof userLoginInfo>;
//interface userInterface extends TypeOf<typeof userInfo>{}

export const userTokenIdent = object({
  token: string().required().min(80).max(80),
  ident: string().required().min(20).max(20)
})
export interface IUserTokenIdent extends TypeOf<typeof userTokenIdent>{};