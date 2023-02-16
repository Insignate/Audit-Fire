import React from 'react'
import { LockSubmitButton } from '../../../components/buttons'
import Selectbox from '../../../components/Selectbox'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'

const RegisterSalesman = ({salesman, 
    selectedSalesman, 
    employees, 
    onChange, 
    onChangeRemove, 
    valueSelected, 
    newSalesman, 
    removeSalesman,
    btnRegisterSalesman,
    btnRemoveSalesman
  }: {
    salesman: IGetVidVname["success"]
    selectedSalesman: number
    employees: IGetVidVname["success"]
    onChange: Function
    onChangeRemove: Function
    valueSelected: number
    newSalesman: Function
    removeSalesman: Function
    btnRegisterSalesman: boolean
    btnRemoveSalesman: boolean
  }) => {
  return (
    <div>
      <style jsx>{`
      form{
        width: fill-available;
      }
      form input, form select{
        width: fill-available;
      }
      hr, input, select{
        margin: 6px 0;
      }
      div{
        display: flex;
        flex-direction: column;
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
      <form onSubmit={e => newSalesman(e)}>
        <label>Register Salesman</label><br />
        <Selectbox 
          valueSelected={valueSelected}//@ts-ignore
          onChange={onChange}
          selectInfoText={'---Select An Employee---'}
          obj={employees} 
          styling={`width: -moz-available; width: -webkit-fill-available; width: fill-available; margin: 6px 0;`}
        />
        <br />
        <LockSubmitButton text={'Register'} loadingText={'Registering Salesman'} disabled={btnRegisterSalesman} />
      </form>
      <hr />
      <br />
      <form onSubmit={e => removeSalesman(e)}>
        <label>Remove Salesman</label><br />
        <Selectbox 
          valueSelected={selectedSalesman} //@ts-ignore
          onChange={onChangeRemove} 
          selectInfoText={'---Select A Salesman---'} 
          styling={`width: -moz-available; width: -webkit-fill-available; width: fill-available; margin: 6px 0;`} 
          obj={salesman} />
        <br />
        <LockSubmitButton text={'Remove'} loadingText={'Removing Salesman'} disabled={btnRemoveSalesman} />
      </form>
    </div>
  )
}

export default RegisterSalesman

export const getStaticProps = () => {
  return {notFound: true}
}