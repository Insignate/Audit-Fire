import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { Fragment, useCallback, useContext, useEffect, useReducer } from 'react'
import AboutQMark, { AboutQMarkTag } from '../../../components/AboutQMark'
import AuditStructure from '../../../components/AuditFields/AuditStructure'
import { LockSubmitButton } from '../../../components/buttons'
import Image from '../../../components/Image'
import Selectbox from '../../../components/Selectbox'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IBulkMoveResp, IGetValueVidVname, IValuesFromClass } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { EFieldTypes } from '../../../utils/enums'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { DialogModalContext, EDialogWindowType } from '../../../utils/ModalDialog'
import { EWindowType, ModalsContext } from '../../../utils/Modals'
import { IAuditValues } from '../Audit/inAudit/[vid]'

interface IActionType{
  
  type: EActionType,
  classes?: IGetValueVidVname['value']
  number?: number
  number2?: number
  fields?: IGetValueVidVname['value']
  options?: IGetValueVidVname['value']
  auditField?: IAuditValues
  string?: string
  field?: string
  value?: string | number | boolean
  notFound?: Array<number>
  different?: Array<number>
  privilegeChange?: Array<number>
  adminChange?: Array<number>
  cannotChange?: Array<number>
}

enum EActionType {
  setClasses,
  attachFields,
  attachOptions,
  setSelectedClass,
  setNewField,
  deleteField,
  addSingleField,
  removeField,
  changeField,
  changeAsset,
  removeAsset,
  changeOption,
  removeSelectedOption,
  rootField,
  setAuditProblems,
}

const reducer = (state: Init, action: IActionType) => {
  switch (action.type){
    case EActionType.setClasses:
      return {...state, classes: action.classes.map(item => ({...item, fields: [], options: []}))}
    case EActionType.attachFields:
      return {...state, classes: state.classes.map(item => item.v_id === action.number ? {...item, fields: action.fields}: item)}
    case EActionType.attachOptions:
      return {...state, classes: state.classes.map(item => item.v_id === action.number ? {...item, options: action.options}: item)}
    case EActionType.setSelectedClass:
      return {...state, selectedClass: action.number, selectedFields: [], selectedOptions: ['']}
    case EActionType.addSingleField:
      let find = state.selectedFields.find(item => item.v_id === action.number)
      if (find.v_field === EFieldTypes.textbox) find.values[action.number2]=''
      else if (find.v_field === EFieldTypes.numericbox) find.values[action.number2]=0
      else if (find.v_field === EFieldTypes.selectbox) find.values[action.number2]=''
      else if (find.v_field === EFieldTypes.checkbox) find.values[action.number2]=true
      return {...state}
    case EActionType.removeField:
      let find2 = state.selectedFields.find(item => item.v_id === action.number)
      find2.values.length = action.number2
      return {...state}
    case EActionType.changeField:
      let find3 = state.selectedFields.find(item => item.v_id === action.number)
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
    case EActionType.setNewField:
      //@ts-ignore
      return {...state, selectedFields: ([...state.selectedFields, action.auditField]).sort((a, b) => a.v_order > b.v_order)}
    case EActionType.deleteField:
      return {...state, selectedFields: state.selectedFields.filter(item => item.v_id !== action.number)}
    case EActionType.changeAsset:
      if (action.number+1 >= state.assetTag.length)
      state.assetTag[action.number+1] = {number: '', notFound: false, different: false, privilegeChange: false, adminChange: false, cannotChange: false}
      state.assetTag[action.number] = {number: action.string, notFound: false, different: false, privilegeChange: false, adminChange: false, cannotChange: false}
      return {...state, assetTag: [...state.assetTag]}
    case EActionType.removeAsset:
      delete state.assetTag[action.number]
      return {...state, assetTag: state.assetTag.flat()}
    case EActionType.changeOption:
      if (state.selectedOptions.includes(action.string)) return state
      if (action.number+1 >= state.selectedOptions.length)
      state.selectedOptions[action.number+1] = ''
      state.selectedOptions[action.number] = action.string
      return {...state, selectedOptions: [...state.selectedOptions]}
    case EActionType.removeSelectedOption:
      delete state.selectedOptions[action.number]
      return {...state, selectedOptions: state.selectedOptions.flat()}
    case EActionType.rootField:
      return {...state, [action.field]: action.value}
    case EActionType.setAuditProblems:
      state.assetTag = state.assetTag.map(({number, notFound, different, privilegeChange, adminChange, cannotChange}) => ({number, notFound: false, different: false, privilegeChange: false, adminChange: false, cannotChange: false}))
      action.notFound.forEach(asset => {
        state.assetTag.forEach(assetObj => parseInt(assetObj.number) === asset && (assetObj.notFound = true))
      })
      action.different.forEach(asset => {
        state.assetTag.forEach(assetObj => parseInt(assetObj.number) === asset && (assetObj.different = true))
      })
      action.privilegeChange.forEach(asset => {
        state.assetTag.forEach(assetObj => parseInt(assetObj.number) === asset && (assetObj.privilegeChange = true))
      })
      action.adminChange.forEach(asset => {
        state.assetTag.forEach(assetObj => parseInt(assetObj.number) === asset && (assetObj.adminChange = true))
      })
      action.cannotChange.forEach(asset => {
        state.assetTag.forEach(assetObj => parseInt(assetObj.number) === asset && (assetObj.cannotChange = true))
      })  
      state.assetTag = state.assetTag.filter(item => (item.different === true || item.notFound === true || item.privilegeChange === true || item.adminChange === true || item.cannotChange === true) && item)
      state.assetTag[state.assetTag.length] = {number: '', different: false, notFound: false, privilegeChange: false, adminChange: false, cannotChange: false}
      return {...state}
    default: return state
  }
}


class Init{
  classes: Array<{
    v_id: number
    v_name: string
    fields: Array<IAuditValues>
    options: IGetValueVidVname['value']
  }> = []
  selectedClass: number = undefined
  selectedFields: Array<IAuditValues> = []
  selectedOptions: Array<string> = ['']
  assetTag: Array<{number: string, notFound: boolean, different: boolean, privilegeChange: boolean, adminChange: boolean, cannotChange: boolean}> = [{number: '', notFound: false, different: false, privilegeChange: false, adminChange: false, cannotChange: false}]
  quantity: string = '0'
  notes: string = '🔥'
  lockSubmitBtn = false

}
const Index = () => {

  const [state, dispatch] = useReducer(reducer, new Init())
  const {
    classes, 
    selectedClass, 
    selectedFields, 
    assetTag, 
    selectedOptions,
    quantity,
    notes,
    lockSubmitBtn
  } = state

  const {showWindow, showCustomWindow} = useContext(ModalsContext)
  const {showDialog} = useContext(DialogModalContext)

  const deleteField = useCallback((field: number) => {
    dispatch({type: EActionType.deleteField, number: field})
  }, [])
  const addField = useCallback((field: IAuditValues) =>{
    field.values = ['']
    dispatch({type: EActionType.setNewField, auditField: field})
  }, [])
  const changeAssetTag = useCallback((value: string, index: number) => {
    dispatch({type: EActionType.changeAsset, string: value, number: index})
  }, [])
  const changeOptions = useCallback((value: string, index: number) => {
    dispatch({type: EActionType.changeOption, string: value, number: index})
  }, [])
  const removeSelectedOption = useCallback((value: number) => {
    dispatch({type: EActionType.removeSelectedOption, number: value})
  }, [])
  const fillOptions = useCallback(() => {
    const classFound = classes.find(item => item.v_id === selectedClass)
    if (classFound !== undefined)
    return (selectedOptions.map((item, index) => <div key={index}>
      <style jsx>{`
      div{
        display: grid;
        grid-template-columns: 1fr auto;
      }
      `}</style>
      <Selectbox 
        //@ts-ignore
        valueSelected={item} 
        onChange={e => changeOptions(e.value, index)} 
        obj={classFound.options} 
        required={false}
        selectInfoText='---Options---'
      />
      {selectedOptions.length > 1 && selectedOptions.length > index+1 &&<Image 
        src='/pictures/minus.svg' 
        alt='remove'
        width='30px' 
        height='30px' 
        onClick={() => removeSelectedOption(index)}
      />}
    </div>))
    else return(<></>)
  }, [classes, selectedOptions, selectedClass, changeOptions, removeSelectedOption])
  const addSingleField = useCallback((vid: number, size: number) => {
    dispatch({type: EActionType.addSingleField, number: vid, number2: size})
  }, [])
  const removeField = useCallback((vid: number, size: number) => {
    dispatch({type: EActionType.removeField, number: vid, number2: size})
  }, [])
  const changeField = useCallback((value: string, vid: number, index: number) => {
    dispatch({type: EActionType.changeField, string: value, number: vid, number2: index})
  }, [])
  const getFieldsOptions = async (classVid: React.ChangeEvent<HTMLSelectElement>['target']) => {
    if (classVid.value !== ''){
      const vid = parseInt(classVid.value)
      let classFound = classes.find(item => item.v_id === vid)
      if (classFound.fields.length <= 0){
        const classFields: IValuesFromClass = await jFetch('class-manip/get-fields-from-class', 'POST', {vid: vid})
        if (classFields.success)
          dispatch({type: EActionType.attachFields, number: classFound.v_id, fields: classFields.value})
        const classOptions: IGetValueVidVname = await jFetch('class-manip/get-options-from-class', 'POST', {vid: vid})

        if (classOptions.success)
          dispatch({type: EActionType.attachOptions, number: classFound.v_id, options: classOptions.value})
        classFound.fields = classFields.value
        classFound.options = classOptions.value
      }
      dispatch({type: EActionType.setSelectedClass, number: vid})
    }
    else dispatch({type: EActionType.setSelectedClass, number: undefined})
    
  }
  const removeAsset = useCallback((index: number) => {
    dispatch({type: EActionType.removeAsset, number: index})
  }, [])

  const formBulkMove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await sendBulkMove()
  }
  const sendBulkMove = async (ask_to_change = false) => {
    dispatch({type: EActionType.rootField, field: 'lockSubmitBtn', value: true})//@ts-ignore
    const audits = [...new Set((assetTag.filter(item => item.number !== '')).map(item => parseInt(item.number)))]
    if (!(selectedFields.length > 0)) showCustomWindow('Info', 'You need to select fields to bulk change', EWindowType.info)
    else if (audits.length <= 0) showCustomWindow('Info', 'You need to select audits to be able to bulk change', EWindowType.info)
    else if (selectedClass > 0){      
      const options = selectedOptions.filter(item => item !== '').map(item => parseInt(item))
      const fields = selectedFields.map(({v_field, v_id, values}) => ({v_field, v_id, values}))
      //@ts-ignore
      const vclass = parseInt(selectedClass)
      
      const svrResp = await jFetch('audit/bulk-change', 'POST', {vclass, notes, quantity:parseInt(quantity), fields, options, audits, ask_to_change})
      
      if (ask_to_change === false && (svrResp.privilegeChange.length > 0 || svrResp.adminChange.length > 0)){
        showDialog('Alert', 'Some audits needs confirmation and others needs administrator privileges, do you want to confirm those changes?', EDialogWindowType.orange, () => sendBulkMove(true), 'Confirm', 'Cancel')
      }
      else showWindow(svrResp)
      if (svrResp.success){
        dispatch({type: EActionType.setAuditProblems, notFound: svrResp.notFound, different: svrResp.differentClass, privilegeChange: svrResp.privilegeChange, adminChange: svrResp.adminChange, cannotChange: svrResp.cannotChange})
      }
    }
    dispatch({type: EActionType.rootField, field: 'lockSubmitBtn', value: false})
  }

  useEffect(() => {
    const getClasses = async () => {
      const svrResp:IGetValueVidVname = await getFetch('class-manip/get-classes')
      if (svrResp.value){
        dispatch({type: EActionType.setClasses, classes: svrResp.value})
      }
      else showWindow(svrResp)
    }

    getClasses()
  },[showWindow])
  return (
    <form onSubmit={e => formBulkMove(e)} className='container'>
      <style jsx>{`

      section{
        display: inline-block;
      }
      .container{
        display: flex;
        align-items:flex-start;
        flex-wrap: wrap;
      }
      .window{
        margin: 8px;
      }
      .select-class, .options-container{
        display: flex;
        flex-direction: column;
        width: 170px;
      }
      .select-class > label{
        border-radius: var(--obj-border-radius);
        padding-left: 4px;
      }
      .select-class > label:hover{
        background-color: #B87333;
      }
      .select-class > label:active{
        background-color: #985333;
      }
      .select-class-container{
        display: flex;
        flex-direction: row;
      }
      .select-class-container > hr{
        margin: 0 6px;
      }
      .disable-label{
        pointer-events: none;
        color: #888;
      }
      .fields-selected{
        width: 340px;
      }
      .assets{
        width: 170px;
      }
      .asset-tags{
        display: flex;
        
      }
      .asset-tags > input{
        flex-grow: 1;
        flex-shrink: 1;
        width: 100px;
      }
      .assets-container{
        overflow-y: auto;
        max-height: calc(100vh - 100px);
      }
      .not-found{
        border-color: yellow;
      }
      .lbl-not-found{
        color: yellow;
      }
      .different{
        border-color: blue;
      }
      .lbl-different{
        color: blue;
      }
      .cannot-change{
        border-color: red;
      }
      .lbl-cannot-change{
        color: red;
      }
      .admin-change{
        border-color: fuchsia;
      }
      .lbl-admin-change{
        color: fuchsia;
      }
      .privilege-change{
        border-color: aqua;
      }
      .lbl-privilege-change{
        color: aqua;
      }
      @media screen and (max-width: 900px){
        .select-class, .fields-selected, .options-container{
          width: auto;
        }
        .select-class-container{
          flex-direction: column;
        }
        .select-class-container > hr{
          margin: 6px 0;
        }
      }
      `}</style>
      <Head>
        <title>Bulk Change</title>
      </Head>
      <section className='window window-alert'>
        <div className='select-class-container'>
          <div className='select-class'>
            <label>Class: </label>
            <Selectbox
              valueSelected={selectedClass}
              onChange={getFieldsOptions}
              obj={classes}
              selectInfoText='---Select a Class---'
            />
            <hr style={{margin: '6px 0'}} />
            <label className={quantity > '0' ? 'disable-label': '' } onClick={() => dispatch({type: EActionType.rootField, field: 'quantity', value: '1'})}>Quantity</label>
            <label className={notes !== '🔥' ? 'disable-label': '' } onClick={() => dispatch({type: EActionType.rootField, field: 'notes', value: ''})}>Notes</label>
            {classes.find(item => item.v_id === selectedClass) !== undefined &&
            (classes.find(item => item.v_id === selectedClass)).fields.map((item: IAuditValues) => 
              <Fragment key={item.v_id}>
                <label className={selectedFields.find(fieldItem => fieldItem.v_id === item.v_id) ? 'disable-label': ''} onClick={() => addField(item)}>{item.v_label}</label>
              </Fragment>
            )}
          </div>
          <hr />
          <div className='fields-selected'>
            <label>Fields Selected</label>
            <hr style={{margin: '6px 0'}} />
            <table>
              <tbody>
                {(parseInt(quantity) > 0 || quantity == '') && <tr>
                  <td><label onClick={() => dispatch({type: EActionType.rootField, field: 'quantity', value: '0'})}>Quantity: </label></td>
                  <td><input min='1' required type='number' onChange={e => dispatch({type: EActionType.rootField, field: 'quantity', value: e.target.value})} value={quantity} /></td>
                </tr> }
                {notes !== '🔥' && <tr>
                  <td><label onClick={() => dispatch({type: EActionType.rootField, field: 'notes', value: '🔥'})}>Notes: </label></td>
                  <td><textarea onChange={e => dispatch({type: EActionType.rootField, field: 'notes', value: e.target.value})} required value={notes} /></td>
                </tr> }
                <AuditStructure 
                  classFields={selectedFields}
                  deleteField={(e) => deleteField(e)}
                  addField={addSingleField}
                  removeField={removeField}
                  changeValue={changeField}
                />
              </tbody>
            </table>
          </div>
          <hr />
          <div className='options-container'>
            <label>Options/Issues</label>
            <hr style={{margin: '6px 0'}} />
            {fillOptions()}
          </div>
        </div>
      </section>
      <section className='assets window window-alert'>
        <header style={{display: 'flex', justifyContent: 'space-between'}}>
          <label>Audits: {assetTag.length - 1}</label>
          <AboutQMarkTag 
            helpText={<>
              <p><label className='lbl-privilege-change'>Confirm To Change</label></p>
              <p><label className='lbl-different'>Different Class</label></p>  
              <p><label className='lbl-admin-change'>Only Admin Modify</label></p>
              <p><label className='lbl-cannot-change'>Locked From Modify</label></p>
              <p><label className='lbl-not-found'>Not Found</label></p>
            </>} 
            width='20px'
            height='20px' 
          />
        </header>
        
        <hr style={{margin: '6px 0'}} />
        <div className='assets-container'>
          {assetTag.map((item, index) => 
            <div className='asset-tags' key={index}>
              <input 
                type="number" 
                value={item.number} 
                onChange={e => changeAssetTag(e.target.value, index)}
                placeholder='Enter Audit'
                className={item.notFound ? 'not-found': item.different ? 'different': item.privilegeChange ? 'privilege-change': item.adminChange ? 'admin-change' : item.cannotChange && 'cannot-change'}
              />
              {assetTag.length > 1 && assetTag.length > index+1 && <Image 
                src='/pictures/minus.svg' 
                alt='Remove Field'
                width='30px' 
                height='30px' 
                onClick={() => removeAsset(index)}
              />}
              <br />
            </div>
          )}
          <hr style={{margin: '6px 0'}} />
        </div>
        
        <LockSubmitButton 
          text='Submit' 
          loadingText='Chanding audits' 
          disabled={lockSubmitBtn} 
        />
      </section>
    </form>
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
    if(reqPermission.canAudit === true) return {props: {
      pass: true
    }};
    else return {notFound : true}
  })
  return value
}