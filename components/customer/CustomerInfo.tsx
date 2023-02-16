import React, { Fragment } from 'react'
import { IFullSingleOrderHistory } from '../../tsTypes/psqlResponses'

interface ICustomerInfo{
  headerMessage: string
  customer:{
    first_name: string
    middle_name: string
    last_name: string
    phone: string
    cell: string
    address: string
    city: string
    state: string
    zip: number
    country: string
    notes: string
  }
}

const CustomerInfo = ({headerMessage, customer}: ICustomerInfo) => {
  return (
    <div>
      <style jsx>{`
      .customer-container{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }
      .customer-container > div{
        display: flex;
        flex-direction: column;
        max-width: 150px;
        word-break: break-all;
        padding: 3px 0;
        margin: 0 6px 0 0;
        transition: background-color var(--fast-transition);
      }
      .customer-container > div > label:first-of-type{
        color: var(--table-header);
      }

      `}</style>
      
      <label>{headerMessage}</label>
      <hr />
      <div className='customer-container'>
        <div className='hover-color'>
          <label>First Name</label>
          <label>{customer.first_name}</label>
        </div>
        <div className='hover-color'>
          <label>Middle Name</label>
          <label>{customer.middle_name}</label>
        </div>
        <div className='hover-color'>
          <label>Last Name </label>
          <label>{customer.last_name}</label>
        </div>
        <div className='hover-color'>
          <label>Address</label>
          <label>{customer.address}</label>
        </div>
        <div className='hover-color'>  
          <label>City</label>
          <label>{customer.city}</label>
        </div>
        <div className='hover-color'>
          <label>State</label>
          <label>{customer.state}</label>
        </div>
        <div className='hover-color'>
          <label>Zip</label>
          <label>{customer.zip}</label>
        </div>
        <div className='hover-color'>
          <label>Country</label>
          <label>{customer.country}</label>
        </div>
        <div className='hover-color'>
          <label>Notes</label>
          <label>{customer.notes}</label>
        </div>

      </div>
    </div>
  )
}

export default CustomerInfo


export const getStaticProps = () => {
  return {notFound: true}
}