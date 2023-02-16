import React, { Fragment, ReactElement, useCallback } from 'react'
import { IGetVidVname } from '../../database/postgres/jobRegistry/dbCom'
import { IAuditValues } from '../../pages/Logged/Audit/inAudit/[vid]'
import { IGetValueVidVname, IValuesFromClass } from '../../tsTypes/psqlResponses'
import { EFieldTypes } from '../../utils/enums'
import { jFetch } from '../../utils/fetchs'
import Image from '../Image'
import Selectbox from '../Selectbox'
import AuditStructure from './AuditStructure'

export interface IAuditBasic {
  quantity?: number | string
  notes: string
  selectedClass: number
  jobId: number
  name: string
  date: string
  reserved?: number
  auditer?: string
  editer?: string
  styling?: string
  
}
export enum EAuditBaseActionType {
  setClassFields = 1000,
  setOptions,
  removeOption,
  changeOption,
  changeField,
  removeField,
  addField,
  changeBaseField,
  removeDisplayingHistory
}
interface IBaseAudit{
  classes: IGetVidVname['success']
  selectedOptions: Array<any>
  dispatch: Function
  basicInfo: IAuditBasic
  activeClassFields: Array<IAuditValues>
  options: IGetVidVname['success']
  modifiable?: boolean
  closable?: boolean
  styling?: string
  commands?: ReactElement<any, any>
}
const AuditBase = (
{
  classes, 
  selectedOptions, 
  dispatch, 
  basicInfo, 
  activeClassFields, 
  options, 
  modifiable = true, 
  closable = false,
  styling = '',
  commands
}: IBaseAudit) => {

  const getClassFields = useCallback(async (vid: number) => {
    const fields:IValuesFromClass = await jFetch('class-manip/get-fields-from-class', 'POST',{vid})
    if (fields.value){
      const addValues = fields.value.map(item => item.v_field === EFieldTypes.textbox ? 
        {...item, values: ['']} : item.v_field === EFieldTypes.checkbox ?
        {...item, values: []}: item.v_field === EFieldTypes.numericbox ?
        {...item, values: ['']}: item.v_field === EFieldTypes.selectbox && 
        {...item, values: ['']})
      dispatch({type: EAuditBaseActionType.setClassFields, classFields: addValues, number: vid})
    }
  }, [dispatch])
  const getOptions = useCallback(async (vid: number) => {
    const options:IGetValueVidVname = await jFetch('class-manip/get-options-from-class', 'POST', {vid})
    if (options.value){
      dispatch({type: EAuditBaseActionType.setOptions, vidName: options.value})
    }
  }, [dispatch])
  const changeField = useCallback((value: string, vid: number, index: number) => {
    dispatch({type: EAuditBaseActionType.changeField, string: value, number: vid, number2: index})
  }, [dispatch])
  const addField = useCallback((vid: number, size: number) => {
    dispatch({type: EAuditBaseActionType.addField, number: vid, number2: size})
  }, [dispatch])
  const removeField = useCallback((vid: number, size: number) => {
    dispatch({type: EAuditBaseActionType.removeField, number: vid, number2: size})
  }, [dispatch])
  const getFieldsFromClass = useCallback(async (e: EventTarget & HTMLSelectElement) => {
    const vid = parseInt(e.value)
    if (!isNaN(vid)){
      getClassFields(vid)
      getOptions(vid)
    }
  }, [getClassFields, getOptions])
  const changeOption = useCallback((value: string, index: number, length: number) => {
    dispatch({type: EAuditBaseActionType.changeOption, number: parseInt(value), number2: index, number3: length})
  }, [dispatch])
  const removeOption = useCallback((value: number) => {
    dispatch({type: EAuditBaseActionType.removeOption, number: value})
  }, [dispatch])
  const changeBaseField = useCallback((name: string, value: string) => {
    dispatch({type: EAuditBaseActionType.changeBaseField, string: value, name: name})
  }, [dispatch])
  const closeWindow = useCallback((date: string) => {
    dispatch({type: EAuditBaseActionType.removeDisplayingHistory, date})
  }, [dispatch])
  
  return (
    <div className='audit-data'>
      <style jsx>{`
      header>label{
        width: fill-available;
      }
      header>button{
        width: 52px;
        border: solid 0px;
        height: 20px;
        padding: 0;
        background-color: var(--btn-audit-close);
      }
      header>button:hover{
        background-color: var(--btn-audit-hover-close);
      }
      header>button:active{
        background-color: var(--btn-audit-active-close);
      }
      table tr td:nth-child(1){
        text-align: right;
      }
      .audit-data{
        display: flex;
        ${styling}
      }
      .audit-data > hr{
        margin: 0 6px;
      }
      .audit-options{
        max-width: 174px;
      }
      .audit-options-commands{
        display: flex;
      }
      .audit-options-commands > hr{
        margin: 0 6px;
      }
      
      @media screen and (max-width: 770px){
        .audit-options-commands{
          flex-direction: column;
        }
        .audit-options-commands > hr{
          margin: 6px 0;
        }
      }
      @media screen and (max-width: 610px){
        .audit-data{
          flex-direction: column;
        }
        .audit-data > hr{
          margin: 6px 0;
        }
        .audit-options{
          max-width: 460px;
        }
      }
      `}</style>
      <div>
        <header style={{display: 'flex'}}>
          <label style={{textAlign: 'center'}}>Audit</label>
          {closable && <button onClick={() => closeWindow(basicInfo.date)}>X</button>}
        </header>
        
        <hr style={{margin: '6px 0'}} />
        <table className='audit-table audit-size'>
          <tbody>
            {basicInfo.auditer !== undefined && <tr>
              <td>Auditer:</td>
              <td>{basicInfo.auditer}</td>
              <td></td>
            </tr>}
            {basicInfo.editer !== undefined && <tr>
              <td>Editer:</td>
              <td>{basicInfo.editer}</td> 
              <td></td> 
            </tr>}
            <tr>
              <td>Class:</td>
              <td>
                <Selectbox 
                  valueSelected={basicInfo.selectedClass} 
                  onChange={getFieldsFromClass} 
                  obj={classes} 
                  selectInfoText='---Select a Class---'
                />
              </td>
            </tr>
            {basicInfo.quantity !== undefined && <tr>
              <td>Quantity: </td>
              <td>
                <input 
                  value={basicInfo.quantity}
                  onChange={e => changeBaseField(e.target.name, e.target.value)}
                  type='number' 
                  name='quantity'
                  required
                  min={1}
                />
              </td>
              <td></td>
            </tr>}
            {basicInfo.reserved !== undefined && <tr>
              <td>Reserved:</td>
              <td>
                <input value={basicInfo.reserved} readOnly />
              </td>
              <td></td>
            </tr>}
            <AuditStructure 
              classFields={activeClassFields} 
              addField={addField} 
              removeField={removeField} 
              changeValue={changeField} 
              modifiable={modifiable} 
            />
            <tr>
              <td>Notes: </td>
              <td>
                <textarea 
                  value={basicInfo.notes} 
                  onChange={e => changeBaseField(e.target.name, e.target.value)}
                  name='notes'
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <hr />
      <div className='audit-options-commands'>
        <div className='audit-options'>
          <div style={{position: 'sticky', top: '4px'}}>
            <label>Options/Issues</label>
            <hr style={{margin: '6px 0'}} />
  
            {selectedOptions.map((item, index) => <Fragment key={index}>
            <Selectbox 
              
              valueSelected={item} 
              onChange={e => changeOption(e.value, index, selectedOptions.length)} 
              obj={options} 
              selectInfoText='--Select Option--'
              required={false}
              styling={'max-width: 140px'}
            /><br /></Fragment>)}
            
            {modifiable && selectedOptions.length > 1 && <Image 
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
        {modifiable === true && <><hr />
        <div>
          <div style={{position: 'sticky', top: '4px'}}>
            <label>Commands</label>
            <hr style={{margin: '6px 0'}} />
            {/* <LockSubmitButton text={'Edit Audit'} loadingText={'Editing Audit...'} disabled={lockUnlockSubmit} /><br /> */}
            {commands}
          </div>
        </div></>}
      </div>
    </div>
  )
}
export default AuditBase


export const getStaticProps = () => {
  return {notFound: true}
}