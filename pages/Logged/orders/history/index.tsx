import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { Fragment, useCallback, useContext, useEffect, useReducer } from 'react'
import CompactView from '../../../../components/auditInfo/CompactView'
import { SelfLockSubmitButton } from '../../../../components/buttons'
import CustomerInfo from '../../../../components/customer/CustomerInfo'
import OrderInfo from '../../../../components/customer/OrderInfo'
import { LockForm } from '../../../../components/LockForm'
import Selectbox from '../../../../components/Selectbox'
import { IGetVidVname } from '../../../../database/postgres/jobRegistry/dbCom'
import RequesterInfo from '../../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../../schemas/dataValidation'
import { userTokenIdent } from '../../../../schemas/user'
import { IFullSingleOrderHistory, IGetRegCustomersNameId, IOrderHistory, IRegCustomerOnlyNameId, IValueBigIntArrayResp } from '../../../../tsTypes/psqlResponses'
import { getCookie } from '../../../../utils/customCookies'
import { formatDateTimeUs } from '../../../../utils/dateTimeFormat'
import { getFetch, jFetch } from '../../../../utils/fetchs'
import { ModalsContext } from '../../../../utils/Modals'
import { ICustomerInfo } from '../editOrder'

interface IAct{
  type: EAct,
  field?: string,
  value?: string | number | boolean | Array<number> | Array<Date>,
  setRegCustomers?: IGetRegCustomersNameId['value']
  orderHistory?: IFullSingleOrderHistory['values']
  number?: number
  orderHistoryFound?: Array<Date>
  ordersFound?: Array<number>
}

enum EAct {
  rootField,
  rootSearchCustomer,
  setInitRegCustomers,
  pushOrderHistory,
  setOrdersFound,
  setOrderHistory,
  setCustomerOrders
}

const reducer = (state: Init, action: IAct) => {
  switch (action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    case EAct.rootSearchCustomer:
      return {...state, searchCustomer: {...state.searchCustomer, [action.field]: action.value}}
    case EAct.setInitRegCustomers:
      return {...state, regCustomers: action.setRegCustomers}
    case EAct.pushOrderHistory:
      const found = state.orderHistory.find(item => 
        item.dt_modified === action.orderHistory.dt_modified
      )
      if (found === undefined)
        return {...state, orderHistory: [...state.orderHistory, action.orderHistory], historyMode: true}
      return state
    
    case EAct.setCustomerOrders:
      return {...state, ordersFound: action.ordersFound}
    case EAct.setOrderHistory:
      return {...state, orderHistoryFound: action.orderHistoryFound, selectedOrderId: action.number, orderHistory: []}
    default: return state
  }
}
class Init{
  searchCustomer: ICustomerInfo = {
    fname: '',
    mname: '',
    lname: '',
    phone: '',
    cell: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    notes: ''
  }
  regCustomers: Array<IRegCustomerOnlyNameId> = []
  sbSvrPaymentStatus: IGetVidVname['success'] = []
  sbSelectedPaymentStatus = 0
  
  sbSvrOrderStatus: IGetVidVname['success'] = []
  sbSelectedOrderStatus = 0

  ordersFound: Array<string> = []
  orderHistoryFound: Array<Date> = []

  selectedOrderId = 0

  orderHistory: Array<IFullSingleOrderHistory['values']> = []

  historyMode = false;
}

const History = () => {

  const [state, dispatch] = useReducer(reducer, new Init)
  const {showWindow} = useContext(ModalsContext)
  const { 
    searchCustomer,
    regCustomers,
    sbSelectedPaymentStatus,
    sbSvrPaymentStatus,
    sbSvrOrderStatus,
    sbSelectedOrderStatus,
    ordersFound,
    orderHistoryFound,
    selectedOrderId,
    orderHistory,
    historyMode,
  } = state

  const svrSearchCustomer = useCallback(async () => {
    const search = {...searchCustomer, zip: parseInt(searchCustomer.zip)}
    const svrResp: IGetRegCustomersNameId = await jFetch('orders/search-customers-only-name', 'POST', {...search})
    if(svrResp.success)
      dispatch({type: EAct.setInitRegCustomers, setRegCustomers: svrResp.value})
    else dispatch({type: EAct.setInitRegCustomers, setRegCustomers: []})
  }, [searchCustomer])

  const svrSearchOrderPayStatus = useCallback(async () => {
    const svrResp:IValueBigIntArrayResp = await jFetch('orders/search-order-pay-status', 'POST', {v_id: sbSelectedPaymentStatus})
    if (svrResp.success)
      dispatch({type: EAct.rootField, field: 'ordersFound', value: svrResp.value})
    else dispatch({type: EAct.rootField, field: 'ordersFound', value: []})
  }, [sbSelectedPaymentStatus])

  const svrSearchOrderStatus = useCallback(async () => {
    const svrResp:IValueBigIntArrayResp = await jFetch('orders/search-order-status', 'POST', {v_id: sbSelectedOrderStatus})
    if (svrResp.success)
      dispatch({type: EAct.rootField, field: 'ordersFound', value: svrResp.value})
    else dispatch({type: EAct.rootField, field: 'ordersFound', value: []})
  }, [sbSelectedOrderStatus])

  const svrSearchCustomerOrder = useCallback(async (value: number) => {
    const svrResp:IValueBigIntArrayResp = await jFetch('orders/search-customer-orders', 'POST', {v_id: value})
    if (svrResp.success)
      dispatch({type: EAct.setCustomerOrders, ordersFound: svrResp.value})
    else dispatch({type: EAct.setCustomerOrders, ordersFound: []})
  }, [])

  const svrGetOrderHistory = useCallback(async (order_id: number) => {
    const svrResp: IOrderHistory = await jFetch('orders/get-order-history', 'POST', {v_id: order_id})
    if (svrResp.success)
      dispatch({type: EAct.setOrderHistory, orderHistoryFound: svrResp.values, number: order_id})
    else{
      dispatch({type: EAct.rootField, field: 'orderHistoryFound', value: []})
      showWindow(svrResp)
    } 
  }, [showWindow])

  const svrGetSingleOrderHistory = useCallback(async (datetime: Date) => {
    const svrResp: IFullSingleOrderHistory = await jFetch('orders/get-single-full-order-history', 'POST', {v_id: selectedOrderId, datetime})
    if (svrResp.success){
      dispatch({type: EAct.pushOrderHistory, orderHistory: {...svrResp.values, dt_modified: datetime}})
    }
    else showWindow(svrResp)
  }, [selectedOrderId, showWindow])

  useEffect(() => {
    const getSvrPaymentStatus = async () => {
      const svrResp = await getFetch('orders/get-payment-status')
      if (svrResp.success)
        dispatch({type: EAct.rootField, field: 'sbSvrPaymentStatus', value: svrResp.value})
      else showWindow(svrResp)
    }
    const getRegOrderAudit = async () => {
      const svrResp = await getFetch('orders/get-reg-permissions')
      if (svrResp.success){
        const value = svrResp.value.map(({v_name, v_id}) => ({v_name, v_id}))
        dispatch({type: EAct.rootField, field: 'sbSvrOrderStatus', value})
      }
      else showWindow(svrResp)
    }
    getSvrPaymentStatus()
    getRegOrderAudit()
  }, [showWindow])

  return (
    <div className='root-div'>
      <style jsx>{`
      .root-div{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }
      
      .order-info > hr{
        margin-bottom: 6px;
      }
      .search-container{
        display: inline-flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: flex-start;
        max-width: 700px;
        transition: opacity var(--fast-transition) linear 0.2s, max-width var(--fast-transition);
        
      }
      .slide-root-div{
        opacity: 0;
        max-width: 0;    
        max-height: 0;   
        transition-delay: 0ms;
      }
      .customer-search-window{
        display: flex;
      }
      .search-section{
        max-height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        max-width: 314px;
      }
      .search-found{
        max-height: 100vh;
        display: flex;
        overflow-y: auto;
        flex-direction: column;
      }
      .search-found > div{
        max-height: calc(100vh - 34px);
      }
      .searched-customer{
        width: 163px;
        margin: 6px;
        word-break: break-all;
      }
      .search-section > div{
        margin: 6px;
      }
      .button-single-customer{
        border: solid 1px white;
        text-wrap: wrap;
        word-break: break-word;
        padding: 4px;
        border-radius: 4px;
        margin: 2px 0;
      }
      .customer-search-window > hr{
        margin: 0 6px;
      }
      .searched-buttons{
        max-height: calc(100vh - 70px);
        overflow-y: auto;
      }

      .order-info{
        display: inline-block;
        margin: 6px;
        
      }
      .order-dates > div > *{
        transition: opacity var(--fast-transition);
      }
      .order-dates{
        transition: top var(--fast-transition);
      }
      .order-dates > div{
        transition: max-height var(--fast-transition);
      }
      .full-order{
        max-height: 100vh;
        overflow-y: auto;
      }
      @media screen and (max-width: 860px){
        .order-dates{
          position: fixed;
          top: -40px;
          left: 50px;
        }
        .full-order{
          max-height: none;
        }
        .order-dates > div{
          max-height: 50px;
          pointer-events: none;
        }
        .order-dates:hover > div{
          max-height: 100vh;
          pointer-events: auto;
          transition
        }
        .order-dates:hover, .order-dates:hover > div > *{
          top: 0px;
          opacity: 1;
        }
        .order-dates > div > *{
          opacity: 0;
        }
        .full-order{
          margin-top: 50px;
        }
      }
      `}</style>
      <Head>
        <title>Order History</title>
      </Head>
      <div className={`search-container ${historyMode === true && 'slide-root-div'}`}>
        <section className='search-section' >
          <div className='window window-lookup customer-search-window'>
            <LockForm 
              formItems={<>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <label style={{whiteSpace: 'nowrap'}}>Search Customer</label>
              </div>
              <div >
                <hr style={{margin: '6px 0'}} />
                <table>
                  <tbody>
                    <tr>
                      <td><label htmlFor="sfname">First Name: </label></td>
                      <td><input onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'fname', value: e.target.value})} value={searchCustomer.fname} id='sfname' placeholder='Enter First Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="smname">Middle Name:</label></td>
                      <td><input onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'mname', value: e.target.value})} value={searchCustomer.mname} id='smname' placeholder='Enter Middle Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="slname">Last Name:</label></td>
                      <td><input onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'lname', value: e.target.value})} value={searchCustomer.lname} id='slname' placeholder='Enter Last Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sphone">Phone:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'phone', value: e.target.value})} value={searchCustomer.phone} id='sphone' placeholder='Enter Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="scell">Cell:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'cell', value: e.target.value})} value={searchCustomer.cell} id='scell' placeholder='Enter Cell Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="saddress">Address:</label></td>
                      <td><input onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'address', value: e.target.value})} value={searchCustomer.address} id='saddress' placeholder='Enter Address' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sCity">City:</label></td>
                      <td><input onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'city', value: e.target.value})} value={searchCustomer.city} id='sCity' placeholder='Enter City' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sState">State:</label></td>
                      <td><input onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'state', value: e.target.value})} value={searchCustomer.state} id='sState' placeholder='Enter State' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sCountry">Country:</label></td>
                      <td><input onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'country', value: e.target.value})} value={searchCustomer.country} id='sCountry' placeholder='Enter Country' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="szip">Zip:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'zip', value: e.target.value})} value={searchCustomer.zip} id='szip' placeholder='Enter Zip' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sNotes">Notes:</label></td>
                      <td><textarea onChange={e => dispatch({type: EAct.rootSearchCustomer, field: 'notes', value: e.target.value})} value={searchCustomer.notes} style={{maxWidth: '140px'}} id='sNotes' placeholder='Enter Notes' /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </>} 
              submitHandler={svrSearchCustomer} 
              windowType={'none'} 
              style=''  
              btnText='Search'
              btnLoadingText='Searching...'
            />
          </div>
          <div className='window window-lookup'>
            <label>Order Status</label>
            <hr style={{margin: '6px 0'}} />
            <LockForm 
              formItems={<>
                <Selectbox 
                  valueSelected={sbSelectedOrderStatus} 
                  onChange={e => dispatch({type: EAct.rootField, field: 'sbSelectedOrderStatus', value: parseInt(e.value)})} 
                  obj={sbSvrOrderStatus} 
                  selectInfoText='---Select an Order Status---'
                />
              </>} 
              submitHandler={svrSearchOrderStatus} 
              windowType={'none'} 
              style=''
              btnText='Search'
              btnLoadingText='Searching...'
            />
          </div>
          <div className='window window-lookup'>
            <label>Order Payment Status</label>
            <hr style={{margin: '6px 0'}} />
            <LockForm 
              formItems={<>
                <Selectbox 
                  valueSelected={sbSelectedPaymentStatus} 
                  onChange={e => dispatch({type: EAct.rootField, field: 'sbSelectedPaymentStatus', value: parseInt(e.value)})} 
                  obj={sbSvrPaymentStatus} 
                  selectInfoText='---Select an Order Status---'
                />
              </>} 
              submitHandler={svrSearchOrderPayStatus} 
              windowType={'none'} 
              style=''
              btnText='Search'
              btnLoadingText='Searching...'
            />
          </div>
        </section>
        <section className='search-found'>
          <div className='window window-lookup searched-customer' >
            <label>Customer Found</label>
            <hr style={{margin: '6px 0'}} />
            <div className='searched-buttons'>
              {regCustomers.map(({id, fname, mname, lname}) => 
                <SelfLockSubmitButton 
                  key={id}
                  text={fname + ' ' + mname + ' ' + lname}
                  loadingText={'🔍: '+fname + ' ' + mname + ' ' + lname}
                  onClick={svrSearchCustomerOrder} 
                  args={id}
                  styling='width: 100%;'
                />
              )}
            </div>
          </div>
        </section>
        <section className='search-found'>
          <div className='window window-lookup searched-customer' >
            <label>Orders Found</label>
            <hr style={{margin: '6px 0'}} />
            <div className='searched-buttons'>
              {ordersFound.map(item => 
                <SelfLockSubmitButton 
                  styling='width: 100%;'
                  key={item}
                  text={item}
                  loadingText={'🔍: '+item}
                  onClick={() => svrGetOrderHistory(parseInt(item))} 
                />
              )}
            </div>
          </div>
        </section>
      </div>
      <div style={{display: 'flex'}}>
        <section className={`'search-found ${historyMode === true && 'order-dates'}`}>
          <div className='window window-lookup searched-customer' >
            <label>Order History </label>
            <button
              onClick={() => dispatch({type: EAct.rootField, field: 'historyMode', value: false})}  
            >{'>>'}</button>
            <hr style={{margin: '6px 0'}} />
            <div className='searched-buttons'>
              {orderHistoryFound.map(item => {
                const {date, time} = formatDateTimeUs(item)
                return <SelfLockSubmitButton 
                  styling='width: 100%;'
                  key={item.toString()}
                  text={<Fragment>{date}<br />{time}</Fragment>}
                  loadingText={'🔍: '+item}
                  onClick={() => svrGetSingleOrderHistory(item)} 
                />
              })}
            </div>
          </div>
        </section>
        <section className='full-order'>
          {orderHistory.map(({customer, ship_to, order, audits, dt_modified}) => 
            <Fragment key={dt_modified.toString()}>
              <div className='window window-read order-info'>
                <OrderInfo headerMessage='Order Info' dt_modified={dt_modified} order={order} />
                <hr />
                <CustomerInfo 
                  headerMessage='Customer'
                  customer={customer} />
                <hr />
                <CustomerInfo 
                  headerMessage='Ship To'
                  customer={ship_to}/>
                <hr />
                <label>Audits in this order</label>
                <hr style={{margin: '0'}} /> 
                {audits.map(({audit_id, order_qtt, price, notes, class_name, fields, options}) => 
                  <CompactView 
                    key={audit_id}
                    audit_id={audit_id} 
                    order_qtt={0}
                    price={price}  
                    qtt_audit={order_qtt} 
                    notes={notes} 
                    class_name={class_name} 
                    quantity={order_qtt} 
                    fields={fields} 
                    options={options}
                    showCommands={false}
                  />
                )}
              </div>
            </Fragment>
          )}
        </section>
      </div>
    </div>
  )
}

export default History


export const getServerSideProps = async ({req, res} : {req: NextApiRequest, res: NextApiResponse}) => {

  const value = await nextValidateLoginHeader(userTokenIdent, req, res, async () => {
    const {token, ident} = getCookie(req)
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissions(ident, token)
    
    if(reqPermission.canLogin !== true ) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canOrderHistory === true) return {props: {
      check: true
    }};
    else return {notFound : true}
  })
  return value
}