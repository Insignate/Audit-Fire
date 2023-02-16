import { getDB } from "../connection";
import { psqlErrorException } from '../../../errors/messages';
import { IBasicResponse, IJobPermissions } from "../../../tsTypes/psqlResponses";
import { IInsertJobPlacement } from "../../../schemas/inputValidation";

const { db } = getDB()


export const getJobPlacePermission = async ():Promise<IJobPermissions> => {
  try {
    const psqlResp = await db.func("job_get_placement_names");
    if (psqlResp.length > 0) return {success: psqlResp}
    else return {info: "No placement registered"}
  } catch (err) {
    console.error(err.message);
    return psqlErrorException(err.code, "Talk to a database administrator")
  }
}

export interface IJobPlacement{
  success?: string
  value?: number
  info?: string
  error?: string
}

export const setJobPlacement = async (place: string, checkbox: IInsertJobPlacement["checkbox"]): Promise<IJobPlacement> => {
  try {
    const psqlResp = await db.func("job_add_placement", [place]);
    const placementValue = psqlResp[0].job_add_placement;
    if (placementValue >= 0){
      const editPlacement = await editJobPlacementOptions(placementValue, checkbox)
      if (editPlacement.success){
        return {success: "Job Placement Added", value: placementValue}
      }
      else return editPlacement;
    }
    else return {info: "Could not create job placement"}
  } catch (err) {
    console.error(err);
    return psqlErrorException(err.code, "Job Placement Already Exists")
  }
} 

export const editJobPlacementOptions = async (placementId: number, placeOptions:IInsertJobPlacement["checkbox"]): Promise<IBasicResponse> => {
  try {
    const psqlResp = await db.func("job_edit_placement_options", [placementId, JSON.stringify(placeOptions)]);
    if (psqlResp[0].job_edit_placement_options === true) 
      return {success: "Job Placement Edited"}
    else return {info: "Could not edit job placement"}
  } catch (err) {
    console.error(err.message);
    return psqlErrorException(err.code, "Could not edit job placement")
  }
}

export interface IJobPlacementPermission{
  success?: [{v_id: number}]
  info?: string
  error?: string
}

export const getJobPlacementPermission = async (vid: number):Promise<IJobPlacementPermission> => {
  try {
    const psqlResp = await db.func('job_get_place_perm', [vid]);
    if (psqlResp.length > 0) {
      return{success: psqlResp}
    }
    return{info: "No permissions for job selected"}
  } catch (error) {
    console.error(error.message)
    return {error: "Could not get permissions for job placement"}
  }
}

export const removeJobPlacement = async (jobId: number):Promise<IBasicResponse> => {
  try {
    const psqlResp = await db.func('job_delete_reg_placement', [jobId]);
    const value = psqlResp[0].job_delete_reg_placement;
    if (value > 0) return {success: "Record Deleted"}
    else return {info: "No record deleted"}
  } catch (err) {
    console.error(err.message);
    return {error: "Job Placement is being used by a Job"}
  }
}

