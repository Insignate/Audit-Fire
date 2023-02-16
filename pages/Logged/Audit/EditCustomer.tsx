import React from 'react'
import { LockSubmitButton } from '../../../components/buttons'
import { IContactInfo } from '../../../schemas/inputValidation'
import { values } from '../../../utils/valueConfig'

const EditCustomer = ({
    contactEditInfo, 
    lockButton,
    inputChange,
    editCustomer
  }:{
    contactEditInfo: IContactInfo, 
    lockButton: boolean, 
    inputChange: Function,
    editCustomer: Function
  }) => {
  return (
    <form onSubmit={e => editCustomer(e)}>
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
        <caption>Edit Existing Customer</caption>
        <thead></thead>
        <tbody>
          <tr>
            <td><label htmlFor='name'>Name:</label></td>
            <td>
              <input 
                type="text"
                placeholder='Enter Name'
                id="name"
                value={contactEditInfo.name}
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
                value={contactEditInfo.address}
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
                value={contactEditInfo.city}
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
                value={contactEditInfo.state}
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
                value={contactEditInfo.country}
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
                value={contactEditInfo.zip}
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
                value={contactEditInfo.fName}
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
                value={contactEditInfo.lName}
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
                value={contactEditInfo.phone}
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
                value={contactEditInfo.cell}
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
                value={contactEditInfo.notes}
                onChange={e => inputChange(e.target)} 
                maxLength={500} 
              />
            </td>
          </tr>

        </tbody>
      </table>
      <LockSubmitButton text={'Change'} loadingText={'Editing Customer'} disabled={lockButton} />
      
    </form>
  )
}

export default EditCustomer

export const getStaticProps = () => {
  return {notFound: true}
}