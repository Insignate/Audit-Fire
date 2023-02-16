import cookie from 'cookie'
import { NextApiRequest, NextApiResponse } from 'next'

export const getCookie = (req: NextApiRequest): {ident: string, token:string} => {
  const {ident, token} = cookie.parse(req.headers.cookie)
  return {ident, token}
}

export const deleteCookies = (res: NextApiResponse) => {
  res.setHeader("Set-Cookie", [cookie.serialize("ident", "1",{
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: 0,
    sameSite: 'strict',
    path: '/'
  }), cookie.serialize("token", "1",{
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: 0,
    sameSite: 'strict',
    path: '/'
  })])
}

export const setHeaderCookies = (res: NextApiResponse, ident: string, token: string) => {
  res.setHeader("Set-Cookie", [cookie.serialize("ident", ident,{
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: 84600,
    sameSite: 'strict',
    path: '/'
  }), cookie.serialize("token", token,{
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: 84600,
    sameSite: 'strict',
    path: '/'
  })])
}

export const setCustomCookie = (name: string, data: any) => {
  document.cookie = cookie.serialize(name, data, {
    secure: process.env.NODE_ENV !== "development",
    maxAge: 9999999999,
    sameSite: 'strict',
    path: '/'
  })
}
export const getCustomCookie = () => {
  return (cookie.parse(document.cookie))

}