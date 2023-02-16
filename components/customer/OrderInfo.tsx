import React from 'react'
import CurrencyInput from 'react-currency-input-field'
import { formatDateTimeUs } from '../../utils/dateTimeFormat'

interface IOrder{
  headerMessage: string
  dt_modified: Date
  order: {
    paid: number
    order_status_name: string
    order_payment_status: string
    datetime: Date
    notes: string
  }
}

const OrderInfo = ({headerMessage, order, dt_modified}: IOrder) => {
  const {date: dateMod, time: timeMod} = formatDateTimeUs(dt_modified);
  const {date: datePlace, time: timePlace} = formatDateTimeUs(order.datetime)
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
          <label>Date Time Placed</label>
          <label>{datePlace + ' ' + timePlace}</label>
        </div>
        <div className='hover-color'>
          <label>Date Time Modified</label>
          <label>{dateMod + ' ' + timeMod}</label>
        </div>
        <div className='hover-color'>
          <label>Order Status</label>
          <label>{order.order_status_name}</label>
        </div>
        <div className='hover-color'>
          <label>Payment Status</label>
          <label>{order.order_payment_status}</label>
        </div>
        <div className='hover-color'>  
          <label>Amount Paid</label>
          <CurrencyInput
            placeholder='Price'
            value={order.paid}
            decimalsLimit={2}
            onValueChange={() => {}}
            prefix='$'
            maxLength={15}
            style={{width: '80px'}}
          />
        </div>
        <div className='hover-color'>
          <label>Notes</label>
          <label>{order.notes}</label>
        </div>
      </div>
    </div>
  )
}

export default OrderInfo