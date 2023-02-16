import { EDriveInsertResult } from "../../../utils/enums";
import { getDB } from "../connection";
const { db } = getDB()

export const insertNewDrive = async (
  JobId: number,
  Model: string, 
  Size: number, 
  Serial: string, 
  PowerOnHours: number, 
  Health: number,
  LifetimeWrites: number, 
  SmartDATA: Array<Array<string>>,
  status: number,
  wipeStart: Date,
  wipeEnd: Date,
  pushDriveToDb: boolean) => 
{
  try {
    if (wipeStart.getTime() === wipeEnd.getTime())
      wipeStart = wipeEnd = null
    const psqlResp = await db.func("drive_r2.insert_new_drive", [
      JobId, 
      Model,
      Size,
      Serial,
      PowerOnHours,
      Health,
      LifetimeWrites,
      status,
      wipeStart,
      wipeEnd,
      pushDriveToDb 
    ])
    
    if (psqlResp[0].insert_new_drive.result === EDriveInsertResult.driveInserted) {
      const {value} = psqlResp[0].insert_new_drive;
      await insertSmartTable(value, SmartDATA)
      return {success: 'Drive Inserted'}
    }
    else if (psqlResp[0].insert_new_drive.result === EDriveInsertResult.driveNotWipedInDb)
      return {info: 'Drive Already Exists in Database', datetime: psqlResp[0].insert_new_drive.datetime}
    else return {error: 'Drive was not inserted'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not insert the drive'}
  }
}

const  insertSmartTable = async (driveId: number, SmartDATA: Array<Array<string>>) => {
  try {
    for (const values of SmartDATA)
      await db.func("drive_r2.insert_smart_table", [driveId, values])
    return {success: 'Drive Inserted'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not insert the drive'}
  }
}

export const insertNotWorkingDrive = async (
  jobId: number, 
  size: number,
  serialNumber: string,
  force: boolean  
) => {
  try {
    const svrResp = await db.func("drive_r2.insert_not_working_drive", [jobId, size, serialNumber, force])
    return svrResp[0].insert_not_working_drive;
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not insert the drive'}
  }
}

export const getJobDriveReport = async (id: number, detail: number) => {
  try {
    const svrResp = await db.func("drive_r2.drive_get_job_report", [id, detail])
    if (svrResp[0].drive_get_job_report.working_drives?.length > 0 || svrResp[0].drive_get_job_report?.not_working_drives){
      return {success: svrResp[0].drive_get_job_report}
    }
      
    else return {info: 'No drives registerd for job specified'}
  } catch (err) {
    console.error(err)
    console.error(err.message)
    return {error: 'Could not get job drive report'}
  }
}

