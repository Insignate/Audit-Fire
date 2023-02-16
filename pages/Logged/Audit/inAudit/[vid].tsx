
import { NextApiRequest, NextApiResponse } from 'next'
import { useRouter } from 'next/router'
import React, { Fragment, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import AuditStructure from '../../../../components/AuditFields/AuditStructure'
import { LockSubmitButton, SelfLockSubmitButton } from '../../../../components/buttons'
import Image from '../../../../components/Image'
import Selectbox from '../../../../components/Selectbox'
import { getSingleFullJobName } from '../../../../database/postgres/jobRegistry/dbCom'
import JobPermissions from '../../../../permissions/jobPermission'
import RequesterInfo from '../../../../permissions/requester'
import { validateNextQuery } from '../../../../schemas/dataValidation'
import { vCheckIntVid } from '../../../../schemas/inputValidation'
import { IGetValueVidVname, IJobSingleFullName, IObjValuesFromClass, ISingleAuditPreset, ISvrGetAuditPreset, IValueResponse, IValuesFromClass } from '../../../../tsTypes/psqlResponses'
import { formatDayHHMMIncrease3 } from '../../../../utils/dateTimeFormat'
import { EFieldTypes } from '../../../../utils/enums'
import { getFetch, jFetch } from '../../../../utils/fetchs'
import { EWindowType, ModalsContext } from '../../../../utils/Modals'
import Head from 'next/head'

enum EActionType {
  setClasses,
  setClassFields,
  addField,
  removeField,
  changeField,
  setOptions,
  changeOption,
  removeOption,
  rootField,
  setPreset,
  cleanAudit,
  auditSuccess,
  addEditField,
  removeEditField,
  changeEditField,
  changeEditOption,
  removeEditOption,
  copyAuditToAsIs,
  copyField
}

interface IActionType{
  type: EActionType
  vidName?: IGetValueVidVname['value']
  classFields?: Array<IObjValuesFromClass>
  string?: string
  number?: number
  number2?: number
  number3?: number
  field?: string
  value?: string | number | boolean | ISvrGetAuditPreset['value']
  preset?: ISingleAuditPreset['preset']
  options?: ISingleAuditPreset['options']
  editPreset?: ISingleAuditPreset['preset_edit']
  editOptions?: ISingleAuditPreset['options_edit']
}

export interface IAuditValues extends IObjValuesFromClass{
  values: Array<any>
  copy?: boolean
}

const reducer = (state: Init, action: IActionType) => {
  switch(action.type){
    case EActionType.setClasses:
      return {...state, classes: action.vidName}
    case EActionType.setClassFields:
      const addValues = action.classFields.map(item => item.v_field === EFieldTypes.textbox ? 
        {...item, values: [''], copy: false} : item.v_field === EFieldTypes.checkbox ?
        {...item, values: [false], copy: false}: item.v_field === EFieldTypes.numericbox ?
        {...item, values: [0], copy: false}: item.v_field === EFieldTypes.selectbox && 
        {...item, values: [0], copy: false})
      const addEditValues = action.classFields.map(item => item.v_field === EFieldTypes.textbox ? 
        {...item, values: [''], v_name: item.v_name + 1, copy: false} : item.v_field === EFieldTypes.checkbox ?
        {...item, values: [false], v_name: item.v_name + 1, copy: false}: item.v_field === EFieldTypes.numericbox ?
        {...item, values: [0], v_name: item.v_name + 1, copy: false}: item.v_field === EFieldTypes.selectbox && 
        {...item, values: [0], v_name: item.v_name + 1, copy: false})
      return {
        ...state, 
        activeClassFields: addValues, 
        selectedClass: action.number, 
        selectedOptions: [0],
        activeEditClassFields: addEditValues,
        selectedEditOptions: [0]
      }
    case EActionType.addField:
      let find = state.activeClassFields.find(item => item.v_id === action.number)
      if (find.v_field === EFieldTypes.textbox) find.values[action.number2] = ''
      else if (find.v_field === EFieldTypes.numericbox) find.values[action.number2] = 0
      else if (find.v_field === EFieldTypes.selectbox) find.values[action.number2] = ''
      else if (find.v_field === EFieldTypes.checkbox) find.values[action.number2] = true
      return {...state}

    case EActionType.addEditField:
      let findEdit = state.activeEditClassFields.find(item => item.v_id === action.number)
      if (findEdit.v_field === EFieldTypes.textbox) findEdit.values[action.number2] = ''
      else if (findEdit.v_field === EFieldTypes.numericbox) findEdit.values[action.number2] = 0
      else if (findEdit.v_field === EFieldTypes.selectbox) findEdit.values[action.number2] = ''
      else if (findEdit.v_field === EFieldTypes.checkbox) findEdit.values[action.number2] = true
      return {...state}
    
    case EActionType.removeField:
      let find2 = state.activeClassFields.find(item => item.v_id === action.number)
      find2.values.length = action.number2
      return {...state}
    case EActionType.removeEditField:
      let find2Edit = state.activeEditClassFields.find(item => item.v_id === action.number)
      find2Edit.values.length = action.number2
      return {...state}
    case EActionType.changeField:
      let find3 = state.activeClassFields.find(item => item.v_id === action.number)
      if (find3.v_field === EFieldTypes.textbox) find3.values[action.number2] = action.string 
      else if (find3.v_field === EFieldTypes.selectbox){
        const value = parseInt(action.string)
        if (!isNaN(value))
        find3.values[action.number2] = value
        else find3.values[action.number2] = ''
      }
      else if (find3.v_field === EFieldTypes.numericbox){
        const value = parseFloat(action.string)
        if (!isNaN(value))
        find3.values[action.number2] = value
        else find3.values[action.number2] = ''
      }
      else if (find3.v_field === EFieldTypes.checkbox){
        find3.values[action.number2] = action.string
      }
      return {...state}

    case EActionType.changeEditField:
      let find3Edit = state.activeEditClassFields.find(item => item.v_id === action.number)
      if (find3Edit.v_field === EFieldTypes.textbox) find3Edit.values[action.number2] = action.string 
      else if (find3Edit.v_field === EFieldTypes.selectbox){
        const value = parseInt(action.string)
        if (!isNaN(value))
        find3Edit.values[action.number2] = value
        else find3Edit.values[action.number2] = ''
      }
      else if (find3Edit.v_field === EFieldTypes.numericbox){
        const value = parseFloat(action.string)
        if (!isNaN(value))
        find3Edit.values[action.number2] = value
        else find3Edit.values[action.number2] = ''
      }
      else if (find3Edit.v_field === EFieldTypes.checkbox){
        find3Edit.values[action.number2] = action.string
      }
      return {...state}

    case EActionType.setOptions:
      return {...state, options: action.vidName}
    case EActionType.changeOption: 
      const optionValue = isNaN(action.number) ? 0 : action.number
      if (state.selectedOptions.includes(optionValue)) return state
      state.selectedOptions[action.number2] = optionValue
      if (action.number2+1 >= action.number3) state.selectedOptions[action.number2+1] = 0
      return {...state}
    case EActionType.changeEditOption: 
      const optionEditValue = isNaN(action.number) ? 0 : action.number
      if (state.selectedEditOptions.includes(optionEditValue)) return state
      state.selectedEditOptions[action.number2] = optionEditValue
      if (action.number2+1 >= action.number3) state.selectedEditOptions[action.number2+1] = 0
      return {...state}
    case EActionType.removeOption:
      if (action.number >= 0){
        state.selectedOptions.length = action.number
        state.selectedOptions[action.number] = 0
        return {...state}
      }
      else return state
    case EActionType.removeEditOption:
      if (action.number >= 0){
        state.selectedEditOptions.length = action.number
        state.selectedEditOptions[action.number] = 0
        return {...state}
      }
      else return state
        
    case EActionType.rootField:
      return {...state, [action.field]: action.value}
    case EActionType.setPreset:
      return {...state, 
        selectedOptions:  [...action.options, 0],
        activeClassFields: state.activeClassFields.map(item => {
          for (var i = 0; i<= action.preset.length; i++){
            const presetAction = action.preset[i]
            if(item.v_id === presetAction.v_id && item.v_field === presetAction.v_field)
              return {...item, values: [...presetAction.values]} 
          }
          return item
        }),
        activeEditClassFields: state.activeEditClassFields.map(item => {
          for (var i = 0; i<= action.editPreset.length; i++){
            const presetAction = action.editPreset[i]
            if(item.v_id === presetAction.v_id && item.v_field === presetAction.v_field)
              return {...item, values: [...presetAction.values], copy: false}
          }
          return {...item, copy: false}
        }),
        selectedEditOptions: [...action.editOptions, 0]
      }
    case EActionType.copyAuditToAsIs:
      const newEditOptions = []
      for (let i = 0; i < state.activeEditClassFields.length; i++){
        newEditOptions.push(
          state.activeEditClassFields[i].copy === true ? {...state.activeEditClassFields[i]} :
          {...state.activeEditClassFields[i], values: [...state.activeClassFields[i].values]})
      }
      return {...state,
        activeEditClassFields: newEditOptions
      }
    case EActionType.cleanAudit:
      return {...state, selectedClass: 0, activeClassFields: [], presets: [], options: [], selectedOptions: [0]}
    
    case EActionType.auditSuccess:
      return {...state, auditNumber: ''}

    case EActionType.copyField:
      if (state.activeEditClassFields[action.number].values !== state.activeClassFields[action.number].values)
        return {...state, 
          activeEditClassFields: state.activeEditClassFields.map((item, index) => {
            return index === action.number ? {
              ...item, 
              values: state.activeClassFields[action.number].values,
              copy: true}
              : {...item}
          })
        }
      else return {...state, 
        activeEditClassFields: state.activeEditClassFields.map((item, index) => {
          return index === action.number ? {
            ...item, values: [...state.activeEditClassFields[action.number].values],
            copy: false}
            : {...item}
        })
      }


    default: return state
  }
}

class Init{
  //@ts-ignore
  auditNumber: number = ''
  auditQuantity: number = 1
  auditNotes: string = ''
  editNotes = ''
  classes: IGetValueVidVname['value'] = []
  activeClassFields: Array<IAuditValues> = []
  activeEditClassFields: Array<IAuditValues> =[]
  selectedClass: number = undefined
  options: IGetValueVidVname['value'] = []
  selectedOptions: Array<number> = [0]
  selectedEditOptions: Array<number> = [0]
  presets: ISvrGetAuditPreset['value'] = []
  showEdit = false
  presetName = ''
}

const InAudit = ({fullJobName, expectation}: {fullJobName: string, expectation: string}) => {
  const router = useRouter()
  const jobId = parseInt(router.query.vid[0])
  const [lockSubmitBtn, setLockSubmitBtn] = useState(false)
  const [state, dispatch] = useReducer(reducer, new Init())
  const {
    presets,
    classes, 
    selectedClass, 
    activeClassFields, 
    options, 
    selectedOptions, 
    auditNumber, 
    auditQuantity, 
    auditNotes,
    activeEditClassFields,
    editNotes,
    selectedEditOptions,
    showEdit,
    presetName
  } = state
  const auditInput = useRef(null)
  const {showWindow, showCustomWindow} = useContext(ModalsContext)

  const createAudit = useCallback(async (e) => {
    setLockSubmitBtn(true)
    e.preventDefault()
    const vclass = selectedClass;//@ts-ignore
    const audit = parseInt(auditNumber)//@ts-ignore
    const quantity = parseInt(auditQuantity)
    const fields = activeClassFields.map(({v_id, v_field, values}) => ({v_id, v_field, v_values: values}))
    const editFields = activeEditClassFields.map(({v_id, v_field, values}) => ({v_id, v_field, v_values: values}))
    const editOptions = selectedEditOptions
    const options = selectedOptions
    const notes = auditNotes
    const svrResp = await jFetch('audit/create-audit', 'POST', {
      jobId,
      vclass,
      audit,
      quantity,
      fields,
      options,
      notes,
      editFields,
      editOptions,
      asIsAudit: showEdit,
      editNotes
    })
    if(svrResp.success){
      dispatch({type: EActionType.auditSuccess})
      auditInput.current.focus()
    }
    showWindow(svrResp)
    setLockSubmitBtn(false)
  }, [showEdit,
    editNotes,
    selectedEditOptions,
    activeEditClassFields,
    selectedClass,
    auditNumber,
    auditQuantity,
    activeClassFields,
    selectedOptions,
    auditNotes,
    jobId,
  ])
  const getClass = useCallback(async (vid: number) => {
    const fields:IValuesFromClass = await jFetch('class-manip/get-fields-from-class', 'POST',{vid})
    if (fields.value){
      dispatch({type: EActionType.setClassFields, classFields: fields.value, number: vid})
    }
  }, [])
  const getOptions = useCallback(async (vid: number) => {
    const options:IGetValueVidVname = await jFetch('class-manip/get-options-from-class', 'POST', {vid})
    if (options.value){
      dispatch({type: EActionType.setOptions, vidName: options.value})
    }
  }, [])
  const getFieldsFromClass = useCallback(async (e: EventTarget & HTMLSelectElement) => {
    const vid = parseInt(e.value)
    dispatch({type: EActionType.cleanAudit})
    if (!isNaN(vid)){
      getClass(vid)
      getOptions(vid)
    }
    auditInput.current.focus()
  }, [getClass, getOptions])
  const addField = useCallback((vid: number, size: number) => {
    dispatch({type: EActionType.addField, number: vid, number2: size})
  }, [])
  const addEditField = useCallback((vid: number, size: number) => {
    dispatch({type: EActionType.addEditField, number: vid, number2: size})
  }, [])
  const removeField = useCallback((vid: number, size: number) => {
    dispatch({type: EActionType.removeField, number: vid, number2: size})
  }, [])
  const removeEditField = useCallback((vid: number, size: number) => {
    dispatch({type: EActionType.removeEditField, number: vid, number2: size})
  }, [])
  const changeField = useCallback((value: string, vid: number, index: number) => {
    dispatch({type: EActionType.changeField, string: value, number: vid, number2: index})
  }, [])
  const changeEditField = useCallback((value: string, vid: number, index: number) => {
    dispatch({type: EActionType.changeEditField, string: value, number: vid, number2: index})
  }, [])
  const changeOption = useCallback((value: string, index: number, length: number) => {
    dispatch({type: EActionType.changeOption, number: parseInt(value), number2: index, number3: length})
  }, [])
  const changeEditOption = useCallback((value: string, index: number, length: number) => {
    dispatch({type: EActionType.changeEditOption, number: parseInt(value), number2: index, number3: length})
  }, [])
  const removeOption = useCallback((value: number) => {
    dispatch({type: EActionType.removeOption, number: value})
  }, [])
  const removeEditOption = useCallback((value: number) => {
    dispatch({type: EActionType.removeEditOption, number: value})
  }, [])
  const returnToJobSelection = useCallback(() => {
    router.push('/Logged/Audit/')
  }, [])
  const copyField = useCallback((index: number) => {
    dispatch({type: EActionType.copyField, number: index})
  }, [])
  const saveAuditPreset = useCallback(async () => {
    if(selectedClass > 0 && presetName.length > 0){
      const newOptions = selectedOptions.filter(item => item > 0)
      const saveValues = activeClassFields.map(({v_id, v_field, values}) => ({v_id, v_field, values}))
      const newEditOptions = selectedEditOptions.filter(item => item > 0)
      const saveEditValues = activeEditClassFields.map(({v_id, v_field, values}) => ({v_id, v_field, values}))
      const svrResp = await jFetch(
        'audit/save-audit-preset',
        'POST', 
        {
          name: presetName,
          preset: saveValues, 
          presetEdit: saveEditValues,
          class_id: selectedClass, 
          options: newOptions,
          editOptions: newEditOptions
        })
      showWindow(svrResp)
    }
    else showCustomWindow('Info', 'You need to select a class to save the preset and enter a name for the preset', EWindowType.info)
    
  }, [activeClassFields, selectedClass, selectedOptions, presetName, selectedEditOptions, activeEditClassFields])
  
  const getPresets = useCallback(async () => {
    if (selectedClass > 0){
      const svrResp:ISvrGetAuditPreset = await jFetch('audit/audit-get-presets', 'POST', {v_id: selectedClass})
      if (svrResp.success){
        dispatch({type: EActionType.rootField, field: 'presets', value: svrResp.value})
      }
      else (showWindow(svrResp))
    }
    else showCustomWindow('Info', 'You need to select a Class to get audit Presets', EWindowType.info)
  }, [selectedClass])
  
  useEffect(() => {
    const getAuditClass = async () => {
      const classes:IGetValueVidVname = await getFetch('class-manip/get-classes') 
      if (classes.success)
        dispatch({type: EActionType.setClasses, vidName: classes.value})
    }
    getAuditClass()
    auditInput.current.focus()
  }, [])

  return (
    <section>
      <Head>
        <title>Audit Equipment</title>
      </Head>
      <style jsx>{`
      header{
        padding: 6px;
        border-bottom: solid 2px;
      }
      form{
        display: inline-block;
        margin: 8px;
      }
      table tr td:nth-child(1){
        text-align: right;
      }
      fieldset button{
        width: 100%;
      }
      .audit-data{
        display: flex;
      }
      .audit-data > hr{
        margin: 0 6px;
      }
      .audit-options-commands{
        display: flex;
      }
      .audit-options-commands > hr{
        margin: 0 6px;
      }
      .audit-as-is-container{
        width: 300px;
      }
      .expectation-container{
        position: fixed;
        top: 44px;
        right: 0;
        transition: right var(--fast-transition);
        padding-right: 10px;
      }
      .expectation{
        width: 150px;
        min-height: 120px;
      }
      .expectation > label, .expectation > hr{
        transition: opacity var(--fast-transition);
      }
      .dont-display{
        display: none;
      }
      .audit-commands{
        max-width: 174px;
      }
      .time-to-delete{
        opacity: 0;
        position: absolute;
        pointer-events: none;
        transition: opacity var(--fast-transition);
        left: 174px;
        width: 80px;
      }
      .btn-set-preset:hover > .time-to-delete{
        opacity: 1;
      }
      @media screen and (max-width: 1200px){
        .expectation-container{
          right: -158px;
        }
        .expectation-container .expectation > *{
          opacity: 0;
        }
        .expectation-container:hover{
          right: 0px;
        }
        .expectation-container:hover > .expectation > *{
          opacity: 1;
        }
      }
      @media screen and (max-width: 1010px){
        .audit-options-commands{
          flex-direction: column;
        }
        .audit-options-commands > hr{
          margin: 6px 0;
        }
      }
      @media screen and (max-width: 740px){
        .audit-data{
          flex-direction: column;
        }
        .audit-data > hr{
          margin: 6px 0;
        }
        .audit-options{
          max-width: 460px;
        }
        .audit-commands{
          max-width: 300px;
        }
      }
    
      `}</style>
      <header className='obj-attention'>{fullJobName}</header>
      <form onSubmit={e => createAudit(e)} className='window window-attention'>
        <div className='audit-data'>
          <div className='audit-as-is-container'>
            <label style={{display: 'block', textAlign: 'center'}}>Audit As It Came From Customer</label>
            <hr style={{margin: '6px 0'}} />
            <table className='audit-table audit-size'>
              <tbody>
                <tr>
                  <td>Class:</td>
                  <td>
                    <Selectbox 
                      valueSelected={selectedClass} 
                      onChange={getFieldsFromClass} 
                      obj={classes} 
                      selectInfoText='---Select a Class---'
                    />
                  </td>
                </tr>
                <tr>
                  <td>Quantity: </td>
                  <td>
                    <input 
                      type='number' 
                      min='1'
                      value={auditQuantity}
                      onChange={e => {
                        const value = parseInt(e.target.value)
                        dispatch({type: EActionType.rootField, field: 'auditQuantity', value: value > 0 ? value : ''})}
                      }
                      required
                    /></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Audit #: </td>
                  <td>
                    <input 
                      ref={auditInput}
                      value={auditNumber} 
                      onChange={e => dispatch({type: EActionType.rootField, field: 'auditNumber', value: e.target.value})}
                      type='number'
                      min={1}
                      required
                      
                    />
                  </td>
                  <td></td>
                </tr>
                <AuditStructure 
                  classFields={activeClassFields}
                  addField={addField} 
                  removeField={removeField} 
                  changeValue={changeField} 
                />
                <tr>
                  <td>Notes</td>
                  <td>
                    <textarea 
                      value={auditNotes} 
                      onChange={e => dispatch({type: EActionType.rootField, field: 'auditNotes', value: e.target.value})}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <hr style={{margin: '6px 0'}} />
            <div className='audit-options'>
              <div style={{position: 'sticky', top: '4px'}}>
                <label>Options/Issues</label>
                <hr style={{margin: '6px 0'}} />
                
                {selectedOptions.map((item, index) => <Selectbox 
                  key={index}
                  valueSelected={item} 
                  onChange={e => changeOption(e.value, index, selectedOptions.length)} 
                  obj={options} 
                  selectInfoText='--Select Option--'
                  required={false}
                />)}
                { selectedOptions.length > 1 && <Image 
                  onClick={() => removeOption(selectedOptions.length - 2)}
                  src='/pictures/minus.svg' 
                  alt='remove' 
                  width='28px' 
                  height='28px' 
                  verticalAlign='bottom'
                  padding='0 0 0 4px' 
                />}
              </div>
            </div>
          </div>
          <hr />
          <div className='audit-options-commands'>
            {showEdit && <><div className='audit-as-is-container'>
              <label style={{display: 'block', textAlign: 'center'}}>Audit As Is</label>
              <hr style={{margin: '6px 0'}} />
              <table className='audit-table audit-size'>
                <tbody>
                  <tr>
                    <td>Copy Audit</td>
                    <td><button
                      type='button' 
                      style={{width: '100%'}}
                      onClick={() => dispatch({type: EActionType.copyAuditToAsIs})}
                    >Copy</button></td>
                  </tr>
                  <AuditStructure 
                    classFields={activeEditClassFields}
                    addField={addEditField} 
                    removeField={removeEditField} 
                    changeValue={changeEditField} 
                    copyField={copyField}
                  />
                  <tr>
                    <td>Notes</td>
                    <td>
                      <textarea 
                        value={editNotes} 
                        onChange={e => dispatch({type: EActionType.rootField, field: 'editNotes', value: e.target.value})}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <hr style={{margin: '6px 0'}} />
              <div className='audit-options'>
                <div style={{position: 'sticky', top: '4px'}}>
                  <label>Options/Issues</label>
                  <hr style={{margin: '6px 0'}} />
                  
                  {selectedEditOptions.map((item, index) => <Selectbox 
                    key={index}
                    valueSelected={item} 
                    onChange={e => changeEditOption(e.value, index, selectedEditOptions.length)} 
                    obj={options} 
                    selectInfoText='--Select Option--'
                    required={false}
                  />)}
                  { selectedEditOptions.length > 1 && <Image 
                    onClick={() => removeEditOption(selectedEditOptions.length - 2)}
                    src='/pictures/minus.svg' 
                    alt='remove' 
                    width='28px' 
                    height='28px' 
                    verticalAlign='bottom'
                    padding='0 0 0 4px' 
                  />}
                </div>
              </div>
            </div>
            <hr /></>}
            <div className='audit-commands'>
              <div style={{position: 'sticky', top: '4px'}}>
                <label>Commands</label>
                <hr style={{margin: '6px 0 0 0'}} />
                <fieldset>
                  <legend>Audit</legend>
                  <LockSubmitButton 
                    text={'Submit Audit'} 
                    loadingText={'Auditing...'} 
                    disabled={lockSubmitBtn}
                    styling='width: 100%;' 
                  />
                  <button
                    type='button'
                    onClick={() => dispatch({type: EActionType.rootField, field: 'showEdit', value: !showEdit})}
                  >{showEdit ? 'Hide Audit As Is' : 'Show Audit As Is'}</button>
                </fieldset>
                <fieldset>
                  <legend>Job Selection</legend>
                  <button
                    onClick={() => returnToJobSelection()} 
                    type='button'
                  >Return to job selection</button>
                </fieldset>
                <fieldset>
                  <legend>Audit Preset</legend>
                  <SelfLockSubmitButton 
                    text='Save Preset' 
                    loadingText='Saving...'
                    onClick={() => saveAuditPreset()} 
                    type='button'
                    styling='width: 100%;'
                  />
                  <input 
                    style={{width: '-moz-available'}} 
                    placeholder='Preset Name'
                    value={presetName}
                    onChange={e => dispatch({type: EActionType.rootField, field: 'presetName', value: e.target.value})}
                  />
                  
                  <hr style={{margin: '6px 0'}} />
                  <SelfLockSubmitButton 
                    text='Get Presets' 
                    loadingText='Loading...'
                    onClick={() => getPresets()} 
                    type='button'
                    styling='width: 100%;'
                  />
                  {presets.map(({datetime_placed, options, preset, preset_edit, options_edit, name}, index) => {
                    const {date, time} = formatDayHHMMIncrease3(datetime_placed)
                    return <Fragment key={index}>
                      <button 
                        className='btn-set-preset'
                        onClick={() => dispatch({type: EActionType.setPreset, preset, options, editPreset: preset_edit, editOptions: options_edit})}
                        type='button'>{name}
                        <label className='window window-lookup time-to-delete'>Delete at: {date + " " + time}</label>
                      </button>
                      
                    </Fragment>
                  })}
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </form>
      <div className='expectation-container'>
        <div className='window window-attention expectation'>
          <label>Job Expectations</label>
          <hr style={{margin: '6px 0 0 0'}} />
          <label>{expectation}</label>
        </div>
      </div>

    </section>
  )
}

export default InAudit

export const getServerSideProps = async ({req, res, query}: {req: NextApiRequest, res: NextApiResponse, query: {vid: number}}) => {
  try {
    const validate = await validateNextQuery(vCheckIntVid, req, res)
    if (validate !== true) return {notFound : true}
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissionsReq(req)
    
    if(reqPermission.canLogin !== true) return {redirect: {permanent: false, destination: '/'}}
    if(reqPermission.canAudit !== true) return {notFound : true}
    
    const jobPerm = new JobPermissions();
    await jobPerm.getDbPermissions(query.vid)
    if (jobPerm.canAudit !== true) return {notFound: true}

    const jobComposition: IJobSingleFullName = await getSingleFullJobName(query.vid)
    if( jobComposition.success){
      return {props: {
        fullJobName: jobComposition.success.job_full_name,
        expectation: jobComposition.success.v_expectation
      }};
    }
    return {notFound: true}
  } catch (error) {
    console.error(error)
    return {notFound : true}
  }
}