import { IBasicResponse } from "./psqlResponses";

export interface IUserCredentials extends Omit<IBasicResponse, "success"> {
  success?: {
    user_password: string
    user_token: string
    user_identification: string
    token_expired: boolean
    change_pass: boolean
  }
}


export interface IUserNewToken{
  success: string;
}