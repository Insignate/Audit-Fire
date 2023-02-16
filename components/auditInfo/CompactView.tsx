import Link from 'next/link'
import React, { Fragment } from 'react'
import CurrencyInput from 'react-currency-input-field'

export interface ICompactAuditInfo{
  audit_id: number
  order_qtt: number
  price?: number | string
  qtt_all_orders?: number
  qtt_audit: number
  notes: string
  class_name: string
  quantity?: string | number
  fmv?: string
  fmvChange?: string
  fnFmvChange?: (audit_id: number, value: string) => void
  fields: Array<{
    field_name: string
    vvalues: Array<string>
  }>
  options: Array<string>
  fnFieldClick?: (fieldHeader: string, value: string) => void
  changeOrderValue?: (audit_id: number, value: string) => void
  changePriceValue?: (audit_id: number, value: string) => void
  removeAudit?: (audit_id: number) => void
  addAudit?: (audit_id: number) => void
  isAdding?: boolean
  isRemoving?: boolean
  showCommands?: boolean
  order_id?: Array<number>
  can_edit?: boolean
  can_orders?: boolean
}


const CompactView = ({
audit_id, 
qtt_all_orders = undefined, 
order_qtt, 
quantity = '🔥', 
qtt_audit, 
price = '🔥', 
class_name, 
fields,
options = null,
fmv = '🔥',
fmvChange = '🔥',
fnFmvChange = () => {},
notes,
changeOrderValue = () => {},
changePriceValue = () => {},
fnFieldClick = () => {},
removeAudit = undefined,
addAudit = undefined,
isAdding = false,
isRemoving = false,
showCommands = true,
order_id = [],
can_edit= false,
can_orders = false
} : ICompactAuditInfo) => {
  return (
    <>
      <style jsx>{`
      .audit-container > .audit-container-fields{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }
      .audit-container > .audit-container-fields > div{
        text-align: center;
        margin: 4px;
        display: flex;
        flex-wrap: wrap;
        
      }
      .audit-container-fields input, .price > p > input{
        width: 40px;
      }
      .audit-container > div > div > div > p:first-of-type > label{
        color: var(--table-header);
      }
      .audit-container > div > div{
        margin: 4px;
      }
      .audit-container > div > div > div{
        margin: 0 4px;
      }
      .audit-container{
        display: flex;
        flex-direction: row;
        border-bottom: solid 2px;
        transition: background-color var(--fast-transition);
        border-radius: var(--obj-border-radius);
        justify-content: space-between;
      }
      .center-button{
        display: block;
        width: 100%;
      }
      .hide-commands{
        display: none;
      }
      .audit-options-container{
        min-width: 100px;
      }
      .audit-options-container a{
        text-align: center;
      }

      `}</style>
      <div className={`audit-container hover-container ${isAdding && 'adding-container' || isRemoving && 'removing-container'}`}>
        <div className='audit-container-fields'>
          <div>
            <div>
              <p><label>Audit</label></p>
              <p><label>{audit_id}</label></p>
            </div>
            {qtt_all_orders != undefined && <div>
              <p><label>Stock</label></p>
              <p><label>{qtt_audit - qtt_all_orders + order_qtt - parseInt(quantity.toString())}</label></p>
            </div>}
            {quantity.toString() !== '🔥' && <div>
              <p><label>Order</label></p>
              <p><input 
                required
                className='order'
                type='text'
                value={quantity} 
                onChange={e => changeOrderValue(audit_id, e.target.value)}
                pattern='[1-9][0-9]{0,15}'
              /></p>
            </div>}
            {price !== '🔥' &&<div className='price'>
              <p><label>Price</label></p>
              <p><CurrencyInput
                placeholder='Price'
                value={price}
                decimalsLimit={2}
                onValueChange={e => changePriceValue(audit_id, e)}
                prefix='$'
                maxLength={15}
              /></p>
            </div>}
            {fmvChange !== '🔥' && <div className='price'>
              <p><label>fmv</label></p>
              <p><CurrencyInput
                placeholder='Price'
                value={fmvChange}
                decimalsLimit={2}
                onValueChange={e => fnFmvChange(audit_id, e)}
                prefix='$'
                maxLength={15}
              /></p>
            </div>}
            {fmv !== '🔥' && <div>
              <p><label>Fmv</label></p>
              <p><label>{fmv}</label></p>
            </div>}
            <div>
              <p><label>Class</label></p>
              <p><label>{class_name}</label></p>
            </div>
          </div>
          <div>
            {fields.map(({field_name, vvalues}) => 
              <div key={field_name}>
                <p><label>{field_name}</label></p>
                {vvalues.map((item: string, index: number) => 
                  <p 
                    key={index}
                    onClick={() => fnFieldClick(field_name, item)}
                  >
                    <label>{item}</label>
                  </p>)}
              </div>
            )}
            {notes.length > 0 &&<div>
              <p><label>Notes</label></p>
              <p><label>{notes}</label></p>
            </div>}
            {options !== null && <div>
              <p><label>Issues</label></p>
              {options !== null && options.map((item: string, index2: number) => 
                <p key={index2}><label>{item}</label></p>
              )}
            </div>}
          </div>
        </div>
        
        <div className={`${showCommands === false && 'hide-commands '}` + ' audit-options-container'}>
          <div>
            <fieldset>
              <legend>Options</legend>
              {removeAudit !== undefined && <p><button 
                className={`center-button ${isRemoving && 'btn-removing'}`}
                type='button'
                onClick={() => removeAudit(audit_id)}
              >X</button></p>}
              {addAudit !== undefined &&<p><button
                onClick={() => addAudit(audit_id)}
                className={`center-button ${isAdding && 'btn-adding'}`}
                type='button'
              >+</button></p>}
              {can_orders === true ?       
                order_id.map(item => 
                  <li key={item} className='link-button'>
                    <Link href={'orders/editOrder/' + item}>
                      <a>Order #: {item}</a>  
                    </Link>
                  </li>)
                : order_id.map(item => <label key={item}>Order #: {item}</label>)}
              {can_edit === true &&   
                <li className='link-button'>
                  <Link href={'editAudit/' + audit_id}>
                    <a>Edit Audit</a>
                  </Link>
                </li>}
            </fieldset>
          </div>
        </div>
      </div>
    </>
  )
}

export default CompactView

export const getStaticProps = () => {
  return {notFound: true}
}