import React from 'react'
import { LockSubmitButton } from '../../../components/buttons'
import { IContactInfo } from '../../../schemas/inputValidation'
import { values } from '../../../utils/valueConfig'



const RegisterCustomer = ({
      contactInfo, 
      lockButton,
      inputChange,
      registerNewCustomer
    } : 
      {contactInfo: IContactInfo, 
        lockButton: boolean, 
        inputChange: Function,
        registerNewCustomer: Function}) => 
  {
  
  return (
    <form onSubmit={e => registerNewCustomer(e)}>
      <style jsx>{`
      table td:first-of-type{
        text-align: right;
      }
      hr{
        margin: 6px 0;
      }
      @media screen and (max-width: 930px){
        table{
          width: -webkit-fill-available;
          width: -moz-available;
        }
      }
      `}</style>
      <table>
        <caption>Create New Customer</caption>
        <thead></thead>
        <tbody>
          <tr>
            <td><label htmlFor='name'>Name:</label></td>
            <td>
              <input 
                type="text"
                placeholder='Enter Name'
                id="name"
                value={contactInfo.name}
                onChange={e => inputChange(e.target)}
                required
                minLength={4}
                maxLength={100}
              />
            </td>
          </tr>
          <tr>
            <td><label>Address:</label></td>
            <td>
              <input 
                type="text" 
                placeholder='Enter Address'
                id="address"
                value={contactInfo.address}
                onChange={e => inputChange(e.target)}
                maxLength={100}
              />
            </td>
          </tr>
          <tr>
            <td><label>City:</label></td>
            <td>
              <input 
                type="text" 
                placeholder='Enter City'
                id="city"
                value={contactInfo.city}
                onChange={e => inputChange(e.target)}
                maxLength={50}
              />
            </td>
          </tr>
          <tr>
            <td><label>State:</label></td>
            <td>
              <input 
                type="text" 
                placeholder='Enter State'
                id="state"
                value={contactInfo.state}
                onChange={e => inputChange(e.target)}
                maxLength={80}
              />
            </td>
          </tr>
          <tr>
            <td><label>Country:</label></td>
            <td>
              <input 
                type="text"
                placeholder='Enter Country'
                id="country"
                value={contactInfo.country}
                onChange={e => inputChange(e.target)}
                maxLength={100}
              />
            </td>
          </tr>
          <tr>
            <td><label>Zip:</label></td>
            <td>
              <input 
                type="number"
                placeholder='Enter Zip Code' 
                id="zip"
                value={contactInfo.zip}
                onChange={e => inputChange(e.target)}
                maxLength={values.maxInt}
              />
            </td>
          </tr>
          <tr><td colSpan={2}><hr /></td></tr>
          <tr>
            <td>Contact Info</td>
          </tr>
          <tr><td colSpan={2}><hr /></td></tr>
          <tr>
            <td><label>First Name:</label></td>
            <td>
              <input 
                type="text" 
                placeholder='Enter First Name'
                id="fName"
                value={contactInfo.fName}
                onChange={e => inputChange(e.target)}
                maxLength={40}
              />
            </td>
          </tr>
          <tr>
            <td><label>Last Name:</label></td>
            <td>
              <input 
                type="text" 
                placeholder='Enter Last Name'
                id="lName"
                value={contactInfo.lName}
                onChange={e => inputChange(e.target)}
                maxLength={40}
              />
            </td>
          </tr>
          <tr>
            <td><label>Phone:</label></td>
            <td>
              <input 
                type="text" 
                placeholder='Enter Phone'
                id="phone"
                value={contactInfo.phone}
                onChange={e => inputChange(e.target)}
                maxLength={15}
              />
            </td>
          </tr>
          <tr>
            <td><label>Cell:</label></td>
            <td>
              <input 
                type="text" 
                placeholder='Enter Cellphone'
                id="cell"
                value={contactInfo.cell}
                onChange={e => inputChange(e.target)}  
              />
              </td>
          </tr>
          <tr>
            <td><label>Notes:</label></td>
            <td>
              <textarea 
                placeholder='Enter the notes' 
                id="notes"
                value={contactInfo.notes}
                onChange={e => inputChange(e.target)} 
                maxLength={500} 
              />
            </td>
          </tr>

        </tbody>
      </table>
      <LockSubmitButton text={'Create'} loadingText={'Creating Customer'} disabled={lockButton} />
      
    </form>
  )
}

export default RegisterCustomer

export const getStaticProps = () => {
  return {notFound: true}
}