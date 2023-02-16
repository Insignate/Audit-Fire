import React, { useState } from 'react'
import { LockSubmitButton } from '../../../components/buttons'
import Selectbox from '../../../components/Selectbox'


interface ICollection{
  addString: string
  addFunc: Function
  deleteFunc: Function
  inputFunc: Function
  optionsToRemove: Array<{v_id: number, v_name: string}> 
  removeSelected: number
  removeChangeFunc: Function

}

const Services = ({addString, addFunc, deleteFunc, inputFunc, optionsToRemove, removeSelected, removeChangeFunc}: ICollection) => {
  const [lockAddBtn, setLockAddBtn] = useState(false)
  const [lockRemoveBtn, setLockRemoveBtn] = useState(false)

  const addSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLockAddBtn(true)
    e.preventDefault()
    await addFunc()
    setLockAddBtn(false)
  }

  const deleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLockRemoveBtn(true)
    e.preventDefault()
    await deleteFunc()
    setLockRemoveBtn(false)
  }

  return (
  <div>
    <style jsx>{`
    form{
      width: fill-available;
    }
    form input, form select{
      width: fill-available;
    }
    div{
      display: flex;
      flex-direction: column;
    }
    hr{
      margin: 6px 0;
    }
    input, select{
      margin: 6px 0;
      width: fill-available;
    }
    @media screen and (max-width: 930px){
      div{
        flex-direction: row;
      }
      hr{
        margin: 0 6px;
      }
    }
    `}</style>
    <form onSubmit={e => addSubmit(e)}>
      <label>Add Service</label><br />
      <input onChange={e => inputFunc(e.target)} name="plantName" value={addString} required type="text" placeholder="New Plant" /><br />
      <LockSubmitButton text={'Create'} loadingText={'Adding Job...'} disabled={lockAddBtn} />   
    </form>
    <hr />
    <form onSubmit={e => deleteSubmit(e)}>
      <label>Remove Service</label><br />
      <Selectbox 
        valueSelected={removeSelected} //@ts-ignore
        onChange={removeChangeFunc} 
        selectInfoText={'---Select Service---'} 
        styling={`width: -moz-available; width: -webkit-fill-available; width: fill-available; margin: 6px 0;`} 
        obj={optionsToRemove} 
        
      />
      <LockSubmitButton text={'Delete'} loadingText={'Deleting Service...'} disabled={lockRemoveBtn} />
    </form>
  </div>
  )
}

export default Services

export const getStaticProps = () => {
  return {notFound: true}
}