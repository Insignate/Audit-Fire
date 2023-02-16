import { IValueResponse, IValuesFromClass } from "../../../tsTypes/psqlResponses";
import { createFieldId } from "../../../utils/cryptograph";
import { getDB } from "../connection";
const { db } = getDB()

export const addDbClass = (className: string): Promise<IValueResponse> => getSingleValue('class_add_new', [className], 'Class Added', 'Class Already Exists')
export const getDbClasses = () => getTable('classes_get', 'Classes Found', 'No classes registered')
export const deleteDbClass = (id: number) => getSingleValue('class_delete', [id], 'Class Deleted', 'Could not delete Class: It is being used by a field')
export const addDbClassField = (name: string, boxSelected: number, classSelected: number, order: number, entries: number, required: boolean) => getSingleValue('class_add_field', [name, createFieldId(), boxSelected , classSelected, order, entries, required], 'Class Added',  'Class Field already exists!')
export const deleteDbFieldClass = (vid: number, classId: number) => getSingleValue('class_delete_field', [vid, classId], 'Class Field Deleted' , 'Could not delete Field')
export const addDbPreDefinedOption = (fieldId: number, name: string, classId: number) => getSingleValue('class_add_option_field', [fieldId, name, classId], 'Option Added', 'Option Already Exists')
export const changeDbFieldProperties = (vid:number, class_id: number, order:number, entries:number, required: boolean) => getSingleValue('field_change_properties', [vid, class_id, order, entries, required], 'Field Properties Changed', 'Could not change Field Properties')
export const deleteDbOptionField = (vid: number) => getSingleValue('field_delete_option', [vid], 'field deleted', 'Could not delete Option')
export const addDbIssue = (issue: string) => getSingleValue('issue_add', [issue], 'Issue Added', 'Issue Already Exists')
export const getDbIssues = () => getTable('issue_get', 'Issues Retrieved', 'No issues Registered')
export const deleteDbIssue = (vid: number) => getSingleValue('issue_delete', [vid], 'Issue Deleted', 'Issue could not be deleted')
export const addDbIssueToClass = (classId: number, issueId: number) => getSingleValue('class_add_issue', [classId, issueId], 'Issue Added','Issue Already Registered')
export const getDbClassIssues = (vid: number) => getTableFromValue('issue_get_from_class', [vid], 'Options Retrieved', 'No Options Registerd')
export const deleteDbClassOption = (classId: number, optionId: number) => getSingleValue('issue_delete_from_class', [classId, optionId], "Class' Issue Deleted", 'No Option Deleted')
export const getDbFieldsFromClass = async (vid: number):Promise<IValuesFromClass>  => {
  const fields = await getTableFromValue('class_get_fields', [vid], 'Classes retrieved', 'Class does not exists');
  if (fields.success){
    const result = Promise.all(fields.value.map(async item => {
      if(item.v_field === 2){
        const fieldValues = await getTableFromValue('field_get_values', [item.v_id, vid], 'Fields Retrieved', 'Empty Field');
        if (fieldValues.success) item.v_fieldValues = fieldValues.value;
        else item.v_fieldValues = [];
      }
      return item;
    }));
    const rresult: IValuesFromClass["value"] = await result;
    return {success: "Class Fields Found", value: rresult};
  }
  else return {info: 'No Fields Registered Under The Class Selected'}
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

const getTable = async (spFunction: string, successMessage: string, errorMessage: string) => {
  try {
    const item = await db.func(spFunction);
    if(item.length > 0) return{success: successMessage, value: item}
    else return{info: errorMessage}
  } catch (error) {
    console.error(error);
    return {error: errorMessage}
  }
}

const  getSingleValue = async(spFunction:string, values: Array<any>, successMessage: string, errorMessage:string) => {
  try {
    const item = await db.func(spFunction, values);
    const value = item[0][spFunction];
    if(value > 0) return{success: successMessage, value};
    else if (value === null) return{info: errorMessage};
    else return {info: "No records changed"};
  } catch (error) {
    console.error(error);
    return {error: errorMessage}
  }
}