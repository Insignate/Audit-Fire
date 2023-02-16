import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ObjectShape, OptionalObjectSchema } from "yup/lib/object";
import { deleteCookies, getCookie } from "../utils/customCookies";
import { verifyToken } from "../database/postgres/login";
import { userTokenIdent } from "./user";

export const validatePost = (schema: OptionalObjectSchema<ObjectShape>, handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') return res.status(405).json({info: "only POST is accepted"})
    try {
      req.body = await schema.validate(req.body, {stripUnknown: true, strict: true})
    } catch (error) {
      console.error(error)
      return res.status(400).json({error: error.message})
    }
    await handler(req, res)
  }
}

export const validateLoginHeader = (schema: OptionalObjectSchema<ObjectShape>, handler: NextApiHandler) => {
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const headerCookies = req.headers.cookie
    if (headerCookies === undefined) return res.status(200).json({info: "Cookies not set"})
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).json({info: "only GET is accepted"})
    try{
      await schema.validate(getCookie(req), {})
      const tokenIdent = await verifyToken(req)
      if (tokenIdent.success) await handler(req, res);
      else {
        deleteCookies(res)
        res.status(200).json(tokenIdent)
      }    
    }catch(error){
      return res.status(400).json({error: error.message})
    }
  }
}

export const castInput = (schema: OptionalObjectSchema<ObjectShape>, req:NextApiRequest) => {
  try {
    const parseSchema = schema.cast(req.body, {stripUnknown: true})
    req.body = parseSchema
  } catch (error) {
    console.error(error)
  }
}

export const validateDataInput = async (schema: OptionalObjectSchema<ObjectShape>, req: NextApiRequest, res: NextApiResponse) => {
  await validateHeader(req, res);
  try{
    const checked = await schema.validate(req.body, {stripUnknown: true, strict: true})
    req.body = checked
  }
  catch(error){
    throw(error.message)
  }
  return true
}

export const validateNextQuery = async (schema: OptionalObjectSchema<ObjectShape>, req: NextApiRequest, res: NextApiResponse) => {
  await validateHeader(req, res);
  try{
    const checked = await schema.validate(req.query, {stripUnknown: true, strict: true})
    req.query = checked
  }
  catch(error){
    throw(error.message)
  }
  return true
}

export const nextValidateLoginHeader = async (schema: OptionalObjectSchema<ObjectShape>, req: NextApiRequest, res: NextApiResponse, handler: Function) => {
  const headerCookies = req.headers.cookie
    if (headerCookies === undefined) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if (!['GET'].includes(req.method)) return {notFound: true}
    try{
      await schema.validate(getCookie(req), {})
      const tokenIdent = await verifyToken(req)
      if (tokenIdent.success) return await handler(req, res);
      else {
        deleteCookies(res)
        return {redirect: {
          permanent: false,
          destination: '/'
        }};
      }    
    }catch(error){
      console.error(error.message)
      return {redirect: {
        permanent: false,
        destination: '/'
      }}
    }
}

export const validateHeader = async (req: NextApiRequest, res: NextApiResponse):Promise<boolean> => {
  const headerCookies = req.headers.cookie
  if (headerCookies === undefined){
    throw 'Please relog to the system'
  } 
  if (!['GET', 'POST', 'DELETE', 'PATCH'].includes(req.method)){
    throw "only GET, POST, PATCH and DELETE are accepted"
  }
  await userTokenIdent.validate(getCookie(req), {})
  const tokenIdent = await verifyToken(req)
  if (!tokenIdent.success){
    deleteCookies(res)
    throw tokenIdent
  }
  return true
}