import React, { useMemo, useState } from 'react'
import {IOptionFunctions, IOptionState } from '.'
import { LockSubmitButton } from '../../../components/buttons'
import Selectbox from '../../../components/Selectbox'

interface IOptions{
  data: IOptionState
  functions: IOptionFunctions
}

const OptionManip = ({data, functions}: IOptions) => {
  const [addBtn, setAddBtn] = useState<boolean>(false)
  const [removeBtn, setRemoveBtn] = useState<boolean>(false)

  const addOption = (e: React.FormEvent<HTMLFormElement>) => {
    setAddBtn(true)
    e.preventDefault()
    functions.addOption()
    setAddBtn(false)
  }
  const removeOption = (e: React.FormEvent<HTMLFormElement>) => {
    setRemoveBtn(true)
    e.preventDefault()
    functions.deleteOption()
    setRemoveBtn(false)
  }

  return (
    <section className='window window-attention'>
      <style jsx>{`
      section{
        display: inline-block;
        margin: 8px;
        vertical-align: top;
      }
      header{
        margin-bottom: 6px;
      }
      hr{
        margin-top: 6px;
      }
      `}</style>
      <header>
        <label>Options Registry</label>
      </header>
      <hr />
      <form onSubmit={e => addOption(e)}>
        <label htmlFor="">New Option</label><br />
        {useMemo(() => <input 
          value={data.inputNewOption}
          style={{margin: "6px 0"}} 
          required 
          type="text" 
          placeholder='Enter new option' 
          onChange={e => functions.inputChangeAdd(e.target)}
        />, [data.inputNewOption, functions])}<br />
        <LockSubmitButton 
          text='insert' 
          loadingText='Adding Option...'
          disabled={addBtn}
        />
      </form>
      <hr />
      <form onSubmit={(e) => removeOption(e)}>
        <label htmlFor="">Delete Option</label><br />
        {useMemo(() => <Selectbox 
          valueSelected={data.selToDelete} 
          onChange={functions.deleteSelectChange} 
          obj={data.reg}
          styling='margin: 6px 0' 
          selectInfoText="--Select a option--"
        />, [data.selToDelete, data.reg, functions.deleteSelectChange])}<br />
        <LockSubmitButton 
          text='Delete' 
          loadingText='Deleting Option...' 
          disabled={removeBtn} 
        />
      </form>
    </section>
  )
}

export default OptionManip

export const getStaticProps = () => {
  return {notFound: true}
}