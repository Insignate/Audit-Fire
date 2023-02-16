import React from 'react'
import { LockSubmitButton } from '../../../components/buttons'

interface IJobName{
  addNewJobName: Function
  editJobName: Function
  inputChange: Function
  vJobName: string
  vEditJobName: string
  lockAddBtn: boolean
  lockEditBtn: boolean
}

const JobName = ({addNewJobName, editJobName, inputChange, vJobName, vEditJobName, lockAddBtn, lockEditBtn}: IJobName) => {
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
      <form onSubmit={e => addNewJobName(e)}>
        <label htmlFor="jobName">Add New Job Name</label><br />
        <input required onChange={e => inputChange(e)} value={vJobName} name="jobName" placeholder="Enter New Job Name" /><br />
        <LockSubmitButton text={'Insert'} loadingText={'Adding Job'} disabled={lockAddBtn} />
      </form>
      <hr />
      <form onSubmit={e => editJobName(e)}>
        <label htmlFor="editJobName">Edit Job Name</label><br />
        <input required onChange={e => inputChange(e)} value={vEditJobName} name="editJobName" placeholder="Change Selected Job Name" /><br />
        <LockSubmitButton text={'Change'} loadingText={'Editing Job'} disabled={lockEditBtn} />
      </form>
    </div>
  )
}

export default JobName

export const getStaticProps = () => {
  return {notFound: true}
}