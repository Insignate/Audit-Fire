import { EOrderAuditPermission } from "../../../permissions/dbRegisterPerm";
import { IBulkAuditChange, IEditAudit, ISaveAuditPreset, ISearchAudits } from "../../../schemas/inputValidation";
import { IAvailableInventory, IBulkMove, IBulkMoveResp, IGetAuditValues, ISendAuditValues, ISingleAuditSearch, ISvrGetAuditPreset } from "../../../tsTypes/psqlResponses";
import { convertFields } from "../../../utils/auditManage";
import { mergeSequentialFieldIds } from "../../../utils/fields";
import { getDbFieldsFromClass } from "../classManip/dbCom";
import { getDB } from "../connection";
const { db } = getDB()

enum EInsertAudit {
  success = 0,
  formModificationError = 1,
  auditAlreadyExists = 2,
}
enum EEditAudit {
  success = 0,
  formModificationError = 1,
  auditDoesntExists = 2,
}


export const addNewAudit = async (
jobId: number, 
vclass: number, 
audit: number, 
quantity: number, 
fields:Array<{v_id: number, v_field: number, v_values: Array<any>}>, //array of any being numbers, strings and booleans
options: Array<number>, 
notes: string, 
userId: number) => {

  const jsonFields = JSON.stringify(fields)
  const pgResp = await getSingleValue('audit_add_new', 
    [userId, audit, jobId, vclass, quantity, notes, jsonFields, options],
    'Audit Inserted', 'Audit Number already exists');
  if (pgResp === EInsertAudit.success) return {success: "Audit Created!"}
  else if (pgResp === EInsertAudit.auditAlreadyExists) return {info: 'Audit Already Exists!'}
  else if (pgResp === EInsertAudit.formModificationError) return {alert: 'Your form was modified, please refresh the page!'}
  else return {error: 'Please contact the database administrator'}
  
  
}

export const editAudit = async (
  vclass: number, 
  audit: number, 
  quantity: number, 
  fields: IEditAudit['fields'], 
  options: IEditAudit['options'], 
  notes: string, 
  userId: number) => {
  const pgResp = parseInt(await getSingleValue('audit_edit', [userId, audit, vclass, quantity, notes, JSON.stringify(fields), options], 'Audit Edited', 'Could not edit Audit'))
  
  if (pgResp === EEditAudit.success) return {success: "Audit Edited!"}
  else if (pgResp === EEditAudit.auditDoesntExists) return {info: 'Audit Doesnt Exists!'}
  else if (pgResp === EEditAudit.formModificationError) return {alert: 'Your form was modified, please refresh the page!'}
  else return {error: 'Please contact the database administrator'}
}

export const getAuditPermission = async (audit_id: number) => {
  try {
    const item = await db.func('audit_get_permission', [audit_id]);
    const value = item[0]['audit_get_permission'];
    return value
  } catch (error) {
    console.error(error);
    return {error: "Could not get audit permission"}
  }
}

export const getLastAudit = async (vid: number): Promise<ISendAuditValues> => {
  const svrResp: IGetAuditValues = await getJsonValue('audit_get_last_entry', [vid], 'Could not get audit');
  const arrValues: Array<{v_id: number, value_arr: Array<string>}> = []
  let thisValue = 0
  if (svrResp.success){
    svrResp.success.fields.forEach(item => {
      if (item.v_id === thisValue){
        arrValues.at(-1).value_arr.push(item.value_arr)
      }
      else {
        thisValue = item.v_id
        arrValues.push({v_id: item.v_id, value_arr: [item.value_arr]})
      }
    })
    const sendToClient = {...svrResp.success, fields: arrValues}
    return {success: sendToClient}
  }
  else return {info: svrResp.info}
}

export const getJobIdFromAudit = async (vid: number) => {
  const svrResp = await getSingleValue('audit_get_jobid', [vid], 'Job Id retrieved', 'Could not retrieve Job Id');
  return svrResp
}

export const getDbAuditHistory = async (vid: number) => {
  const svrResp = await getTableFromValue('audit_get_datetime_history', [vid], 'Audit History retrieved', 'Could not get audit history');
    return svrResp
}

export const getAuditByDateTime = async (asset: number, searchDate: Date) => {
  const svrResp = await getJsonValue('audit_get_datetime_single', [asset, searchDate], 'Could not retrieve audit history');
  const value = {audit: svrResp.audit, fields: mergeSequentialFieldIds(svrResp.fields)} 
  if (svrResp.audit) return {success: 'Audit History Found', value:  ({...value, options: svrResp.options}), }
  else return svrResp
}

export const auditBulkChange = async (
  audits: Array<number>, 
  options: Array<number>, 
  quantity: number, 
  notes: string,
  fields: IBulkAuditChange['fields'], 
  vclass: number,
  bulkMoverId: number,
  ask_to_change: boolean,
  is_admin: boolean) => {
  let fieldIntrusion:boolean = false
  let definedQuanity: number = 0
  let definedNotes: string = ''
  const auditNotFound: Array<number> = []
  const auditDifferentClass: Array<number> = []
  const auditPrivilegeChange: Array<number> = []
  const auditAdminChange: Array<number>=[]
  const auditCannotBeChanged: Array<number> = []
  let successMessage = 'Audits Changed'
  
  //checkes
  const classFields = await getDbFieldsFromClass(vclass)
  if (!classFields.success) return {info: 'Class Field Not Found'}
  const compareClassFields = classFields.value.map(item => item.v_id)
  fields.forEach(item => {if(!compareClassFields.includes(item.v_id)) return fieldIntrusion = true})
  //@ts-ignore
  if (fieldIntrusion === true) return {info: 'One of the class fields does not match the database class fields, please press F5 to refresh the interface'}
  
  await Promise.all(audits.map(async item => {
    //get audit
    const audit = await getLastAudit(item)

    const auditPermission = await getAuditPermission(item)
    if (EOrderAuditPermission.askForEditing === auditPermission && ask_to_change !== true)
      return auditPrivilegeChange.push(item)
    else if(EOrderAuditPermission.onlyAdminEdit === auditPermission 
      && (ask_to_change !== true 
      || is_admin !== true))
      return auditAdminChange.push(item)
    else if (EOrderAuditPermission.lockedFromEditing === auditPermission) 
      return auditCannotBeChanged.push(item)
  
    
    //audit not found error push
    if (!audit.success)return auditNotFound.push(item)

    //different fields error push
    if (audit.success.audit.audit_class_id !== vclass) return auditDifferentClass.push(item)

    let newFields: Array<{v_id: number, v_field: number, v_values: Array<any>}> = []
    
    if (audit.success.fields !== null){
      newFields = audit.success.fields.map(auditFields => 
        ({v_id: auditFields.v_id, v_values: auditFields.value_arr, v_field: (classFields.value.find(classItem => 
          classItem.v_id === auditFields.v_id)).v_field}))
      
      fields.forEach(item => {
        const findSvrAudit = newFields.find(svrAuditFields => 
          item.v_id === svrAuditFields.v_id)

        if (findSvrAudit !== undefined)
          newFields = newFields.map(auditItems => 
            auditItems.v_id === item.v_id ? {...auditItems, v_values: item.values}: auditItems)
        
        else newFields = [...newFields, {v_field: item.v_field, v_id: item.v_id, v_values: item.values}]
        
      })
    }
    else newFields = fields.map(fieldItems => ({...fieldItems, v_values: fieldItems.values}))
    newFields = convertFields(newFields)

    if (quantity > 0) definedQuanity = quantity
    else definedQuanity = audit.success.audit.quantity
    if (notes !== '🔥') definedNotes = notes
    else definedNotes = audit.success.audit.notes
    let sendOptions: Array<number> = []

    if (options.length > 0) sendOptions = options
    else if (audit.success.options !== null) sendOptions = audit.success.options.map(optionItem => optionItem.issue_id)
    await editAudit(
      audit.success.audit.audit_class_id,
      item,
      definedQuanity,//@ts-ignore
      newFields,
      sendOptions,
      definedNotes,
      bulkMoverId)
  }))

  if (auditDifferentClass.length > 0 || auditNotFound.length > 0 || auditPrivilegeChange.length > 0 || auditAdminChange.length > 0 || auditCannotBeChanged.length > 0)
  successMessage = 'Some audits could not be changed'
  
  return {success: successMessage, 
    differentClass: auditDifferentClass, 
    notFound: auditNotFound, 
    privilegeChange: auditPrivilegeChange, 
    adminChange: auditAdminChange, 
    cannotChange: auditCannotBeChanged}
}
export const auditBulkMove = async (
  location: string, 
  assets: Array<number>, 
  force: boolean,
  userId: number,
  isAdm: boolean
) : Promise<IBulkMove> => {
  try {
    const item = await db.func('audit_bulk_move', [location, assets, force, userId, isAdm]);
    const svrResp: IBulkMoveResp = item[0]
    if(svrResp.audit_id.length <= 0) {
      return {success: "Audits Changed"}
    }
    else {
      for (const i of svrResp.perm){
        if (i === EOrderAuditPermission.askForEditing ||
          i === EOrderAuditPermission.onlyAdminEdit)
          return {info: 'Audits not changed', ...svrResp, ask: true}
      }
      for (const i of svrResp.perm){
        if (i === EOrderAuditPermission.lockedFromEditing ||
          i === EOrderAuditPermission.notFound)
          return {info: 'Some audits could not be found or are locked from changing', ...svrResp}
      }
    }
    return {success: 'All audits have been changed'}
  } catch (error) {
    console.error(error);
    return {error: 'Could not change audits, Please allow 1 second to submit another entry, if the problem persists, please contact Rafa. (pff, who needs administrator?)'}
  }
}
export const searchAudits = async (options: ISearchAudits['options'], searchArray: ISearchAudits['search'], classId: number): Promise<any> => {
  try {
    
    const auditsFound = await db.func("audits_find", [classId, JSON.stringify(searchArray), JSON.stringify(options)]);
    const auditArr = []
    if (auditsFound.length > 0){
      for (const element of auditsFound){
        const audit = await searchAudit(element.audit)
        const newObj = {...audit.audit_info}
        delete audit.audit_info
        auditArr.push({...element, ...audit, ...newObj})
      }
      return {success: "Audits Found", value: auditArr}
    }
    else return {info: "No Audits found!"}
  } catch (err) {
    console.error(err.message);
    console.error(err)
    return {error: "Could not find audits"}
  }
}
export const searchAudit = async (audit: number): Promise<any> => {
  if (audit > 0){
    try {
      const jsonObj:ISingleAuditSearch = await db.func("audit_get_info_and_order", [audit]);
      return jsonObj[0].audit_get_info_and_order
    } catch (err) {
      console.error(err.message);
      console.error(err)
      return {error: "Could not find audits"}
    }
  }
  return {info: "No Audits found!"}
}
export const saveAuditPreset = async (
  name: string,
  class_id: number,
  preset: ISaveAuditPreset['preset'], 
  options: Array<number>, 
  presetEdit: ISaveAuditPreset['presetEdit'],
  editOptions: Array<number>
  
): Promise<any> => {
  try {
    const svrResp:ISingleAuditSearch = await db.func("audit_save_preset", [
      name,
      class_id,
      JSON.stringify(preset), 
      JSON.stringify(options), 
      JSON.stringify(presetEdit),
      JSON.stringify(editOptions)
    ]);
    if (svrResp[0].audit_save_preset > 0)
      return {success: 'Preset Saved'}
    return {info: 'Preset not saved, please try again in 1 second'}
  } catch (err) {
    console.error(err.message);
    console.error(err)
    return {error: "Could not set audit preset"}
  }
}
export const getAuditPresets = async (v_id: number): Promise<ISvrGetAuditPreset> => {
  try {
    const svrResp = await db.func("audit_get_preset", [v_id]);
    if (svrResp.length > 0)
      return {success: 'Presets Found', value: svrResp}
    return {info: 'Preset Not Found'}
  } catch (err) {
    console.error(err.message);
    console.error(err)
    return {error: "Could not get presets"}
  }
}
export const getAvailableInventory = async (): Promise<IAvailableInventory> => {
  try {
    const svrResp = await db.func("audit_get_available");
    if (svrResp.length > 0)
      return {success: 'Audits Found', value: svrResp}
    return {info: 'No Inventory'}
  } catch (err) {
    console.error(err.message);
    console.error(err)
    return {error: "Could not get inventory"}
  }
}

const getTableFromValue = async (spFunction: string, value: Array<any>, successMessage: string, errorMessage: string) => {
  try {
    const item = await db.func(spFunction, value);
    if(item.length > 0) return{success: successMessage, value: item}
    else return{info: errorMessage}
  } catch (error) {
    console.error(error);
    return {error: errorMessage}
  }
}

const getSingleValue = async(spFunction:string, values: Array<any>, successMessage: string, errorMessage:string) => {
  try {
    const item = await db.func(spFunction, values);
    const value = item[0][spFunction];
    return value
  } catch (error) {
    console.error(error);
    return {error: errorMessage}
  }
}

const getJsonValue = async(spFunction, values, errorMsg) => {
  try {
    const item = await db.func(spFunction, values);
    const value = item[0][spFunction];
    return (value);
  } catch (err) {
    console.error(err.message);
    return {error: errorMsg}
  }

}

