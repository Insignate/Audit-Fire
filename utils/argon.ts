import { argon2i } from "argon2-ffi";
import { createSalt } from "./cryptograph";

export const hashPassword = async (password: string) => {
  return argon2i.hash(password, createSalt())
}

export const verifyHash = async (password: string, hashedPass: string) => {
  const verifyHash = argon2i.verify(hashedPass, password)
  return verifyHash
}