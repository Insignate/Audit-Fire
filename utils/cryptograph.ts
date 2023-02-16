import {randomBytes} from 'crypto'

export const createSalt = () => {
  return randomBytes(32);
}
export const createToken = () => {
  return randomBytes(60).toString('base64');
}
export const createIdent = () => {
  return randomBytes(15).toString('base64');
}
export const createFieldId = () => {
  return randomBytes(6).toString('base64')
}