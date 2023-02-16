import { IGetAllAnnounces, IGetMyReminders, IValueResponse } from "../../../tsTypes/psqlResponses";
import { getDB } from "../connection";
const { db } = getDB()

export const setAnnounce = async (announce: string, show: boolean, loginId: number):
Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("other_set_annonce", [announce, show, loginId])
    if (psqlResp[0]?.newid > 0) 
      return {success: 'Announcement Saved', value: psqlResp[0].newid}
    else return {info: 'No announce has been set'}
  } catch (err) {
    console.error(err.message)
    console.error(err)
    return {error: 'Could not set annouces'}
  }
}
export const deleteAnnounce = async (vid: number) => {
  try {
    const psqlResp = await db.func("other_delete_announce", [vid])
    if (psqlResp[0]?.other_delete_announce > 0) 
      return {success: 'Announce Deleted'}
    else return {info: 'Announce not found'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not delete announce'}
  }
}
export const getAllAnnounces = async ():Promise<IGetAllAnnounces> => {
  try {
    const psqlResp = await db.func("others_get_all_announces")
    if (psqlResp.length > 0) 
      return {success: 'Announces Found', value: psqlResp}
    else return {info: 'No Announcements found'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not get Announcements'}
  }
}
export const changeAnnounceStatus = async (id: number, status: boolean) => {
  try {
    const psqlResp = await db.func("others_announce_change_status", [id, status])
    if (psqlResp[0]?.others_announce_change_status > 0) 
      return {success: 'Status Changed'}
    else return {info: 'Announce not found or deleted'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not change Announce'}
  }
}
export const getAnnounces = async () => {
  try {
    const psqlResp = await db.func("others_get_announce")
    if (psqlResp.length > 0) 
      return {success: 'Annonces Found', value: psqlResp}
    else return {info: 'No Announces Registered'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not get Announces'}
  }
}
export const saveSelfReminder = async (userId: number, reminder: string) => {
  try {
    const psqlResp = await db.func('others_set_self_reminder', [userId, reminder])
    if (psqlResp[0].others_set_self_reminder > 0 ) 
      return {success: 'Reminder Set', value: psqlResp[0].others_set_self_reminder}
    else return {info: 'Reminder not set'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not set reminder'}
  }
}
export const deleteSelfReminder = async (userId: number, id: number) => {
  try {
    const psqlResp = await db.func("others_delete_my_reminder", [userId, id])
    if (psqlResp[0].others_delete_my_reminder > 0) 
      return {success: 'Reminder Deleted'}
    else return {info: 'Reminder not found'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not delete Reminder'}
  }
}
export const getMyReminders = async (userId: number): Promise<IGetMyReminders> => {
  try {
    const psqlResp = await db.func('others_get_my_reminders', [userId])
    if (psqlResp.length > 0) 
      return {success: 'Reminders Found', value: psqlResp}
    else return {info: 'No Reminders Registered'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not get Reminders'}
  }
}




// export const "name" = async () => {
//   try {
//     const psqlResp = await db.func('', [])
//     if (psqlResp.length > 0) 
//       return {success: ''}
//     else return {info: ''}
//   } catch (err) {
//     console.error(err)
//     console.error(err.message)
//     return {error: ''}
//   }
// }