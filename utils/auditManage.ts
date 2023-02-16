import { IGetDbAuditHistorySingle, IValuesFromClass } from "../tsTypes/psqlResponses"
import { EFieldTypes } from "./enums"

export const mergeAuditFields = (classFields: IValuesFromClass['value'], svrAudit: IGetDbAuditHistorySingle['value']) => {
  if (svrAudit.fields !== null){
    const merged = classFields.map(item => {
      for(let i = 0; i <= svrAudit.fields.length-1; i++){
        if(svrAudit.fields[i].v_id === item.v_id)
          if (item.v_field === EFieldTypes.checkbox)
            return ({...item, values: svrAudit.fields[i].value_arr.map(vItem => vItem === 'true' ? true : false)})
          else if (item.v_field === EFieldTypes.numericbox)
            return ({...item, values: svrAudit.fields[i].value_arr.map(vItem => parseFloat(vItem))})
          else if (item.v_field === EFieldTypes.selectbox)
            return ({...item, values: svrAudit.fields[i].value_arr.map(vItem => parseInt(vItem))})
          else return ({...item, values: svrAudit.fields[i].value_arr})
      }
      if (item.v_field === EFieldTypes.checkbox)
        return {...item, values: [false]}
      else if (item.v_field === EFieldTypes.numericbox || item.v_field === EFieldTypes.selectbox)
        return {...item, values: [0]}
      return {...item, values: ['']}
    })
    return merged
  }
  return []
}
  
export const convertFields = (auditFields: Array<{v_id: number, v_field: number, v_values: Array<any>}>) => {
  const newFields = auditFields.map(item => {
    if (item.v_field === EFieldTypes.checkbox)
      return ({...item, v_values: item.v_values.map(vItem => (vItem === 'true' || vItem === true)  ? true : false)})
    else if (item.v_field === EFieldTypes.numericbox)
      return ({...item, v_values: item.v_values.map(vItem => parseFloat(vItem))})
    else if (item.v_field === EFieldTypes.selectbox)
      return ({...item, v_values: item.v_values.map(vItem => parseInt(vItem))})
    else return ({...item, v_values: item.v_values})
  })
  return newFields
  
}
  