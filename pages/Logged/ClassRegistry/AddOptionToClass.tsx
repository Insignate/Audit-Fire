import React, { useMemo, useState } from 'react'
import {IAddOptionToClassFunc, IAddOptionToClassState, IClassState, IOptionState } from '.'
import { LockSubmitButton } from '../../../components/buttons'
import Selectbox from '../../../components/Selectbox'

interface IOptions{
  classItems: IClassState['reg']
  optionItems: IOptionState['reg']
  data: IAddOptionToClassState
  functions: IAddOptionToClassFunc
}

const AddOptionsToClass = ({data, classItems, optionItems, functions}: IOptions) => {
  const [addBtn, setAddBtn] = useState<boolean>(false)
  const [removeBtn, setRemoveBtn] = useState<boolean>(false)
  const addOption = async (e: React.FormEvent<HTMLFormElement>) => {
    setAddBtn(true)
    e.preventDefault()
    await functions.addItem()
    setAddBtn(false)
  }
  const removeOption = async (e: React.FormEvent<HTMLFormElement>) => {
    setRemoveBtn(true)
    e.preventDefault()
    await functions.deleteItem()
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
        <label>Combine Option to Class</label>
      </header>
      <hr />
      <form onSubmit={e => addOption(e)}>
        <label htmlFor="">Select Class</label><br />
        {useMemo(() => <Selectbox 
          valueSelected={data.selectedClass} //@ts-ignore
          onChange={functions.changeClass} 
          obj={classItems} 
          selectInfoText='---Select Class---'
          styling='margin: 6px 0' 
        />, [data.selectedClass, classItems,functions.changeClass])}<br />
        <label>Add Option To Class</label> <br />
        {useMemo (() => <Selectbox 
          valueSelected={data.selectedOption} //@ts-ignore
          onChange={functions.changeOption} 
          obj={optionItems} 
          selectInfoText='---Select Option---'
          styling='margin: 6px 0;' 
        />, [data.selectedOption, optionItems, functions.changeOption])}<br />
        <LockSubmitButton 
          text='Combine' 
          loadingText='Combing...'
          disabled={addBtn}
        />
      </form>
      <hr />
      <form onSubmit={(e) => removeOption(e)}>
        <label htmlFor="">Delete Option From Class</label><br />
        {useMemo(() => <Selectbox 
          valueSelected={data.selectedClassOptions} //@ts-ignore
          onChange={functions.changeOptionFromClass} 
          obj={data.regOptionsToClass}
          styling='margin: 6px 0' 
          selectInfoText="--Select a option--"
        />, [data.regOptionsToClass, data.selectedClassOptions, functions.changeOptionFromClass])}<br />
        <LockSubmitButton 
          text='Delete' 
          loadingText='Deleting Option...' 
          disabled={removeBtn} 
        />
      </form>
    </section>
  )
}

export default AddOptionsToClass

export const getStaticProps = () => {
  return {notFound: true}
}