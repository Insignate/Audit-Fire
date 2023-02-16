import React, { useCallback, useState } from 'react'
import { EFieldChangeValue, IClassFieldsFn, IClassFieldsState } from '.'
import { LockSubmitButton } from '../../../components/buttons'
import Image from '../../../components/Image'
import Selectbox from '../../../components/Selectbox'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'
import { EFieldTypes } from '../../../utils/enums'
import { values } from '../../../utils/valueConfig'

interface IAddClassToFields{
  classList: IGetVidVname['success']
  fn: IClassFieldsFn
  data: IClassFieldsState
}

const AddFieldsToClass = ({classList, data, fn}: IAddClassToFields) => {
  const [lockCreateField, setLockCreateField] = useState<boolean>(false)
  const [lockOption, setLockOption] = useState<boolean>(false)
  const [optionBtn, setOptionBtn] = useState(undefined)
  const [optionId, setOptionId] = useState("")
  const [lockDelete, setLockDelete] = useState(false)

  const createField = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    setLockCreateField(true)
    e.preventDefault()
    await fn.createField()
    setLockCreateField(false)
  }, [fn])
  const addNewOption = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    setLockOption(true)
    e.preventDefault()
    await fn.addOptionToField()
    setLockOption(false)
  }, [fn])

  const addStyleOpenOptions = useCallback(async (e: React.MouseEvent<HTMLButtonElement, MouseEvent> , vid:string) => {
    fn.setOptionToAdd(vid)//@ts-ignore
    const btn = e.target.classList
    btn.add("btn-change-option")
    if (optionBtn !== undefined && optionId != vid)
      optionBtn.remove("btn-change-option")
    setOptionBtn(btn)
    setOptionId(vid)
    
  }, [optionBtn, optionId, fn])

  const removeOptionFromField = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    setLockDelete(true)
    e.preventDefault()
    await fn.deleteOptionFromField()
    setLockDelete(false)
  }, [fn])

  return (
    <section className='window window-attention'>
      <style jsx>{`
      .window{
        display: inline-block;
      }
      section{
        margin: 8px;
      }
      div.container{
        display: flex;
        flex-direction: row;
      }
      div.container > hr{
        margin: 0 6px;
      }
      hr{
        margin: 8px 0;
      }
      form > label{
        text-align: right;
      }
      header{
        margin-bottom: 5px;
      }
      input[type='checkbox']{
        width: 30px;
        height: 30px;
        margin: auto;
      }
      .class-fields{
        display: grid;
        grid-gap: 4px;
        grid-template-columns:100px 100px 70px 70px 70px 150px auto;
        margin: 4px 0;
      }
      .info-field{
        display: grid;
        grid-gap: 4px;
        grid-template-columns: 70px 90px auto;
        margin-top: 4px;
      }
      .info-field > label{
        align-self: center;
        text-align: right;
      }
      .box-type{
        display: grid;
        grid-gap: 4px;
        grid-template-columns: auto auto 84px;
        margin-top: 4px;
      }
      .box-type > label{
        align-self: center;
        text-align: right;
      }
      .showOnHover{
        position: relative;
      }
      
      .showOnHover > span{
        opacity: 0;
        transition: opacity var(--fast-transition);
        position: absolute;
        pointer-events: none;
        width: 120px;
      }
      .showOnHover:hover > span{
        opacity: 1;
      }
      @media screen and (max-width: 1270px){
        div.container{
          flex-direction: column;
        }
        div.container > hr{
          margin: 8px 0;
        }
      }

      `}</style>
      <div className='container'>
        <div>
          <header>
            <label>Select Class: </label>
            <Selectbox 
              valueSelected={data.selectedClass} 
              onChange={fn.getFieldsFromClass} 
              obj={classList}
              selectInfoText='--Select a Class--'
            />
          </header>
          <hr />
          <div className='class-fields'>
            <label>Label</label>
            <label>Box Type</label>
            <label>Order</label>
            <label>Entries</label>
            <label>Required</label>
            <label>Change</label> 
            <label>Delete</label>
          </div>
          {data.classFields.map(item => 
          <form className='class-fields' key={item.v_id} onSubmit={(e) => {
              fn.changeDeleteClassField(e)
            }}>
            <label>{item.v_label+':'}</label>
            {item.v_field === EFieldTypes.textbox ? 
              <input placeholder="example" /> : item.v_field === EFieldTypes.numericbox ? 
              <input type='number' placeholder='example' /> : item.v_field === EFieldTypes.selectbox ?
              <Selectbox
                required={false} 
                selectInfoText='Example+Data' 
                valueSelected={undefined} 
                onChange={() => {}}
                obj={item.v_fieldValues} /> : item.v_field === EFieldTypes.checkbox &&
              <input type='checkbox' />  
            }
            <input 
              required
              type='number' 
              min={values.minShort}
              max={values.maxShort}
              value={item.v_order} 
              onChange={e => fn.changeField(e.target.value, item.v_id, EFieldChangeValue.order)} 
            />
            <input 
              required
              type='number' 
              min={1}
              max={values.maxShort}
              value={item.v_max_entries}  
              onChange={e => fn.changeField(e.target.value, item.v_id, EFieldChangeValue.entries)}
            />
            <input 
              type='checkbox' 
              checked={item.v_required} 
              onChange={e => fn.changeField("0", item.v_id, EFieldChangeValue.required)}
            />
            
            <div>
              <button 
                id={String(item.v_id)} 
                name='change'>Change</button>
                {EFieldTypes.selectbox ===item.v_field && //@ts-ignore
                  <button onClick={(e) => addStyleOpenOptions(e, item.v_id)}>Options</button>
                }
            </div>
            <button id={String(item.v_id)} name='delete'>Delete</button>
          </form>)}
        </div>
        <hr />
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <div style={{position: 'relative', zIndex:'2', maxWidth: "210px"}}>
            <label style={{display: "block", margin: "4px 0 8px 0"}}>Add Fields To Class</label>
            <hr />
            <form onSubmit={e => createField(e)} style={{position: "sticky", top: '10px'}}>
              <div className='info-field'>
                <label>Name: </label>
                <input onChange={(e) => fn.changeAddField(e.target.value, 'fieldName')} value={data.fieldName} required />
                <div className='showOnHover'>
                  <Image src="/pictures/qmark.svg" alt="Name" width='30px' height='30px' verticalAlign='top' />
                  <span className='window window-lookup'>The <b>name</b> that will appear at the time of audit</span>
                </div>
                <label>Order: </label>
                <input onChange={(e) => fn.changeAddField(e.target.value, 'fieldOrder')} value={data.fieldOrder} type='number' min={values.minShort} max={values.maxShort} required />
                <div className='showOnHover'>
                  <Image src="/pictures/qmark.svg" alt="Order" width='30px' height='30px' verticalAlign='top' />
                  <span className='window window-lookup'>The <b>order</b> that this field should be placed for the auditer</span>
                </div>
                <label>Entries: </label>
                <input onChange={(e) => fn.changeAddField(e.target.value, 'fieldEntries')} value={data.fieldEntries} type='number' min='1' max={values.maxShort} required />
                <div className='showOnHover'>
                  <Image src="/pictures/qmark.svg" alt="Max Entires" width='30px' height='30px' verticalAlign='top' />
                  <span className='window window-lookup'>How many <b>entries</b> can be registered in this field</span>
                </div>
                <label>Required: </label>
                <input type='checkbox' onClick={(e) => fn.changeAddField('0' , 'fieldRequired')} />
                <div className='showOnHover'>
                  <Image src="/pictures/qmark.svg" alt="Name" width='30px' height='30px' verticalAlign='top' />
                  <span className='window window-lookup'>At the time of audit, the auditer will be <b>required</b> to enter a value</span>
                </div>
              </div>
              <hr />
              <label>Select A Box Type</label>
              <hr />{/*@ts-ignore*/}
              <div className='box-type' onChange={(e) => fn.changeAddField(e.target.value , e.target.type)}>
                <input type="radio" value={EFieldTypes.checkbox} name="tagSelection" id="checkbox" /> 
                <label htmlFor="checkbox">Check Box</label>
                <input type="checkbox" />
                <input type="radio" value={EFieldTypes.textbox} name="tagSelection" id="inputbox" /> 
                <label htmlFor="inputbox">Text Box </label>
                <input style={{width: "70px"}} />
                <input type="radio" value={EFieldTypes.selectbox} name="tagSelection" id="selectbox" />
                <label htmlFor="selectbox">Select Box</label>
                <select>
                  <option>Example 1</option>
                  <option>Example 2</option>
                  <option>Example 3</option>
                  <option>Example 4</option>
                </select>
                <input type="radio" value={EFieldTypes.numericbox} name="tagSelection" id="numeric" /> 
                <label htmlFor="numeric">Numeric Box</label>
                <input type="number" style={{width: "70px"}} defaultValue="0" />
              </div>
              <hr />
              <LockSubmitButton text={'Create'} loadingText={'Creating Field...'} disabled={lockCreateField} />
            </form>
          </div>
          <hr style={{margin: "0px 8px"}} />
          <div style={{position: "relative", zIndex: '1'}}>
            <form onSubmit={(e) => addNewOption(e)} style={{position: "sticky", top: "8px"}}>
              <label>Pre Set Record:</label><br />
              <input style={{margin: '6px 0'}} onChange={e => fn.changeMultyField(e.target.value)} value={data.multyNewName}/><br />
              <LockSubmitButton text={'Add'} loadingText={'Attaching...'} disabled={lockOption} /><br />
            </form>
            <hr />
            <form onSubmit={(e) => removeOptionFromField(e)}>
              <label>Delete Record:</label><br />
              <Selectbox 
                valueSelected={data.optionToDelete} 
                onChange={fn.setDeleteOption} 
                obj={ 
                  data?.classFields?.find(item => item.v_id == data?.selectedFieldOption) ? 
                  data.classFields.find(item => item.v_id == data.selectedFieldOption).v_fieldValues
                  : []}
                showHelper={data?.classFields?.find(item => item.v_id == data?.selectedFieldOption) ? true : false}
                selectInfoText='--Select an option--' 
                styling='margin: 6px 0'
              /><br />
              <LockSubmitButton text={'Delete'} loadingText={'Removing Option...'} disabled={lockDelete} />
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AddFieldsToClass

export const getStaticProps = () => {
  return {notFound: true}
}