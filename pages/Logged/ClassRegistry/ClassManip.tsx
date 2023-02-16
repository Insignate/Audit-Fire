import React, { useMemo, useState } from 'react'
import { IClassFunctions, IClassState } from '.'
import { LockSubmitButton } from '../../../components/buttons'
import Selectbox from '../../../components/Selectbox'

interface IClass{
  data: IClassState
  functions: IClassFunctions
}

const Class = ({data, functions}: IClass) => {
  const [addBtn, setAddBtn] = useState<boolean>(false)
  const [removeBtn, setRemoveBtn] = useState<boolean>(false)
  const addClass = async (e: React.FormEvent<HTMLFormElement>) => {
    setAddBtn(true)
    e.preventDefault()
    await functions.addClass()
    setAddBtn(false)
  }
  const removeClass = async (e: React.FormEvent<HTMLFormElement>) => {
    setRemoveBtn(true)
    e.preventDefault()
    await functions.deleteClass()
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
        <label>Class Registry</label>
      </header>
      <hr />
      <form onSubmit={e => addClass(e)}>
        <label htmlFor="">New Class</label><br />
        {useMemo(() => <input 
          value={data.inputNewName}
          style={{margin: "6px 0"}} 
          required 
          type="text" 
          placeholder='Enter new class' 
          onChange={e => functions.inputChangeAdd(e.target)}
        />, [data.inputNewName, functions])}<br />
        <LockSubmitButton 
          text='insert' 
          loadingText='Adding Class...'
          disabled={addBtn}
        />
      </form>
      <hr />
      <form onSubmit={(e) => removeClass(e)}>
        <label htmlFor="">Delete Class</label><br />
        <Selectbox 
          valueSelected={data.selToDelete} 
          onChange={functions.deleteSelectChange} 
          obj={data.reg}
          styling='margin: 6px 0' 
          selectInfoText="--Select a class--"
        /><br />
        <LockSubmitButton 
          text='Delete' 
          loadingText='Deleting Class...' 
          disabled={removeBtn} 
        />
      </form>
    </section>
  )
}

export default Class

export const getStaticProps = () => {
  return {notFound: true}
}