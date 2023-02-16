import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IGetValueVidVname, IObjValuesFromClass, IValueResponse, IValuesFromClass } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { EFieldTypes } from '../../../utils/enums'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { EWindowType, ModalsContext } from '../../../utils/Modals'
import AddFieldsToClass from './AddFieldsToClass'
import AddOptionsToClass from './AddOptionToClass'
import ClassManip from './ClassManip'
import OptionManip from './OptionManip'

export interface IClassState{
  inputNewName: string
  reg: IGetVidVname["success"]
  selToDelete: number
}
export interface IClassFunctions{
  addClass: () => Promise<void>
  deleteClass: () => Promise<void>
  inputChangeAdd: (e: React.ChangeEvent<HTMLInputElement>["target"]) => void
  deleteSelectChange: (e: React.ChangeEvent<HTMLSelectElement>["target"]) => void
}
export interface IOptionState{
  inputNewOption: string
  reg: IGetVidVname["success"]
  selToDelete: number
}
export interface IOptionFunctions{
  addOption: () => Promise<void>
  deleteOption: () => Promise<void>
  inputChangeAdd: (e: React.ChangeEvent<HTMLInputElement>["target"]) => void
  deleteSelectChange: (e: React.ChangeEvent<HTMLSelectElement>["target"]) => void
}
export interface IAddOptionToClassState{
  selectedClass: number
  selectedOption: number
  selectedClassOptions: number
  regOptionsToClass: IGetVidVname["success"]
}
export interface IAddOptionToClassFunc{
  addItem: () => Promise<void>
  deleteItem: () => Promise<void>
  changeClass: (e: React.ChangeEvent<HTMLInputElement>["target"]) => void
  changeOption: (e: React.ChangeEvent<HTMLInputElement>["target"]) => void
  changeOptionFromClass: (e: React.ChangeEvent<HTMLInputElement>["target"]) => void
}
export interface IClassFieldsState{
  selectedClass: number
  classFields: IValuesFromClass['value']
  fieldName: string
  fieldOrder: number
  fieldEntries: number
  fieldRequired: boolean
  radio: EFieldTypes
  addDeleteMultyField: number
  multyNewName: string
  selectedFieldOption: number
  optionToDelete: number
}
export interface IClassFieldsFn{
  getFieldsFromClass: (e: EventTarget & HTMLSelectElement) => void
  changeField: (value: string, id: number, option: EFieldChangeValue) => void
  changeDeleteClassField: (e: React.FormEvent<HTMLFormElement>) => void
  changeAddField: (value: string, field: 'fieldName' | 'fieldOrder' | 'fieldEntries' | 'fieldRequired' | 'radio') => void
  createField: () => Promise<void>
  changeMultyField: (value: string) => void
  setOptionToAdd: (value: string) => void
  setDeleteOption: (e: EventTarget & HTMLSelectElement) => void
  addOptionToField: () => Promise<void>
  deleteOptionFromField: () => Promise<void>
}



enum EActionType {
  rootField,
  changeClassState,
  addToClass,
  deleteClass,
  changeOptionState,
  deleteOption,
  addToOption,
  changeOptionToClassState,
  addOptionToClass,
  addChangeOptionToClassState,
  changeGetClassOptions,
  deleteOptionFromClass,
  changeClassFields,
  changeCompositeClassField,
  changeClassFieldsField,
  addFieldToClass,
  removeField,
  rootClassField,
  setOptionToAdd,
  addOptionToField,
  removeOptionFromField
}
export enum EFieldChangeValue {
  order,
  entries,
  required
}

interface IActionType{
  type: EActionType
  field?: string
  value?: number | string | boolean | IGetValueVidVname["value"]
  vidName?: IGetValueVidVname['value']
  valuesFromClass?: IValuesFromClass["value"]
  classFieldObj?: IObjValuesFromClass
  number?: number
  number2?: number
  string?: string
  bool?: boolean
}
const reducer = (state: Init, action: IActionType) => {
  
  switch(action.type){
    case EActionType.changeClassState:
      return {...state, classState: {...state.classState, [action.field]: action.value}}
    case EActionType.addToClass:
      return {...state, classState: {...state.classState, reg: [{v_id: action.number, v_name: state.classState.inputNewName},...state.classState.reg]}}
    case EActionType.deleteClass:
      return {...state, classState: {...state.classState, selToDelete: undefined, reg: state.classState.reg.filter(item => item.v_id !== action.number)}}
    
    case EActionType.changeOptionState:
      return {...state, optionsState: {...state.optionsState, [action.field]: action.value}}
    case EActionType.addToOption:
      return {...state, optionsState: {...state.optionsState, reg: [{v_id: action.number, v_name: state.optionsState.inputNewOption},...state.optionsState.reg]}}
    case EActionType.deleteOption:
      return {...state, optionsState: {...state.optionsState, selToDelete: undefined, reg: state.optionsState.reg.filter(item => item.v_id !== action.number)}}

    case EActionType.changeOptionToClassState:
      return {...state, optionToClassState: {...state.optionToClassState, [action.field]: action.value}}
    case EActionType.addOptionToClass:
      const optionSelected = state.optionToClassState.selectedOption
      const findItem = state.optionsState.reg.find(item => item.v_id == optionSelected)
      return {...state, optionToClassState: {...state.optionToClassState, regOptionsToClass: [{v_id: optionSelected, v_name: findItem.v_name},  ...state.optionToClassState.regOptionsToClass]}}
    case EActionType.changeGetClassOptions:
      state.optionToClassState.selectedClass = action.number
      state.optionToClassState.regOptionsToClass = action.vidName
      return {...state}
    case EActionType.deleteOptionFromClass:
      return {...state, optionToClassState: {...state.optionToClassState, regOptionsToClass: state.optionToClassState.regOptionsToClass.filter(item => item.v_id != state.optionToClassState.selectedClassOptions)}}
    case EActionType.changeCompositeClassField:
      if (action.number2 === EFieldChangeValue.entries){
        let parsedValue = parseInt(action.string)//@ts-ignore
        if (isNaN(parsedValue)) parsedValue = ""
        return {...state, classFieldsState: {...state.classFieldsState, classFields: state.classFieldsState.classFields.map(item => 
          item.v_id === action.number ? {...item, v_max_entries: parsedValue} : {...item}  
        )}}
      }
      else if (action.number2 === EFieldChangeValue.order){
        let parsedValue = parseInt(action.string)//@ts-ignore
        if (isNaN(parsedValue)) parsedValue = ""
        return {...state, classFieldsState: {...state.classFieldsState, classFields: state.classFieldsState.classFields.map(item => 
          item.v_id === action.number ? {...item, v_order: parsedValue} : {...item}  
        )}}
      }
      else if (action.number2 === EFieldChangeValue.required)
        return {...state, classFieldsState: {...state.classFieldsState, classFields: state.classFieldsState.classFields.map(item => 
          item.v_id === action.number ? {...item, v_required: !item.v_required} : {...item}  
        )}}
      return state
    
    case EActionType.changeClassFields: 
      return {...state, classFieldsState: {...state.classFieldsState, selectedClass: action.number, classFields: action.valuesFromClass}}// add the svrresp for class fields
    
    case EActionType.changeClassFieldsField:
      if (['fieldName', 'fieldOrder', 'fieldEntries', 'radio'].includes(action.string)){
        return {...state, classFieldsState: {...state.classFieldsState, [action.string]: action.value}}
      }
      else if(action.string ===  'fieldRequired'){
        return {...state, classFieldsState: {...state.classFieldsState, fieldRequired: !state.classFieldsState.fieldRequired}}
      }
      else return state
      
    case EActionType.addFieldToClass:
      return {...state, classFieldsState: //@ts-ignore
        {...state.classFieldsState, fieldOrder: parseInt(state.classFieldsState.fieldOrder)+100,
          classFields: [action.classFieldObj, ...state.classFieldsState.classFields]}}
    case EActionType.removeField:
      return {...state, classFieldsState: {...state.classFieldsState, classFields: state.classFieldsState.classFields.filter(item => item.v_id != action.number)}}
    case EActionType.rootClassField:
      return {...state, classFieldsState: {...state.classFieldsState, [action.field]: action.string}}
    case EActionType.addOptionToField: 
      return {...state, 
        classFieldsState: {...state.classFieldsState, 
          classFields: state.classFieldsState.classFields.map(item => {
            return item.v_id == state.classFieldsState.selectedFieldOption ? 
            {...item, v_fieldValues: [{v_id: action.number, v_name: state.classFieldsState.multyNewName}, ...item.v_fieldValues]} : item})}}
    case EActionType.removeOptionFromField:
      return {...state, 
        classFieldsState: {...state.classFieldsState, 
          classFields: state.classFieldsState.classFields.map(item => {
            return item.v_id == state.classFieldsState.selectedFieldOption ? 
            {...item, v_fieldValues: item.v_fieldValues.filter(item2 => state.classFieldsState.optionToDelete != item2.v_id)} : item
        })}}
    default: return state
  }
}

class Init{
  classState:IClassState = {
    inputNewName: "",
    reg: [],
    selToDelete: undefined
  }
  optionsState:IOptionState = {
    inputNewOption: "",
    reg: [],
    selToDelete: undefined
  }
  optionToClassState:IAddOptionToClassState = {
    selectedClass: undefined,
    selectedOption: undefined,
    selectedClassOptions: undefined,
    regOptionsToClass: []
  }
  classFieldsState: IClassFieldsState = {
    selectedClass: undefined,
    classFields: [],
    fieldName: "",
    fieldOrder: 0,
    fieldEntries: 1,
    fieldRequired: false,
    radio: undefined,
    addDeleteMultyField: 0,
    multyNewName: "",
    selectedFieldOption: undefined,
    optionToDelete: undefined
  }
}


const Index = () => {

  const [state, dispatch] = useReducer(reducer, new Init)
  const {classState, optionsState, optionToClassState, classFieldsState} = state
  const {showWindow, showCustomWindow} = useContext(ModalsContext)

  const classFunctions:IClassFunctions = {
    addClass: useCallback(async() => {
      const svrResp:IValueResponse = await jFetch("class-manip/add-class", "POST", {name: classState.inputNewName})
      if (svrResp.success){
        dispatch({type: EActionType.addToClass, number: svrResp.value})
      }
      showWindow(svrResp)
    }, [classState.inputNewName]),
    deleteClass: useCallback(async() => {
      const parsedVal = parseInt(String(classState.selToDelete))
      if(!isNaN(parsedVal)){
        const svrResp = await jFetch("class-manip/delete-class", "POST", {vid: parsedVal})
        if(svrResp.success){
          dispatch({type: EActionType.deleteClass, number: parsedVal})
        }
        showWindow(svrResp)
      }
    }, [classState.selToDelete]),
    inputChangeAdd: useCallback((e: React.ChangeEvent<HTMLInputElement>["target"]) => {
      dispatch({type: EActionType.changeClassState, field: "inputNewName", value: e.value})
    }, []),
    deleteSelectChange: useCallback((e: React.ChangeEvent<HTMLSelectElement>["target"]) => {
      dispatch({type: EActionType.changeClassState, field: "selToDelete", value: e.value})
    }, [])
  }
  const optionFunctions:IOptionFunctions = {
    addOption: useCallback(async() => {
      const svrResp:IValueResponse = await jFetch("class-manip/add-option", "POST", {name: optionsState.inputNewOption})
      if (svrResp.success){
        dispatch({type: EActionType.addToOption, number: svrResp.value})
      }
      showWindow(svrResp)
    }, [optionsState.inputNewOption]),
    deleteOption: useCallback(async() => {
      const parsedVal = parseInt(String(optionsState.selToDelete))
      if(!isNaN(parsedVal)){
        const svrResp = await jFetch("class-manip/delete-option", "POST", {vid: parsedVal})
        if(svrResp.success){
          dispatch({type: EActionType.deleteOption, number: parsedVal})
        }
        showWindow(svrResp)
      }
      
    }, [optionsState.selToDelete]),
    inputChangeAdd: useCallback((e: React.ChangeEvent<HTMLInputElement>["target"]) => {
      dispatch({type: EActionType.changeOptionState, field: "inputNewOption", value: e.value})
    }, []),
    deleteSelectChange: useCallback((e: React.ChangeEvent<HTMLSelectElement>["target"]) => {
      dispatch({type: EActionType.changeOptionState, field: "selToDelete", value: e.value})
    }, [])
  }
  const addOptionsToClassFunc:IAddOptionToClassFunc = {
    addItem: useCallback(async (): Promise<void> => {
      const classId = parseInt(String(optionToClassState.selectedClass))
      const issueId = parseInt(String(optionToClassState.selectedOption))
      if (!isNaN(classId) && !isNaN(issueId)){
        const svrResp:IValueResponse = await jFetch("class-manip/add-option-to-class", "POST", {classId, issueId})

        if (svrResp.success){
          dispatch({type: EActionType.addOptionToClass})
        }
        showWindow(svrResp)
      }
    }, [optionToClassState.selectedClass, optionToClassState.selectedOption]),
    deleteItem: useCallback(async (): Promise<void> => {
      const parsedOption = parseInt(String(optionToClassState.selectedClassOptions))
      const parsedClass = parseInt(String(optionToClassState.selectedClass))
      if (!isNaN(parsedOption) && !isNaN(parsedClass)){
        const svrResp = await jFetch('class-manip/delete-option-from-class', 'POST', {optionId: parsedOption, classId: parsedClass})
        if(svrResp.success){
          dispatch({type: EActionType.deleteOptionFromClass})
        }
        showWindow(svrResp)
      }
      else showCustomWindow("Info", "You need to select an Option and a Class to delete an Option from the Class", EWindowType.info)
      
    }, [optionToClassState.selectedClassOptions, optionToClassState.selectedClass, showCustomWindow, showWindow]),
    changeClass: useCallback( async(e: React.ChangeEvent<HTMLInputElement>["target"]) => {
      const parsedValue = parseInt(e.value)
      if (!isNaN(parsedValue)){
        dispatch({type: EActionType.changeOptionToClassState, field: "selectedClass", value: e.value})
        const svrResp = await jFetch('class-manip/get-options-from-class', 'POST', {vid: parsedValue})
        if (svrResp.success){
          dispatch({type: EActionType.changeGetClassOptions, vidName: svrResp.value, number: parsedValue})
        }
        else dispatch({type: EActionType.changeGetClassOptions, vidName: [], number: parsedValue})
      }
      else dispatch({type: EActionType.changeGetClassOptions, vidName: [], number: undefined})
    
    }, []),
    changeOption: useCallback((e: React.ChangeEvent<HTMLInputElement>["target"]) => {
      dispatch({type: EActionType.changeOptionToClassState, field: "selectedOption", value: e.value})
    }, []),
    changeOptionFromClass: useCallback((e: React.ChangeEvent<HTMLInputElement>["target"]) => {
      dispatch({type: EActionType.changeOptionToClassState, field: "selectedClassOptions", value: e.value})
    }, [])
  }
  const fnClassFields : IClassFieldsFn = {
    getFieldsFromClass: useCallback(async (e) => {
      const parsedValue = parseInt(e.value)
      if (!isNaN(parsedValue)) {
        const svrResp:IValuesFromClass = await jFetch('class-manip/get-fields-from-class', 'POST', { vid: parsedValue })
        if (svrResp.success) {
          dispatch({ type: EActionType.changeClassFields, number: parsedValue, valuesFromClass: svrResp.value})
        }
        else dispatch({ type: EActionType.changeClassFields, number: parsedValue, valuesFromClass: []})
      }
      else dispatch({ type: EActionType.changeClassFields, number: undefined, valuesFromClass: []})
    }, []),
    changeField: useCallback((value, id, option) => {
      dispatch({type: EActionType.changeCompositeClassField, string: value, number: id, number2: option})
    }, []),
    changeDeleteClassField: useCallback(async (e) => {
      e.preventDefault()//@ts-ignore
      const submitter: React.ChangeEvent<HTMLInputElement>["target"] = e.nativeEvent.submitter
      const name = submitter.name 
      const id = parseInt(submitter.id)
      const itemFound = classFieldsState.classFields.find(item => item.v_id == id)
      if (name === 'delete'){
        const svrResp = await jFetch('class-manip/delete-field-from-class', 'DELETE', {vid: id, classId: classFieldsState.selectedClass})
        if (svrResp.success)
          dispatch({type: EActionType.removeField, number: id})
        showWindow(svrResp)
      }
      else if (name === 'change'){
        const svrResp = await jFetch('class-manip/change-class-field', 'POST', 
          {
            vid: id, 
            order: itemFound.v_order,
            entries: itemFound.v_max_entries, 
            required: itemFound.v_required,
            class_id: classFieldsState.selectedClass
          })
        showWindow(svrResp)
      }
    }, [classFieldsState, classFieldsState.selectedClass]),
    changeAddField: useCallback((value, field) => {
      dispatch({type: EActionType.changeClassFieldsField, string: field, value})
    }, []),
    createField: useCallback(async() => {
      const name = classFieldsState.fieldName//@ts-ignore
      const order = parseInt(classFieldsState.fieldOrder)//@ts-ignore
      const entries = parseInt(classFieldsState.fieldEntries)
      const required = classFieldsState.fieldRequired//@ts-ignore
      const boxSelected = parseInt(classFieldsState.radio)//@ts-ignore
      const classSelected = parseInt(classFieldsState.selectedClass)
      if (!isNaN(order) && !isNaN(entries) && !isNaN(boxSelected) && !isNaN(classSelected) && boxSelected >= 1 && boxSelected <= 4 && classSelected > 0){
        const svrResp:IValueResponse = await jFetch('class-manip/create-class-field', 'POST', {name, order, entries, required, boxSelected, classSelected})
        if (svrResp.success){
          const classFieldObj:IObjValuesFromClass = {
            v_id: svrResp.value,
            v_name: '',
            v_field: boxSelected,
            v_label: name,
            v_max_entries: entries,
            v_order: order,
            v_required: required
          }
          if (boxSelected === EFieldTypes.selectbox){
            classFieldObj.v_fieldValues = []
          }
          dispatch({type: EActionType.addFieldToClass, classFieldObj})
        }
        showWindow(svrResp)
      }
      else showCustomWindow('Info', 'Please enter the required field values', EWindowType.info)
    }, [classFieldsState.fieldName, 
        classFieldsState.fieldOrder,
        classFieldsState.fieldEntries, 
        classFieldsState.fieldRequired, 
        classFieldsState.radio,
        classFieldsState.selectedClass
    ]),
    changeMultyField: useCallback((value) => {
      dispatch({type: EActionType.rootClassField, field: 'multyNewName', string: value})
    }, []),
    setOptionToAdd: useCallback((value) => {
      dispatch({type: EActionType.rootClassField, field: 'selectedFieldOption', string: value })
    }, []),
    setDeleteOption: useCallback((value) => {
      dispatch({type: EActionType.rootClassField, field: 'optionToDelete', string: value.value})
    }, []),
    addOptionToField: useCallback(async() => {
      if(classFieldsState.selectedFieldOption > 0){
      const svrResp:IValueResponse = await jFetch('class-manip/add-option-to-field', 'POST', {vid: classFieldsState.selectedFieldOption, classId: classFieldsState.selectedClass, name: classFieldsState.multyNewName})
      showWindow(svrResp)
        if (svrResp.success)
          dispatch({type: EActionType.addOptionToField, number: svrResp.value})
      }
      else showCustomWindow('Info', 'Please select a field to attach the option', EWindowType.info)
      
    }, [classFieldsState.selectedFieldOption, classFieldsState.multyNewName, classFieldsState.selectedClass]),
    deleteOptionFromField: useCallback(async () => {//@ts-ignore
      const vid = parseInt(classFieldsState.optionToDelete)
      if (!isNaN(vid)){
        const svrResp = await jFetch('class-manip/remove-option-from-field', 'DELETE', {vid})
        showWindow(svrResp)
        if (svrResp.success){
          dispatch({type: EActionType.removeOptionFromField})
        }
      }
      else showCustomWindow("Info", "Please select an option to remove", EWindowType.info)
      
      
    }, [classFieldsState.optionToDelete])
  }
  
  useEffect(() => {
    const getAllClasses = async() => {
      const svrResp:IGetValueVidVname = await getFetch("class-manip/get-classes")
      if (svrResp.success){
        dispatch({type: EActionType.changeClassState, field: "reg", value: svrResp.value})
      }
      else showWindow(svrResp)
    }
    const getAllOptions = async() => {
      const svrResp:IGetValueVidVname = await getFetch("class-manip/get-options")
      if (svrResp.success){
        dispatch({type: EActionType.changeOptionState, field: "reg", value: svrResp.value})
      }
      else showWindow(svrResp)
    }
    getAllClasses()
    getAllOptions()
  }, [])
  return (<>
    <div>
      <Head>
        <title>Class Registry</title>
      </Head>
      <ClassManip data={classState} functions={classFunctions} />
      <OptionManip data={optionsState} functions={optionFunctions} />
      <AddOptionsToClass 
        classItems={classState.reg} 
        optionItems={optionsState.reg} 
        data={optionToClassState} 
        functions={addOptionsToClassFunc} />, 
    </div>
    <AddFieldsToClass classList={classState.reg} data={classFieldsState} fn={fnClassFields} />
    </>
  )
}

export default Index

export const getServerSideProps = async ({req, res} : {req: NextApiRequest, res: NextApiResponse}) => {

  const value = await nextValidateLoginHeader(userTokenIdent, req, res, async () => {
    const {token, ident} = getCookie(req)
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissions(ident, token)
    
    if(reqPermission.canLogin !== true) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canManipulateClass === true) return {props: {
      pass: true
    }};
    else return {notFound : true}
  })
  return value
}