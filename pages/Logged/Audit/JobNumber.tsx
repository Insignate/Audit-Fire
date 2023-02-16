import React, { useState } from 'react'
import { LockSubmitButton } from '../../../components/buttons'

interface ICollection{
  collection: {
    add: string
    addDate: string
  }
  addFunc: Function
  deleteFunc: Function
  inputFunc: Function
}

const JobNumber = ({collection, addFunc, deleteFunc, inputFunc}: ICollection) => {
  const [lockAddBtn, setLockAddBtn] = useState(false)
  const [lockEditBtn, setLockEditBtn] = useState(false)
  
  const addSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLockAddBtn(true)
    e.preventDefault()
    await addFunc()
    setLockAddBtn(false)
  }

  const deleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLockEditBtn(true)
    e.preventDefault()
    await deleteFunc()
    setLockEditBtn(false)
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
      input{
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
        <label>Add Job Number</label><br />
        <input onChange={e => inputFunc(e.target)} name="add" value={collection?.add} required type="text" placeholder="New Job Name" /><br />
        <label>Date</label><br />
        <input onChange={e => inputFunc(e.target)} name="addDate" value={collection?.addDate} required type="date" /><br />
        <LockSubmitButton text={'Create'} loadingText={'Adding Job...'} disabled={lockAddBtn} />   
      </form>
      <hr />
      <form onSubmit={e => deleteSubmit(e)}>
        <label>Remove form</label><br />
        <label>Selected Job Number</label><br />
        <LockSubmitButton text={'Delete'} loadingText={'Deleting Job...'} disabled={lockEditBtn} />
      </form>
    </div>
  )
}

export default JobNumber

export const getStaticProps = () => {
  return {notFound: true}
}