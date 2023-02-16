import { getDB } from "../connection";
const { db } = getDB()

// export const "name" = async (audits: Array<{fmv: number, auditId: number}>) => {
//   try {
//     const psqlResp = await db.func("", [])
//     if (psqlResp[0]. === 0) 
//       return {success: ''}
//     else return {info: ''}
//   } catch (err) {
//     console.error(err)
//     console.error(err.message)
//     return {error: ''}
//   }
// }