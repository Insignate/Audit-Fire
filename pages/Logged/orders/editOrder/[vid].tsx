import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import CurrencyInput from 'react-currency-input-field'
import AuditBase, { EAuditBaseActionType, IAuditBasic } from '../../../../components/AuditFields/AuditBase'
import CompactView from '../../../../components/auditInfo/CompactView'
import { SelfLockSubmitButton } from '../../../../components/buttons'
import Selectbox from '../../../../components/Selectbox'
import { IGetVidVname } from '../../../../database/postgres/jobRegistry/dbCom'
import { getSingleOrderInfo } from '../../../../database/postgres/orders/dbCom'
import RequesterInfo from '../../../../permissions/requester'
import { validateNextQuery } from '../../../../schemas/dataValidation'
import { vCheckIntVid } from '../../../../schemas/inputValidation'
import { IAuditsFound, IFullOrder, IGetValueVidVname, IUISingleAuditSearched } from '../../../../tsTypes/psqlResponses'
import { EFieldTypes } from '../../../../utils/enums'
import { getFetch, jFetch } from '../../../../utils/fetchs'
import { DialogModalContext, EDialogWindowType } from '../../../../utils/ModalDialog'
import { EWindowType, ModalsContext } from '../../../../utils/Modals'
import { IAuditValues } from '../../Audit/inAudit/[vid]'

enum EAct {
  rootField,
  init,
  changeQuantity,
  changePrice,
  setClasses,
  setSearchedAudits,
  changeSearchedPrice,
  changeSearchedOrder,
  removeOrderAudit,
  addSearchedAudit,
  recalculateOrderTotal
}
enum ESearchType{
  full,
  class
}
enum ESearchComposition{
  new,
  add
}

interface IAct{
  classFields?: Array<IAuditValues>
  number2?: number
  type: EAct | EAuditBaseActionType
  field?: string
  value?: string | number | boolean
  paid?: number
  orderStatus?: number
  orderPayStatus?: number
  notes?: string
  number?: number
  string?: string
  audits?: IFullOrder['audits']
  vidName?: IGetValueVidVname['value']
  name?: string
  multiAudits?: Array<IUISingleAuditSearched>
}

const reducer = (state: Init, action: IAct) => {
  switch(action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    case EAct.init:
      return {...state, 
        sbSelectedOrderStatus: action.orderStatus,
        sbSelectedOrderPayStatus: action.orderPayStatus,
        tbPricePaid: action.paid,
        tbNotes: action.notes,
        audits: action.audits.map(item => ({...item, quantity: item.order_qtt}))
      }
    case EAct.changeQuantity:
      const pass = state.audits.find(item => item.audit_id === action.number) 
      const value = parseInt(action.string)
      if (value >= 1 && value <= (pass.qtt_audit - pass.qtt_all_orders + pass.order_qtt))
        return {...state, audits: state.audits.map(item => 
          item.audit_id === action.number ? {...item, quantity: value} : item)}
      else if (action.string === '')
        return {...state, audits: state.audits.map(item => 
          item.audit_id === action.number ? {...item, quantity: 0}: item) }
      return state;
    case EAct.changeSearchedOrder:
      const vpass = state.auditsFound.find(item => item.audit === action.number) 
      const vvalue = parseInt(action.string)
      if (vvalue >= 1 && vvalue <= vpass.max_qtt)
        return {...state, auditsFound: state.auditsFound.map(item => 
          item.audit === action.number ? {...item, order: vvalue} : item)}
      else if (action.string === '')
        return {...state, auditsFound: state.auditsFound.map(item => 
          item.audit === action.number ? {...item, order: 0}: item) }
      return state;
    case EAct.changePrice:
      return {...state, audits: state.audits.map(item => 
        item.audit_id === action.number ? {...item, price: action.string === undefined ? '0' : action.string} : item) }
    case EAct.changeSearchedPrice:
      return {...state, auditsFound: state.auditsFound.map(item => 
        item.audit === action.number ? {...item, price: action.string === undefined ? '0' : action.string} : item) }
    case EAct.setClasses:
      return {...state, classes: action.vidName}
    case EAct.setSearchedAudits:
      if (state.searchComposition === ESearchComposition.add && state.auditsFound.length > 0)
      {
        const newArray = ([...state.auditsFound])
        for (let x of action.multiAudits){
          
          let found = state.auditsFound.find(item => x.audit === item.audit)
          if(found === undefined) newArray.push(x)
        }
        return {...state, auditsFound: newArray}
      } 
      return {...state, auditsFound: action.multiAudits} //default new case
    case EAuditBaseActionType.setClassFields:
        return {...state, 
          activeClassFields: action.classFields.map(item => ({...item, v_max_entries: item.v_field === 1 ? 1 : 6, v_required: false})), 
          auditBasicInfo: {...state.auditBasicInfo, 
            selectedClass: action.number,
          },
          selectedOptions: [0]}
    
    case EAuditBaseActionType.removeField:
      let find2 = state.activeClassFields.find(item => item.v_id === action.number)
      find2.values.length = action.number2
      return {...state}
    case EAuditBaseActionType.changeField:
      let find3 = state.activeClassFields.find(item => item.v_id === action.number)
      if (find3.v_field === EFieldTypes.textbox) find3.values[action.number2] = action.string 
      else if (find3.v_field === EFieldTypes.selectbox){
        const value = parseInt(action.string)
        if (!isNaN(value))
        find3.values[action.number2] = value
        else find3.values[action.number2] = ''
      }
      else if (find3.v_field === EFieldTypes.numericbox){
        const value = parseFloat(action.string)
        if (!isNaN(value))
          find3.values[action.number2] = value.toFixed(2)
        else find3.values[action.number2] = ''
      }
      else if (find3.v_field === EFieldTypes.checkbox){
        find3.values[action.number2] = action.string
      }
      return {...state}
    case EAuditBaseActionType.addField:
      let find = state.activeClassFields.find(item => item.v_id === action.number)
      if (find.v_field === EFieldTypes.textbox) find.values[action.number2]=''
      else if (find.v_field === EFieldTypes.numericbox) find.values[action.number2]=0
      else if (find.v_field === EFieldTypes.selectbox) find.values[action.number2]=''
      else if (find.v_field === EFieldTypes.checkbox) find.values[action.number2]=true
      return {...state}
    case EAuditBaseActionType.changeBaseField:
      if (action.name === 'quantity'){
        const parsedVal = parseInt(action.string)
        if (!isNaN(parsedVal))
          return {...state, auditBasicInfo: {...state.auditBasicInfo, quantity: parsedVal}}
        else return {...state, auditBasicInfo: {...state.auditBasicInfo, quantity: ''}}
      }
      else if (action.name === 'notes')
        return {...state, auditBasicInfo: {...state.auditBasicInfo, notes: action.string}}
      return state
    case EAuditBaseActionType.setOptions:
      return {...state, options: action.vidName, selectedOptions: [0]}
      
    case EAct.removeOrderAudit:
      return {...state, audits: state.audits.map(item => item.audit_id == action.number ? ({...item, removeFromAudit: !item.removeFromAudit}): item)}
    case EAct.addSearchedAudit:
      return {...state, auditsFound: state.auditsFound.map(item => item.audit == action.number ? ({...item, add_to_audit: !item.add_to_audit}): item)}
    case EAct.recalculateOrderTotal:
      let orderSearchTotal = 0;
      let auditSearchTotal = 0;
      state.auditsFound.forEach(item => {
        if (item.add_to_audit === true) orderSearchTotal += parseFloat(item.price)
      })
      state.audits.forEach(item => {//@ts-ignore
        if (item.removeFromAudit === false) auditSearchTotal += parseFloat(item.price)
      })
      return {...state, orderTotal: (orderSearchTotal + auditSearchTotal).toFixed(2)}
    default: return state
    }
}

class Init{
  tbPricePaid = '0'

  sbSelectedOrderStatus = 0
  sbSvrOrderStatus: IGetVidVname['success'] = []
  sbSelectedOrderPayStatus = 0
  sbSvrPaymentStatus: IGetVidVname['success'] = []

  audits: IFullOrder['audits'] = []

  tbNotes = ''
  selectedOptions = []

  classes: IGetValueVidVname['value'] = []
  auditBasicInfo: IAuditBasic = {
    notes: '',
    selectedClass: 0,
    jobId: 0,
    name: '',
    date: ''
  }
  activeClassFields: Array<IAuditValues> = []
  searchType: ESearchType = ESearchType.full
  searchComposition: ESearchComposition = ESearchComposition.new

  auditsFound: Array<IUISingleAuditSearched> = []

  orderTotal = 0
}
const EditOrder = ({vid, orderInfo}: {vid: number, orderInfo: IFullOrder}) => {

  const {showCustomWindow, showWindow} = useContext(ModalsContext)
  const {showDialog} = useContext(DialogModalContext)
  const [state, dispatch] = useReducer(reducer, new Init)
  const router = useRouter()
  const {tbPricePaid, 
    sbSelectedOrderStatus,
    sbSvrOrderStatus,
    sbSelectedOrderPayStatus,
    sbSvrPaymentStatus,
    tbNotes,
    audits,
    classes,
    auditBasicInfo,
    activeClassFields,
    searchType,
    searchComposition,
    selectedOptions,
    auditsFound,
    orderTotal
  } = state

  const {customer_info, ship_to, order_info, audits: _audits} = orderInfo;

  const datePlaced = useMemo(() => new Date(order_info.datetime),[order_info.datetime])
  const newDatePlaced = useMemo(() => `
    ${datePlaced.getMonth()+1}/${datePlaced.getDate()}/${datePlaced.getFullYear()} - 
    ${datePlaced.getHours().toString().padStart(2, '0')}:${datePlaced.getMinutes().toString().padStart(2, '0')}:${datePlaced.getSeconds().toString().padStart(2, '0')}`,[datePlaced])
  const dateModified = useMemo(() => new Date(order_info.datetime_modified),[order_info.datetime_modified])
  const newDateModified = useMemo(() => `
    ${dateModified.getMonth()+1}/${dateModified.getDate()}/${dateModified.getFullYear()} - 
    ${dateModified.getHours().toString().padStart(2, '0')}:${dateModified.getMinutes().toString().padStart(2, '0')}:${dateModified.getSeconds().toString().padStart(2, '0')}`,[dateModified])
  const searchAudits = useCallback(async () => {

    const fieldsToSearch = []
    activeClassFields.forEach(item => {
      const newElement = []
      item.values.forEach(element => {
        if (element !== '' &&  item.v_field !== EFieldTypes.selectbox) newElement.push(element) 
        else if (item.v_field === EFieldTypes.selectbox && element !== 0 && element !== '') newElement.push(element)
      })
      if (newElement.length > 0) fieldsToSearch.push({v_id: item.v_id, field_id: item.v_field, fields: newElement})
    })
    const options = []
    selectedOptions.forEach(item => {
      if (item !== 0) options.push(item)
    })
    if(fieldsToSearch.length > 0){
      const svrResp:IAuditsFound = await jFetch('orders/search-audits', 'POST', {search: fieldsToSearch, options, classId: searchType === ESearchType.class ? auditBasicInfo.selectedClass : 0})
      if (svrResp.success){
        const multiAudits: Array<IUISingleAuditSearched> = svrResp.value.map((item : IUISingleAuditSearched) => 
          ({...item, order: item.qtt_available, 
            max_qtt: item.qtt_available, 
            price: '0',
            add_to_audit: false
          }))
        dispatch({type: EAct.setSearchedAudits, multiAudits})
      }//@ts-ignore
      else showWindow(svrResp)
    }
    else showCustomWindow('Info', 'You need to enter data for at least 1 field, To search for every available item, enter % in any text field', EWindowType.info)
    
  }, [activeClassFields, selectedOptions, searchType, auditBasicInfo.selectedClass, showWindow, showCustomWindow])
  const formCommands = useCallback(() => {
    return (<>
      <div>
        <p><label>Class Search Type</label></p>
        <p><label>
          <input 
            type="radio"
            name='search-type' 
            checked={searchType === ESearchType.full ? true : false}
            onChange={() => dispatch({type: EAct.rootField, field: 'searchType', value: ESearchType.full})}
          />Full
        </label></p>
        <p>
          <label>
            <input 
              type="radio"
              name='search-type' 
              checked={searchType === ESearchType.class ? true : false}
              onChange={() => dispatch({type: EAct.rootField, field: 'searchType', value: ESearchType.class})}
            />Class Specific
          </label>
        </p>
        <hr style={{margin: '6px 0'}} />
        <p><label>Search Behaviour</label></p>
        <p>
          <label>
            <input 
              type="radio"
              name='search-composition'
              checked={searchComposition === ESearchComposition.new ? true : false}
              onChange={() => dispatch({type: EAct.rootField, field: 'searchComposition', value: ESearchComposition.new})}
            />New
          </label>
        </p>
        <p>
          <label>
            <input 
              type="radio"
              name='search-composition' 
              checked={searchComposition === ESearchComposition.add ? true : false}
              onChange={() => dispatch({type: EAct.rootField, field: 'searchComposition', value: ESearchComposition.add})}
            />Add
          </label>
        </p>
      </div>
      <hr style={{margin: '6px 0'}} />
      <SelfLockSubmitButton 
        text={'Search'} 
        loadingText={'Searching...'} 
        onClick={() => searchAudits()} 
      />
    </>)
  }, [searchComposition, searchAudits, searchType])


  const editOrder = async () => {
    const sendAudits = [];
    audits.forEach(item => {
      if (item.removeFromAudit === false){
        sendAudits.push({//@ts-ignore
          audit_id: item.audit_id, user_order: item.quantity, price: parseFloat(item.price)
        })
      }
    })
    auditsFound.forEach(item => {
      if (item.add_to_audit === true){
        sendAudits.push({//@ts-ignore
          audit_id: parseInt(item.audit), user_order: parseInt(item.order), price: parseFloat(item.price)
        })
      }
    })
    const sendPack = {//@ts-ignore
      orderId: parseInt(vid),//@ts-ignore
      payStatus: parseInt(sbSelectedOrderPayStatus),//@ts-ignore
      paid: parseFloat(tbPricePaid),//@ts-ignore
      orderStatus: parseInt(sbSelectedOrderStatus),
      notes: tbNotes,
      audits: sendAudits
      
    }
    const svrResp = await jFetch('orders/edit-order', 'POST', sendPack)

    showWindow(svrResp)
  }
  const changeOrderValue = useCallback((audit_id: number, value: string) => 
    dispatch({type: EAct.changeQuantity, number: audit_id, string: value}),[])
  const changePriceValue = useCallback((audit_id: number, value: string) => {
    dispatch({type: EAct.changePrice, number: audit_id, string: value})
    dispatch({type: EAct.recalculateOrderTotal})  
  },[])
  const changeFoundPrice = useCallback((audit_id: number, value: string) => {
    dispatch({type: EAct.changeSearchedPrice, number: audit_id, string: value})
    dispatch({type: EAct.recalculateOrderTotal})  
  },[])
  const changeFoundOrder = useCallback((audit_id: number, value: string) =>
    dispatch({type: EAct.changeSearchedOrder, number: audit_id, string: value}),[])
  const removeFromOrder = useCallback((audit_id: number) => { 
    dispatch({type: EAct.removeOrderAudit, number: audit_id})
    dispatch({type: EAct.recalculateOrderTotal})  
  },[])
  const addFromSearch = useCallback((audit_id) => {
    dispatch({type: EAct.addSearchedAudit, number: audit_id})
    dispatch({type: EAct.recalculateOrderTotal})  
  },[])
  const deleteOrder = useCallback(async () => {//@ts-ignore
    const svrResp = await jFetch('orders/delete-order', 'POST', {v_id: parseInt(vid)});
    if (svrResp.alert) router.back()
    else showWindow(svrResp)
  }, [router, showWindow, vid])

  const askDeleteOrder = useCallback(() => {
    showDialog('Order Deletion', 'All order data and history from this specific order will be deleted, do you want to proceed?', EDialogWindowType.red, deleteOrder, 'Delete Order', 'Cancel')
  }, [deleteOrder, showDialog])
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
    dispatch({
      type: EAct.init, 
      paid: order_info.paid, 
      orderStatus: order_info.order_status, 
      orderPayStatus: order_info.order_pay_status,
      notes: order_info.notes,
      audits: _audits.map(item => ({...item, removeFromAudit: false}))
    })
    dispatch({type: EAct.recalculateOrderTotal}) 
    const getAuditClass = async () => {
      const classes:IGetValueVidVname = await getFetch('class-manip/get-classes') 
      if (classes.success)
        dispatch({type: EAct.setClasses, vidName: classes.value})
    }
    getAuditClass()

    getSvrPaymentStatus()
    getRegOrderAudit()
  }, [_audits, order_info.notes, order_info.order_pay_status, order_info.order_status, order_info.paid,showWindow])
  
  return (
    <div className='rootblock'>
      <style jsx>{`
      .rootblock{
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .rootblock > section{
        vertical-align: top;
      }
      .root-customer{
        margin: 6px;
        max-width: 320px;
        max-height: calc(100vh - 30px);
        overflow-y: auto;
      }
      .root-audits{
        margin: 6px;
        display: inline-block;
        max-height: calc(100vh - 30px);
        overflow-y: auto;
      }
      .root-audit-search{
        display: inline-block;
        margin: 6px;
        max-height: calc(100vh - 30px);
        overflow-y: auto;
      }
      .customer-info{
        display: grid;
        grid-template-columns: auto auto;
        grid-row-gap: 2px;
        grid-column-gap: 6px;
      }
      .customer-info > label:nth-child(odd){
        text-align: right;
      }
      .inside-form{
        display: grid;
        grid-template-columns: auto auto;
        grid-row-gap: 2px;
        grid-column-gap: 6px;
      }
      .inside-form > label:nth-child(odd){
        text-align: right;
      }
      .edit-form-window{
        position: fixed;
        top: 10px;
        right: 10px;
      }

      `}</style>
      <Head>
        <title>Edit Order</title>
      </Head>
      <form className='window window-alert root-customer'>
        <label>Customer Information</label>
        <hr style={{margin: '6px 0 4px 0'}} />
        <div className='customer-info'>
          <label>Name:</label>
          <label>{`${customer_info.first_name} ${customer_info.middle_name} ${customer_info.last_name}`}</label>
          <label>Phone:</label>
          <label>{customer_info.phone}</label>
          <label>Cell:</label>
          <label>{customer_info.cell}</label>
        </div>
        <hr style={{margin: '6px 0 4px 0'}} />
        <label>Ship To</label>
        <hr style={{margin: '6px 0 4px 0'}} />
        <div className='customer-info'>
          <label>Name: </label>
          <label>{`${ship_to.first_name} ${ship_to.middle_name} ${ship_to.last_name}`}</label>
          <label>Phone: </label>
          <label>{ship_to.phone}</label>
          <label>Cell:</label>
          <label>{ship_to.cell}</label>
          <label>Address:</label>
          <label>{ship_to.address}</label>
          <label>City:</label>
          <label>{ship_to.city}</label>
          <label>State:</label>
          <label>{ship_to.state}</label>
          <label>Zip:</label>
          <label>{ship_to.zip}</label>
          <label>Country:</label>
          <label>{ship_to.country}</label>
          <label>Notes:</label>
          <label>{ship_to.notes}</label>
        </div>
        <hr style={{margin: '6px 0 4px 0'}} />
        <label>Order</label>
        <hr style={{margin: '6px 0 4px 0'}} />
        <div className='inside-form'>
          <label>Date Time Placed: </label>
          <label>{newDatePlaced}</label>
          <label>Date Time Modified: </label>
          <label>{newDateModified}</label>
          <label>Order Total:</label>
          <CurrencyInput
            value={orderTotal}
            decimalsLimit={2}
            prefix='$'
          />
          <label>Amount Left To Pay:</label>
          <CurrencyInput //@ts-ignore
            value={parseFloat(orderTotal) - parseFloat(tbPricePaid)}
            decimalsLimit={2}
            prefix='$'
          />
          <label htmlFor="price-paid">Paid:</label>
          <CurrencyInput
            id='price-paid'
            placeholder='Enter Amount Paid'
            value={tbPricePaid}
            decimalsLimit={2}
            onValueChange={e => dispatch({type: EAct.rootField, field: 'tbPricePaid', value: e === undefined ? '0' : e})}
            prefix='$'
            maxLength={15}
            required
          />
          <label>Order Status:</label>
          <Selectbox 
            valueSelected={sbSelectedOrderStatus} 
            onChange={e => dispatch({type: EAct.rootField, field: 'sbSelectedOrderStatus', value: e.value})} 
            obj={sbSvrOrderStatus}
            selectInfoText='---Select Order Status---'
            styling='max-width: 150px;'
          />
          <label>Payment Status:</label>
          <Selectbox 
            valueSelected={sbSelectedOrderPayStatus} 
            onChange={e => dispatch({type: EAct.rootField, field: 'sbSelectedOrderPayStatus', value: e.value})} 
            obj={sbSvrPaymentStatus}
            selectInfoText='---Select Payment Status---'
            styling='max-width: 150px;'
          />
          <label>Notes:</label>
          <textarea 
            value={tbNotes} 
            onChange={e => dispatch({type: EAct.rootField, field: 'tbNotes', value: e.target.value })} 
          />
            
        </div>   
        <hr style={{margin: '6px 0 4px 0'}} />
        <SelfLockSubmitButton 
          text='Edit Order' 
          loadingText='Editing Order...' 
          onClick={editOrder}
          type='button'
        />  
        <SelfLockSubmitButton 
          text='Delete Order' 
          loadingText='Deleting Order...' 
          onClick={askDeleteOrder} 
          className='btn-red-submit'
          type='button'
        />
      </form>
      <form onSubmit={e => e.preventDefault()} className={`root-audit-search window window-alert ${'a'/*!keepSearchOpen ? 'search-items' : ''*/}`}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <label style={{whiteSpace: 'nowrap'}}>Search Items</label>
        </div>
        <hr style={{margin: '6px 0'}} />
        <AuditBase 
          classes={classes} 
          selectedOptions={[]} 
          dispatch={dispatch} 
          basicInfo={auditBasicInfo} 
          activeClassFields={activeClassFields} 
          options={[]}
          commands={formCommands()}
        />
      </form>
      <section className='window window-alert root-audits'>
      <label>Audits In Order</label>
      <hr style={{margin: '6px 0'}} />
      {audits.map(({fmv, removeFromAudit, audit_id, qtt_audit, quantity, notes, class_name, order_qtt, qtt_all_orders, price, fields, options}, index: number) => 
        <CompactView 
          key={index}
          audit_id={audit_id} 
          order_qtt={order_qtt} 
          price={price} 
          qtt_all_orders={qtt_all_orders} 
          qtt_audit={qtt_audit} 
          notes={notes} 
          class_name={class_name}
          quantity={quantity} 
          fmv={fmv}
          fields={fields} 
          options={options} 
          changeOrderValue={changeOrderValue} 
          changePriceValue={changePriceValue} 
          removeAudit={removeFromOrder} 
          isRemoving={removeFromAudit}
        />
      )}
      </section>
      <section className='window window-lookup root-audits'>
        <label>Searched Audits</label>
        <hr style={{margin: '6px 0'}} />
        {auditsFound.map(({fmv ,add_to_audit ,audit, price, qtt_available, class_name, fields, options, order, max_qtt}) =>
          <CompactView 
            key={audit}
            audit_id={audit} 
            price={price} 
            qtt_all_orders={0} 
            qtt_audit={qtt_available} 
            order_qtt={0}
            quantity={order} 
            fmv={fmv.toString()} 
            notes={''} 
            class_name={class_name} 
            fields={fields.map(({values, field_name}) => ({vvalues: values, field_name}))} 
            options={options} 
            changeOrderValue={changeFoundOrder} 
            changePriceValue={changeFoundPrice} 
            addAudit={addFromSearch}
            isAdding={add_to_audit}
          />
        )}
      </section>
    </div>
  )
}

export default EditOrder

export const getServerSideProps = async ({req, res, query}: {req: NextApiRequest, res: NextApiResponse, query: {vid: number}}) => {
  try {
    const validate = await validateNextQuery(vCheckIntVid, req, res)
    if (validate !== true) return {notFound : true}
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissionsReq(req)
    
    if(reqPermission.canLogin !== true) return {redirect: {permanent: false, destination: '/'}}
    if(reqPermission.canPlaceOrders !== true) return {notFound : true}

    const orderInfo:IFullOrder = await getSingleOrderInfo(query.vid)
    if (orderInfo.customer_info)
    return {props:{
      vid: query.vid,
      orderInfo
    }}
    else return {notFound: true}
  } catch (error) {
    console.error(error)
    return {notFound : true}
  }
}