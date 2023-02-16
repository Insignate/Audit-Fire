import React, { useState } from 'react'
import { LockSubmitButton } from '../../../components/buttons'


interface ICollection{
  addString: string
  addFunc: Function
  deleteFunc: Function
  inputFunc: Function
}

const Plant = ({addString, addFunc, deleteFunc, inputFunc}: ICollection) => {
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
      <label>Add Plant</label><br />
      <input onChange={e => inputFunc(e.target)} name="plantName" value={addString} required type="text" placeholder="New Plant" /><br />
      <LockSubmitButton text={'Create'} loadingText={'Adding Job...'} disabled={lockAddBtn} />   
    </form>
    <hr />
    <form onSubmit={e => deleteSubmit(e)}>
      <label>Remove Selected Plant</label><br />
      <LockSubmitButton text={'Delete'} loadingText={'Deleting Job...'} disabled={lockEditBtn} />
    </form>
  </div>
  )
}

export default Plant

export const getStaticProps = () => {
  return {notFound: true}
}