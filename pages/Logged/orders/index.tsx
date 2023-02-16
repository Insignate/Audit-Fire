import React, { Fragment, useCallback, useContext, useEffect, useReducer } from 'react'
import AuditBase, { EAuditBaseActionType, IAuditBasic } from '../../../components/AuditFields/AuditBase'
import { SelfLockSubmitButton, LockSubmitButton } from '../../../components/buttons'
import { IAlertResponse, IAuditsFound, IGetRegCustomers, IGetValueVidVname, IMultipleAuditSearch, ISingleRegCustomer, IUISingleAuditSearched } from '../../../tsTypes/psqlResponses'
import { getCookie, getCustomCookie, setCustomCookie } from '../../../utils/customCookies'
import { EFieldTypes } from '../../../utils/enums'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { EWindowType, ModalsContext } from '../../../utils/Modals'
import { IAuditValues } from '../Audit/inAudit/[vid]'
import CurrencyInput from 'react-currency-input-field'
import { DialogModalContext, EDialogWindowType } from '../../../utils/ModalDialog'
import { ICreateOrder } from '../../../schemas/inputValidation'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'
import Selectbox from '../../../components/Selectbox'
import { useRouter } from 'next/router'
import { NextApiRequest, NextApiResponse } from 'next'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import Head from 'next/head'




interface IActionType{
  type: EActionType | EAuditBaseActionType
  formFrom?: ICustomerInfo
  formTo?: string
  field?: string
  value?: string | number | boolean
  values?: Array<string>
  number?: number
  number2?: number
  number3?: number
  setRegCustomers?: IGetRegCustomers['value']
  setSingleShip?: ISingleRegCustomer
  classFields?: Array<IAuditValues>
  vidName?: IGetValueVidVname['value']
  string?: string
  name?: string
  multiAudits?: Array<IUISingleAuditSearched>
}

enum EActionType {
  rootNewCustomer,
  setCustomer,
  copyForm,
  rootSearchCustomer,
  rootShipTo,
  rootField,
  setInitRegCustomers,
  changeKeepOpen,
  setFromRegCustomer,
  setShipAddress,
  editSearchCustomer,
  setSpecificAddresses,
  setShipFromReg,
  removeCustomerSearch,
  setEditedShip,
  removeShipping,
  setClassFields,
  setClasses,
  setOptions,
  changeSearchOpen,
  setSearchedAudits,
  changeQuantity,
  changePrice,
  addToPriceChange,
  removeFromPriceChange,
  changeBulkPrice,
  setOrFieldPrices,
  mouseOverPriceChange,
  setAndFieldPrices,
  setFullFieldPrices,
  removeSingleAuditSearch,
  maxOrder,
  noneOrder,
  bulkChangeOrderQuntity,
  bulkChangeOrder,
  auditOver,
  createOrder
}

interface ICustomerInfo{
  fname: string
  mname: string
  lname: string
  phone: string
  cell: string
  address: string
  city: string
  state: string
  country: string
  zip: string
  notes: string
}

interface IPriceChangeOptions{
  header: string
  options: Array<string>
}

enum EMouseOverPriceChange{
  none,
  and,
  or,
  full
}
enum ESearchType{
  full,
  class
}
enum ESearchComposition{
  new,
  add
}

const reducer = (state: Init, action: IActionType) => {
  let findPrice: IPriceChangeOptions;
  switch(action.type){
    case EActionType.rootField:
      return {...state, [action.field]: action.value}
    case EActionType.rootNewCustomer:
      return {...state, newCustomer: {...state.newCustomer, [action.field]: action.value}}
    case EActionType.rootSearchCustomer:
      return {...state, searchCustomer: {...state.searchCustomer, [action.field]: action.value}}
    case EActionType.rootShipTo:
      return {...state, shipTo: {...state.shipTo, [action.field]: action.value}}
    case EActionType.setCustomer:
      return {...state, selectedCustomer: 
        {...state.selectedCustomer, 
          name: `${state.newCustomer.fname} ${state.newCustomer.mname} ${state.newCustomer.lname}`,
          v_id: action.number
        }
      }
    case EActionType.setFromRegCustomer:
      let {customerInfo} = state.regCustomers.find(item => item.customerInfo.id === action.number)
      //@ts-ignore
      if (customerInfo.zip === null) customerInfo.zip = '' 
      return {...state, searchCustomer: {...customerInfo},
        selectedCustomer: {...state.selectedCustomer, 
          name: `${customerInfo.fname} ${customerInfo.mname} ${customerInfo.lname}`,
          v_id: action.number  
        }
      }
    case EActionType.setInitRegCustomers:
      return {...state, regCustomers: action.setRegCustomers.map(item => ({customerInfo: item, shippingInfo: []}))}
    case EActionType.setShipAddress:
      return {...state, selectedCustomer: {...state.selectedCustomer, 
        address: `${state.shipTo.address} ${state.shipTo.city} ${state.shipTo.state}`,
        ship_id: action.number
      }}
    case EActionType.changeKeepOpen:
      setCustomCookie('order_keep_open', !state.keepOpen)
      return {...state, keepOpen: !state.keepOpen}
    case EActionType.changeSearchOpen:
      setCustomCookie('serach_keep_open', !state.keepSearchOpen)
      return {...state, keepSearchOpen: !state.keepSearchOpen}
    case EActionType.copyForm: 
      return {...state, [action.formTo]: action.formFrom}
    case EActionType.editSearchCustomer:
      return {...state, selectedCustomer: {...state.selectedCustomer, name: `${state.newCustomer.fname} ${state.newCustomer.mname} ${state.newCustomer.lname}` },
        regCustomers: state.regCustomers.map(item => 
        item.customerInfo.id === state.selectedCustomer.v_id ?
          {...item, customerInfo: {...state.newCustomer, id: item.customerInfo.id }}
          : item
        )
      }
    case EActionType.setSpecificAddresses:
      return {...state, regCustomers: state.regCustomers.map(item => 
        item.customerInfo.id === action.number ? 
        {...item, shippingInfo: action.setRegCustomers}
        : item
      )}
    case EActionType.setShipFromReg:
      const {address, city, state: sState, id, zip} = action.setSingleShip 
      return {...state, shipTo: {...action.setSingleShip, zip: String(zip)}, selectedCustomer: 
        {...state.selectedCustomer, pseudo_customer_id: action.number, address:  `${address} ${city} ${sState}`, ship_id: id} 
        
      }
    case EActionType.removeCustomerSearch:
      return {...state, regCustomers: state.regCustomers.filter(item => item.customerInfo.id !== action.number)}
    case EActionType.setEditedShip:
      return {...state, regCustomers: state.regCustomers.map(item => 
        item.customerInfo.id === state.selectedCustomer.pseudo_customer_id ? 
          {...item, shippingInfo: item.shippingInfo.map(sitem => 
            sitem.id === state.selectedCustomer.ship_id ? 
              {...state.shipTo}
            : sitem)}
        : item)}
    case EActionType.removeShipping:
      return {...state, regCustomers: state.regCustomers.map(item =>
        item.customerInfo.id === action.number2 ?
          {...item, shippingInfo: item.shippingInfo.filter(sitem => 
            sitem.id !== action.number
          )}
        : item
      )}
    case EActionType.setClasses:
      return {...state, classes: action.vidName}
    case EActionType.setClassFields:
      return {...state, activeClassFields: action.classFields, selectedClass: action.number, selectedOptions: [0]}
    case EActionType.setOptions:
      return {...state, options: action.vidName}
    case EActionType.setSearchedAudits:
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
    case EAuditBaseActionType.changeOption:
      const optionValue = isNaN(action.number) ? 0 : action.number
      if (state.selectedOptions.includes(optionValue)) return state
      state.selectedOptions[action.number2] = optionValue
      if (action.number2+1 >= action.number3) state.selectedOptions[action.number2+1] = 0
      return {...state}
    case EAuditBaseActionType.removeOption:
      if (action.number >= 0){
        state.selectedOptions.length = action.number
        state.selectedOptions[action.number] = 0
        return {...state}
      }
      else return state
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
          find3.values[action.number2] = value
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
    case EActionType.changeQuantity:
      const pass = state.auditsFound.find(item => item.audit === action.number).qtt_available
      if (pass - parseInt(action.string) >= 0)
        return {...state, auditsFound: state.auditsFound.map(item => 
          item.audit === action.number ? {...item, order: parseInt(action.string)}: item) }
      else if (action.string === '')
        return {...state, auditsFound: state.auditsFound.map(item => 
          item.audit === action.number ? {...item, order: '' }: item) }
      return state
    case EActionType.changePrice:
      return {...state, auditsFound: state.auditsFound.map(item => 
        item.audit === action.number ? {...item, price: action.string === undefined ? '0' : action.string}: item) }
    case EActionType.addToPriceChange:
      findPrice = state.priceChangeOptions?.find(item => item.header === action.name)
      if (findPrice === undefined)
        return {...state, priceChangeOptions: [...state.priceChangeOptions, {header: action.name, options: [action.string]}]}
      else if (!findPrice.options.includes(action.string))
        return {...state, priceChangeOptions: state.priceChangeOptions.map(item => 
          item.header === action.name ? ({...item, options: [...item.options, action.string] }) : 
            item)}
    case EActionType.removeFromPriceChange:
      findPrice = state.priceChangeOptions?.find(item => item.header === action.name)
      if (findPrice !== undefined){
        if (findPrice.options.length > 1)
          return {...state, priceChangeOptions: state.priceChangeOptions.map(item => 
            item.header === action.name ? ({...item, options: item.options.filter(oItem =>
              oItem !== action.string  
            )}) : item
          )}
        else 
          return {...state, priceChangeOptions: state.priceChangeOptions.filter(item =>
          item.header !== action.name)}
      }
      return state
    case EActionType.changeBulkPrice:
      let val = parseInt(action.string)
      if (!isNaN(val))
        return {...state, bulkPriceChange: val}
      else return {...state, bulkPriceChange: 0}
    case EActionType.setOrFieldPrices:
      for (let i = 0; i <= state.priceChangeOptions.length-1; i++){
        const priceOption = state.priceChangeOptions[i]
        state.auditsFound = state.auditsFound.map(item => {
          for (let y = 0; y <= item.fields.length-1; y++){
            const field = item.fields[y]
            if (field.field_name === priceOption.header){
              const searchValues = field.values
              for (let x = 0; x <= searchValues.length-1; x++){
                if (priceOption.options.includes(searchValues[x])){
                  return {...item, price: state.bulkPriceChange}
                }
              }
            }
          }
          return {...item}
        })
      }
      return {...state}

    case EActionType.setAndFieldPrices:
      state.auditsFound = state.auditsFound.map(auditContainer => {
        for (let x = 0; x <= state.priceChangeOptions.length-1; x++){
          let foundHeader = false
          const pOptionContainer = state.priceChangeOptions[x]
          for (let y = 0; y <= auditContainer.fields.length-1; y++){
            const completeField = auditContainer.fields[y]
            if (completeField.field_name === pOptionContainer.header){
              foundHeader = true
              const fieldsSplited = completeField.values
              let foundOption
              for (let a = 0; a <= pOptionContainer.options.length-1; a++){//user selected options
                foundOption = false
                for (let z = 0; z <= fieldsSplited.length-1; z++){//options in audit
                  if (pOptionContainer.options[a] === fieldsSplited[z]){
                    foundOption = true
                    z = fieldsSplited.length
                  }
                }
                if (foundOption !== true) return auditContainer
              }
            }
          }
          if (foundHeader !== true) return auditContainer
        }
        return {...auditContainer, price: state.bulkPriceChange}
      })
      return {...state}

    case EActionType.setFullFieldPrices:
      return {...state, auditsFound: state.auditsFound.map(item =>
        ({...item, price: item.price = state.bulkPriceChange})  
      )}

    case EActionType.removeSingleAuditSearch:
      return {...state, auditsFound: state.auditsFound.filter(item => item.audit !== action.number)}
    case EActionType.mouseOverPriceChange:
      return {...state, highlightFieldsMouseOver: action.number}
    case EActionType.maxOrder:
      return {...state, auditsFound: state.auditsFound.map(item => ({...item, order: item.qtt_available}))}
    case EActionType.noneOrder:
      return {...state, auditsFound: state.auditsFound.map(item => ({...item, order: 0}))}

    case EActionType.bulkChangeOrderQuntity:
      const value = parseInt(action.string)
      return {...state, bulkChangeOrderQuantity: isNaN(value) ? '' : value }
    case EActionType.bulkChangeOrder:
      return {...state, auditsFound: state.auditsFound.map(item => ({
        ...item, order: state.bulkChangeOrderQuantity > item.qtt_available ? item.qtt_available : state.bulkChangeOrderQuantity}
      ))}

    case EActionType.auditOver:
      return {...state, auditsOver: action.values, btnLockSubmit: false}
    case EActionType.createOrder:
      return {...state, auditsOver: [], btnLockSubmit: true}
    
    default: return state
    
  }
}

class Init{
  newCustomer: ICustomerInfo = {
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
  shipTo: ICustomerInfo = {
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
  keepOpen = false;
  keepSearchOpen = false;
  regCustomers: Array<{ customerInfo: ISingleRegCustomer, shippingInfo: Array<ISingleRegCustomer>}> = []
  classes: IGetValueVidVname['value'] = []
  selectedCustomer = {name: '', address: '', v_id: 0, ship_id: 0, pseudo_customer_id: 0}
  lockSubmitReg = false
  lockEditReg = false
  lockShipReg = false
  lockShipEdit = false
  lockSearchBtn = false
  auditBasicInfo: IAuditBasic = {
    notes: '',
    selectedClass: 0,
    jobId: 0,
    name: '',
    date: ''
  }
  options: IGetValueVidVname['value'] = []
  selectedOptions: Array<number> = [0]
  activeClassFields: Array<IAuditValues> = []

  auditsFound: Array<IUISingleAuditSearched> = []
  priceChangeOptions: Array<IPriceChangeOptions> = []
  bulkPriceChange = '1'
  highlightFieldsMouseOver = 0
  bulkChangeOrderQuantity = 0
  searchType: ESearchType = ESearchType.full
  searchComposition: ESearchComposition = ESearchComposition.new

  sbSvrPaymentStatus: IGetVidVname['success'] = []
  sbSelectedPaymentStatus = 0
  tbPricePayed = ''
  taOrderNotes = ''

  sbSvrOrderStatus: IGetVidVname['success'] = []
  sbSelectedOrderStatus = 0
  btnLockSubmit = false

  auditsOver: Array<string> = []
  newOrderId: '0'
}

const Index = () => {

  const {showWindow, showCustomWindow} = useContext(ModalsContext)
  const {showDialog} = useContext(DialogModalContext)
  const [state, dispatch] = useReducer(reducer, new Init())
  const router = useRouter();
  const {
    classes,
    highlightFieldsMouseOver,
    lockSearchBtn, 
    lockShipEdit, 
    lockShipReg ,
    lockEditReg, 
    lockSubmitReg, 
    newCustomer, 
    selectedCustomer, 
    shipTo, 
    searchCustomer, 
    regCustomers, 
    keepOpen,
    auditBasicInfo,
    options,
    selectedOptions,
    activeClassFields,
    keepSearchOpen,
    auditsFound,
    priceChangeOptions,
    bulkPriceChange,
    bulkChangeOrderQuantity,
    searchType,
    searchComposition,  
    sbSvrPaymentStatus,
    sbSelectedPaymentStatus,
    tbPricePayed,
    taOrderNotes,
    sbSvrOrderStatus,
    sbSelectedOrderStatus,
    btnLockSubmit,
    auditsOver,
    newOrderId,
  } = state

  const createCustomer = useCallback(async(e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.rootField, field: 'lockSubmitReg', value: true})
    e.preventDefault()
    const sendData = {...newCustomer, zip: parseInt(newCustomer.zip)}
    const svrResp = await jFetch('orders/create-customer', 'POST', {...sendData})
    if (svrResp.success){
      dispatch({type: EActionType.setCustomer, number: svrResp.value})
    }
    showWindow(svrResp)
    dispatch({type: EActionType.rootField, field: 'lockSubmitReg', value: false})
  }, [newCustomer, showWindow])
  const editCustomer = useCallback(async () => {
    dispatch({type: EActionType.rootField, field: 'lockEditReg', value: true})
    if (selectedCustomer.v_id > 0){
      const svrResp = await jFetch('orders/edit-customer', 'PATCH', {...newCustomer, zip: parseInt(newCustomer.zip), v_id: selectedCustomer.v_id})
      if (svrResp.success){
        dispatch({type: EActionType.editSearchCustomer})
      }
      showWindow(svrResp)
    }
    else showCustomWindow('Info', 'Please select a customer to edit!', EWindowType.info)

    dispatch({type: EActionType.rootField, field: 'lockEditReg', value: false})
  }, [newCustomer, selectedCustomer.v_id, showCustomWindow, showWindow])

  const createShipping = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.rootField, field: 'lockShipReg', value: true})
    e.preventDefault()
    if(selectedCustomer.v_id > 0){
      const svrResp = await jFetch('orders/create-shipping', 'POST', {...shipTo, v_id: selectedCustomer.v_id, zip: parseInt(shipTo.zip)})
      if(svrResp.success){
        dispatch({type: EActionType.setShipAddress, number: svrResp.value})
      }
      showWindow(svrResp)
    }
    else showCustomWindow('Info', 'Please search and select a customer or register a new customer to select the shipment', EWindowType.info)
    dispatch({type: EActionType.rootField, field: 'lockShipReg', value: false})
  }, [shipTo, selectedCustomer.v_id, showCustomWindow, showWindow])

  const findShipping = useCallback(async (value : number) => { 
    const svrResp = await jFetch('orders/find-shipping', 'POST', {v_id: value})
    if (svrResp.success) dispatch({type: EActionType.setSpecificAddresses, setRegCustomers: svrResp.value, number: value})
    else showWindow(svrResp)
  }, [showWindow])

  const editShipping = useCallback(async () => {
    dispatch({type: EActionType.rootField, field: 'lockShipEdit', value: true})
    if (selectedCustomer.ship_id > 0 ){
      const svrResp = await jFetch('orders/edit-shipping', 'PATCH', {...shipTo, v_id: selectedCustomer.ship_id, zip: parseInt(shipTo.zip)})
      if (svrResp.success) dispatch({type: EActionType.setEditedShip})
      showWindow(svrResp)
    }
    else showCustomWindow('Info', 'Please select a shipping address from a customer to edit', EWindowType.info)
    
    dispatch({type: EActionType.rootField, field: 'lockShipEdit', value: false})
  }, [shipTo, selectedCustomer.ship_id, showCustomWindow, showWindow])
  
  const sendSearchCustomer = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.rootField, field: 'lockSearchBtn', value: true})
    e.preventDefault()
    //@ts-ignore
    const search = {...searchCustomer, zip: parseInt(searchCustomer.zip)}
    const svrResp: IGetRegCustomers = await jFetch('orders/search-customers', 'POST', {...search})
    if(svrResp.success){
      dispatch({type: EActionType.setInitRegCustomers, setRegCustomers: svrResp.value})
    }
    dispatch({type: EActionType.rootField, field: 'lockSearchBtn', value: false})
  }, [searchCustomer])
  
  const deleteCustomer = useCallback(async(e: number) => {
    const svrResp:IAlertResponse = await jFetch('orders/delete-customer', 'DELETE', {v_id: e})
    if (svrResp.alert)
      dispatch({type: EActionType.removeCustomerSearch, number: e})
    showWindow(svrResp)
  }, [showWindow])

  const deleteShip = useCallback( async(idToDelete: number, fromCustomer: number) => {
    const svrResp = await jFetch('orders/remove-shipping', 'POST', {v_id: idToDelete})
    if (svrResp.alert)
      dispatch({type: EActionType.removeShipping, number: idToDelete, number2: fromCustomer})
    showWindow(svrResp)
  }, [showWindow])

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
            price: '0'
          }))
        dispatch({type: EActionType.setSearchedAudits, multiAudits})
      }//@ts-ignore
      else showWindow(svrResp)
    }
    else showCustomWindow('Info', 'You need to enter data for at least 1 field, To search for every available item, enter % in any text field', EWindowType.info)
    
  }, [activeClassFields, selectedOptions,searchType, auditBasicInfo.selectedClass, showWindow, showCustomWindow])

  const formCommands = () => {
    return (<>
      <div>
        <p><label>Class Search Type</label></p>
        <p><label>
          <input 
            type="radio"
            name='search-type' 
            checked={searchType === ESearchType.full ? true : false}
            onChange={() => dispatch({type: EActionType.rootField, field: 'searchType', value: ESearchType.full})}
          />Full
        </label></p>
        <p>
          <label>
            <input 
              type="radio"
              name='search-type' 
              checked={searchType === ESearchType.class ? true : false}
              onChange={() => dispatch({type: EActionType.rootField, field: 'searchType', value: ESearchType.class})}
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
              onChange={() => dispatch({type: EActionType.rootField, field: 'searchComposition', value: ESearchComposition.new})}
            />New
          </label>
        </p>
        <p>
          <label>
            <input 
              type="radio"
              name='search-composition' 
              checked={searchComposition === ESearchComposition.add ? true : false}
              onChange={() => dispatch({type: EActionType.rootField, field: 'searchComposition', value: ESearchComposition.add})}
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
  }

  const createOrder = useCallback( async () => {
    dispatch({type: EActionType.createOrder})
    const audit_pack = auditsFound.filter(item => item.order > 0
    ).map(({audit, price, order}) => (
      {//@ts-ignore
        audit_id: parseInt(audit), 
        price: parseFloat(price), //@ts-ignore
        order: parseInt(order)
      }))
    const sendPack : ICreateOrder = {
      customer_id: selectedCustomer.v_id, 
      payed: parseFloat(tbPricePayed),//@ts-ignore
      payStatus: parseInt(sbSelectedPaymentStatus),
      notes: taOrderNotes,//@ts-ignore
      orderStatus: parseInt(sbSelectedOrderStatus),
      ship_id: selectedCustomer.ship_id, //@ts-ignore
      audit_pack
    }
    //@ts-ignore
    const svrResp = await jFetch('orders/create-order', 'POST', {...sendPack});
    showWindow(svrResp)
    if (svrResp.status == 2){
      dispatch({type: EActionType.auditOver, values: svrResp.audits})
    }
    dispatch({type: EActionType.rootField, field: 'btnLockSubmit', value: false})
    if (svrResp.status == 1)
      dispatch({type: EActionType.rootField, field: 'newOrderId', value: svrResp.order_id})
    
  }, [selectedCustomer, auditsFound, tbPricePayed, sbSelectedPaymentStatus, taOrderNotes, sbSelectedOrderStatus, showWindow])

  const checkOrder = useCallback(async e => {
    e.preventDefault()
    
    if (auditsFound.length <=0 ){
      showCustomWindow('Info', 'You need to search items to add to the order', EWindowType.info);
      return;
    }
    if (selectedCustomer.v_id > 0 && selectedCustomer.ship_id > 0){
      let found = false
      for(const item in auditsFound){
        if (parseInt(auditsFound[item].price) <= 0){
          found = true
          break;
        }
      }
      if (found) showDialog('Alert', 
        "One or more items doesn't have a price, would you like to add them to the order anyway?", 
        EDialogWindowType.red, 
        createOrder)
      else await createOrder()
    }
    else showCustomWindow('Info', 'Please select a customer and a ship address!', EWindowType.alert)
    
  }, [auditsFound, selectedCustomer, createOrder, showCustomWindow, showDialog])

  const redirectToOrderSummary = useCallback((orderId: number) => {
    if (orderId > 0){
      const path = (router.asPath + "/editOrder/" + orderId)
      router.push(path) 
    }
    else showCustomWindow('Info', 'No order was created', EWindowType.info)
  }, [router, showCustomWindow])

  useEffect(() => {

    const {order_keep_open, serach_keep_open} = getCustomCookie()
    const open = order_keep_open ==='true' ? true : false
    const searchOpen = serach_keep_open ==='true' ? true : false
    if (order_keep_open !== undefined){
      dispatch({type: EActionType.rootField, field: 'keepOpen', value: open})
    }
    if (serach_keep_open !== undefined){
      dispatch({type: EActionType.rootField, field: 'keepSearchOpen', value: searchOpen})
    }
    const getAuditClass = async () => {
      const classes:IGetValueVidVname = await getFetch('class-manip/get-classes') 
      if (classes.success)
        dispatch({type: EActionType.setClasses, vidName: classes.value})
    }
    const getSvrPaymentStatus = async () => {
      const svrResp = await getFetch('orders/get-payment-status')
      if (svrResp.success)
        dispatch({type: EActionType.rootField, field: 'sbSvrPaymentStatus', value: svrResp.value})
      else showWindow(svrResp)
    }
    const getRegOrderAudit = async () => {
      const svrResp = await getFetch('orders/get-reg-permissions')
      if (svrResp.success){
        const value = svrResp.value.map(({v_name, v_id}) => ({v_name, v_id}))
        dispatch({type: EActionType.rootField, field: 'sbSvrOrderStatus', value})
      }
      else showWindow(svrResp)
    }
    getAuditClass()
    getSvrPaymentStatus()
    getRegOrderAudit()
    
  }, [showWindow])
  return (
    <div className='container'>
      <style jsx>{`
      .container{
        display: flex;
        flex-wrap: wrap;
        align-items: start;
        flex-direction: column;
      }
      .customer-container{
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .window{        
        margin: 8px;
      }
      .search-table{
        overflow: hidden;
        max-height: 0px;
        transition: max-height var(--fast-transition);
      }
      .register-container, 
      .shipto-container,
      .customer-found-container{
        overflow: hidden;
        max-width: 0;
        max-height: 0;
        transition: max-width var(--fast-transition), max-height var(--fast-transition);
      }
      .register-customer{
        display: flex;
        flex-direction: row;
      } 
      .register-customer form{
        width: 265px;
      }
      .register-customer form input{
        width: 139px;
      }
      .register-customer > hr, .search-found-container > hr{
        margin: 0 6px;
      }
      
      .register-container > div{
        overflow: hidden;
      }
      .register-customer table td:first-of-type{
        white-space: nowrap;
      }
      .register-customer:focus-within .search-table,
      .register-customer:hover .search-table,
      .register-customer:focus-within .register-container,
      .register-customer:hover .register-container,
      .register-customer:focus-within .shipto-container,
      .register-customer:hover .shipto-container,
      .register-customer:focus-within .customer-found-container,
      .register-customer:hover .customer-found-container{
        max-width: 265px;
        max-height: 460px;
      }
      
      .selected-customer-info{
        display: inline-block;
      }
      .form-grid-buttons{
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        grid-auto-flow: row;
        column-gap: 4px;
      }
      
      .search-found-container{
        display: flex;
        flex-direction: row;
      }

      .found-customer{
        margin: 6px 0;
        border: solid var(--obj-border-size) #0F0 ;
        border-radius: var(--obj-border-radius);
        width: 260px;
        display: grid;
      }
      .found-customer > div > button{
        border: none;
        border-radius: 0px;
        overflow-wrap: anywhere;
      }
      .found-customer > div{
        display: grid;
        grid-template-columns: 2.617fr auto 1fr;
      }
      
      .found-customer > hr{
        border: none;
        height: 2px;
        background-color: white;
      }
      .customer-selection-overflow{
        overflow: auto;
        max-height: 410px;
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      .customer-selection-overflow::-webkit-scrollbar {
        display: none;
      }
      .found-customer > .selected:last-of-type > button:first-of-type {
        border-bottom-left-radius: var(--obj-border-radius);
      }
      .found-customer > .selected:last-of-type > button:last-of-type {
        border-bottom-right-radius: var(--obj-border-radius);
      }
      
      .search-items{
        max-height: 20px;
        overflow-y: auto;
        transition: max-height var(--fast-transition), max-width var(--fast-transition);
      }
      .search-items:hover, .search-items:focus-within{
        max-height: 1500px;
      }
      
      .audit-container input::-webkit-outer-spin-button,
      .audit-container input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .audit-container{
        display: flex;
        flex-direction: row;
        border-bottom: solid 2px;
        transition: background-color var(--fast-transition);
        border-radius: var(--obj-border-radius);
        justify-content: space-between;
      }
      
      
      .audit-options{
        display: block;
      }
      .audit-options-container{
        display: flex;
        align-items: center;
        text-align: center;
      }
      .send-item{
        background-color: #080;
      }
      .dont-send-item{
        background-color: #800;
      }
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
      
      .selected-field{
        color: green;
      }
      .hide-search{
        display: none;
      }
      .audit-commands{
        position: sticky;
        top: 0;
      }
      .audit-commands hr{
        margin: 6px 0;
      }
      .audit-all{
        display: flex;
        flex-direction: row;
      }
      .audit-all > hr{
        margin: 0 6px;
      }
      #order-notes{
        width: 300px;
        height: 130px;
        max-height: 400px;
        max-width: 700px;
      }
      .audits-over{
        position: fixed;
        right: 0;
        bottom: 0;
        opacity: 0;
        pointer-events: none;
        
      }
      .show-audits-over{
        opacity: 1;
        pointer-events: default;
        transition: opacity var(--fast-transition);
      }
      .audit-selected-over{
        color: red;
      }
      @media screen and (max-width: 1286px){
        .register-customer{
          flex-direction: column;
        }
        .register-customer > hr{
          margin: 6px 0;
        }
        .effect > hr{
          border-width: 0;
          transition: border-width 0.01s;
          transition-delay: 0.25s;
        }
        .register-customer:hover > .effect > hr,
        .register-customer:focus-within > .effect > hr{
          border: solid calc(var(--window-border-size) / 2);
          transition-delay: 0.01s;
        }
      }
      @media screen and (max-width: 630px){
        .search-found-container{
          flex-direction: column;
        }
        .register-customer > hr, .search-found-container > hr{
          margin: 6px 0;
        }
        .audit-all{
          flex-direction: column;
        }
        .audit-all > hr{
          border: none;
        }
      }
      `}</style>
      <Head>
        <title>Create Order</title>
      </Head>

      <div className='customer-container'>
        <div className='window window-alert register-customer'>
          <div className={`search-found-container ${!keepOpen && 'effect'}`}>
            <form onSubmit={e => sendSearchCustomer(e)} className='search-container'>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <label style={{whiteSpace: 'nowrap'}}>Search Customer</label>
                <label htmlFor="keep-open">
                  <input 
                    style={{width: 'auto'}} 
                    onChange={() => dispatch({type: EActionType.changeKeepOpen})} 
                    id='keep-open' 
                    type='checkbox' 
                    checked={keepOpen}
                  />
                Keep Open</label>
              </div>
              <div className= {!keepOpen &&'search-table'}>
                <hr style={{margin: '6px 0'}} />
                <table>
                  <tbody>
                    <tr>
                      <td><label htmlFor="sfname">First Name: </label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'fname', value: e.target.value})} value={searchCustomer.fname} id='sfname' placeholder='Enter First Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="smname">Middle Name:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'mname', value: e.target.value})} value={searchCustomer.mname} id='smname' placeholder='Enter Middle Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="slname">Last Name:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'lname', value: e.target.value})} value={searchCustomer.lname} id='slname' placeholder='Enter Last Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sphone">Phone:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'phone', value: e.target.value})} value={searchCustomer.phone} id='sphone' placeholder='Enter Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="scell">Cell:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'cell', value: e.target.value})} value={searchCustomer.cell} id='scell' placeholder='Enter Cell Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="saddress">Address:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'address', value: e.target.value})} value={searchCustomer.address} id='saddress' placeholder='Enter Address' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sCity">City:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'city', value: e.target.value})} value={searchCustomer.city} id='sCity' placeholder='Enter City' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sState">State:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'state', value: e.target.value})} value={searchCustomer.state} id='sState' placeholder='Enter State' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sCountry">Country:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'country', value: e.target.value})} value={searchCustomer.country} id='sCountry' placeholder='Enter Country' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="szip">Zip:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'zip', value: e.target.value})} value={searchCustomer.zip} id='szip' placeholder='Enter Zip' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="sNotes">Notes:</label></td>
                      <td><textarea onChange={e => dispatch({type: EActionType.rootSearchCustomer, field: 'notes', value: e.target.value})} value={searchCustomer.notes} style={{maxWidth: '140px'}} id='sNotes' placeholder='Enter Notes' /></td>
                    </tr>
                  </tbody>
                </table>
                <hr style={{margin: '6px 0'}} />
                <div className='form-grid-buttons'>
                  <LockSubmitButton text={'Search'} loadingText={'Searching...'} disabled={lockSearchBtn} styling='grid-column: 1; grid-row: 1/3;' />
                  <button onClick={() => dispatch({type: EActionType.copyForm, formFrom: shipTo, formTo:'searchCustomer'})} type="button">Copy Ship</button>
                  <button onClick={() => dispatch({type: EActionType.copyForm, formFrom: newCustomer, formTo:'searchCustomer'})} type="button">Copy Register</button>
                </div>
              </div>
              
            </form>  
            <hr />
            <form onSubmit={e => e.preventDefault()} className={!keepOpen && 'customer-found-container'}>
              <label style={{whiteSpace: 'nowrap'}}>Select Customer</label>
              <hr style={{margin: '6px 0'}} />
              <div>
                <div className='customer-selection-overflow'>
                  {regCustomers.map(item => 
                  <div key={item.customerInfo.id} className='found-customer'>
                    <div className="found-shipping">
                      <button style={{borderTopLeftRadius: 'var(--obj-border-radius)'}}
                        onClick={() => dispatch({type: EActionType.setFromRegCustomer, number: item.customerInfo.id})}>{`${item.customerInfo.fname} ${item.customerInfo.mname} ${item.customerInfo.lname}`}</button>
                      <hr />
                      <SelfLockSubmitButton 
                        text='Delete' 
                        loadingText='Deleting' 
                        onClick={() => deleteCustomer(item.customerInfo.id)}
                        styling='border: none; border-radius: 0px; border-top-right-radius: var(--obj-border-radius);' 
                      />
                    </div>
                    <hr />
                    {item.shippingInfo.length > 0 ? item.shippingInfo.map((sitem: ISingleRegCustomer, index: number) => 
                      <div className="selected" key={sitem.id}>
                        <button onClick={() => dispatch({type: EActionType.setShipFromReg, setSingleShip: sitem, number: item.customerInfo.id})}>{sitem.address + ' ' + sitem.city + ' ' + sitem.state}</button>                        <hr />
                        <SelfLockSubmitButton 
                          onClick={() => 
                          deleteShip(sitem.id, item.customerInfo.id)} 
                          text='Delete' 
                          loadingText='Deleting' 
                          styling={`border: none; border-radius: 0; ${item.shippingInfo.length < index+2 ? 'border-bottom-right-radius: var(--obj-border-radius);' : ''}`}
                        />
                      </div>
                      ): 
                      <SelfLockSubmitButton 
                        onClick={() => findShipping(item.customerInfo.id)} 
                        text='Get Addresses' 
                        loadingText='Loading...' 
                        styling='border: none; border-radius: 0; border-bottom-left-radius: var(--obj-border-radius); border-bottom-right-radius: var(--obj-border-radius);'
                      />
                    }
                  </div>)}
                </div>
              </div>
              
            </form>
          </div>
          <hr />
          <div className={`search-found-container ${!keepOpen && 'effect'}`}>
            <form onSubmit={e => createShipping(e)} className={!keepOpen && 'shipto-container'}>
              <label style={{whiteSpace: 'nowrap'}}>Ship To</label>
              <div className='register-table'>
                <hr style={{margin: '6px 0'}} />
                <table>
                  <tbody>
                    <tr>
                      <td><label htmlFor="spfname">First Name: </label></td>
                      <td><input value={shipTo.fname} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'fname', value: e.target.value})} required id='spfname' placeholder='Enter First Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spmname">Middle Name:</label></td>
                      <td><input value={shipTo.mname} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'mname', value: e.target.value})} id='spmname' placeholder='Enter Middle Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="splname">Last Name:</label></td>
                      <td><input value={shipTo.lname} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'lname', value: e.target.value})} required id='splname' placeholder='Enter Last Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spphone">Phone:</label></td>
                      <td><input type='number' value={shipTo.phone} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'phone', value: e.target.value})} id='spphone' placeholder='Enter Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spcell">Cell:</label></td>
                      <td><input type='number' value={shipTo.cell} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'cell', value: e.target.value})} id='spcell' placeholder='Enter Cell Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spaddress">Address:</label></td>
                      <td><input value={shipTo.address} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'address', value: e.target.value})} required id='spaddress' placeholder='Enter Address' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spCity">City:</label></td>
                      <td><input value={shipTo.city} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'city', value: e.target.value})} required id='spCity' placeholder='Enter City' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spState">State:</label></td>
                      <td><input value={shipTo.state} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'state', value: e.target.value})} required id='spState' placeholder='Enter State' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spCountry">Country:</label></td>
                      <td><input value={shipTo.country} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'country', value: e.target.value})} required id='spCountry' placeholder='Enter Country' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spzip">Zip:</label></td>
                      <td><input type='number' value={shipTo.zip} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'zip', value: e.target.value})} required id='spzip' placeholder='Enter Zip' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="spNotes">Notes:</label></td>
                      <td><textarea value={shipTo.notes} onChange={e => dispatch({type: EActionType.rootShipTo, field: 'notes', value: e.target.value})} style={{maxWidth: '140px'}} id='spNotes' placeholder='Enter Notes' /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <hr style={{margin: '6px 0'}} />
              <div className='form-grid-buttons'>
                <LockSubmitButton text='Register' loadingText='Registering...' disabled={lockShipReg} />
                <LockSubmitButton onClick={() => editShipping()} type='button' text='Edit' loadingText='Editing...' disabled={lockShipEdit} />
                {/*@ts-ignore */}
                <button onClick={() => dispatch({type: EActionType.copyForm, formFrom: searchCustomer, formTo:'shipTo'})} type="button">Copy Search</button>
                <button onClick={() => dispatch({type: EActionType.copyForm, formFrom: newCustomer, formTo:'shipTo'})} type="button">Copy Register</button>
              </div>
            </form> 
            <hr />
            <form onSubmit={e => createCustomer(e)} className={!keepOpen && 'register-container'}>
              <label style={{whiteSpace: 'nowrap'}}>Register Customer + Billing</label>
              <div className='register-table'>
                <hr style={{margin: '6px 0'}} />
                <table>
                  <tbody>
                    <tr>
                      <td><label htmlFor="fname">First Name: </label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'fname', value: e.target.value})} value={newCustomer.fname} required id='fname' placeholder='Enter First Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="mname">Middle Name:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'mname', value: e.target.value})} value={newCustomer.mname} id='mname' placeholder='Enter Middle Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="lname">Last Name:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'lname', value: e.target.value})} value={newCustomer.lname} required id='lname' placeholder='Enter Last Name'/></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="phone">Phone:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'phone', value: e.target.value})} value={newCustomer.phone} id='phone' placeholder='Enter Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="cell">Cell:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'cell', value: e.target.value})} value={newCustomer.cell} id='cell' placeholder='Enter Cell Phone' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="address">Address:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'address', value: e.target.value})} value={newCustomer.address} id='address' placeholder='Enter Address' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="City">City:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'city', value: e.target.value})} value={newCustomer.city} id='City' placeholder='Enter City' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="State">State:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'state', value: e.target.value})} value={newCustomer.state} id='State' placeholder='Enter State' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="Country">Country:</label></td>
                      <td><input onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'country', value: e.target.value})} value={newCustomer.country} id='Country' placeholder='Enter Country' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="zip">Zip:</label></td>
                      <td><input type='number' onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'zip', value: e.target.value})} value={newCustomer.zip} id='zip' placeholder='Enter Zip' /></td>
                    </tr>
                    <tr>
                      <td><label htmlFor="Notes">Notes:</label></td>
                      <td><textarea onChange={e => dispatch({type: EActionType.rootNewCustomer, field: 'notes', value: e.target.value})} value={newCustomer.notes} style={{maxWidth: '140px'}} id='Notes' placeholder='Enter Notes' /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <hr style={{margin: '6px 0'}} />
              <div className='form-grid-buttons'>
                <LockSubmitButton text='Register' loadingText='Registering...' disabled={lockSubmitReg} />
                <LockSubmitButton onClick={() => editCustomer()} type='button' text='Edit' loadingText='Editing...' disabled={lockEditReg} />
                {/*@ts-ignore */}
                <button onClick={() => dispatch({type: EActionType.copyForm, formFrom: searchCustomer, formTo:'newCustomer'})} type="button">Copy Search</button>
                <button onClick={() => dispatch({type: EActionType.copyForm, formFrom: shipTo, formTo:'newCustomer'})} type="button">Copy Ship</button>
              </div>
            </form> 
          </div>
        </div>
      </div>
      <div className='window window-alert selected-customer-info'>
        <label>Selected Customer : {selectedCustomer.name}</label><br />
        <label>Shipping To : {selectedCustomer.address}</label>
      </div>
      <form onSubmit={e => e.preventDefault()} className={`window window-alert ${!keepSearchOpen ? 'search-items' : ''}`}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <label style={{whiteSpace: 'nowrap'}}>Search Items</label>
          <label htmlFor="keep-serach-open">
            <input 
              style={{width: 'auto'}} 
              onChange={() => dispatch({type: EActionType.changeSearchOpen})} 
              id='keep-serach-open' 
              type='checkbox' 
              checked={keepSearchOpen}
            />
          Keep Open</label>
        </div>
        <hr style={{margin: '6px 0'}} />
        <AuditBase 
          classes={classes} 
          selectedOptions={selectedOptions} 
          dispatch={dispatch} 
          basicInfo={auditBasicInfo} 
          activeClassFields={activeClassFields} 
          options={options}
          commands={formCommands()}
        />
      </form>
      <form onSubmit={e => e.preventDefault()} className={`window window-alert ${auditsFound.length > 0 ? '': 'hide-search'} `}>
        <div className='audit-all'>
          <div>
            {auditsFound.map(({qtt_available, class_name, audit, fields, options, max_qtt, order, price, fmv}, index: number) => 
              <Fragment key={index}>
                <div className='audit-container hover-container'>
                  <div className='audit-container-fields'>
                    <div>
                      <div>
                        <p><label>Audit</label></p>
                        <p><label className={`${auditsOver.includes(audit.toString()) ? 'audit-selected-over': ''}`} >{audit}</label></p>
                      </div>
                      <div>
                        <p><label>Stock</label></p>
                        <p><label>{qtt_available}</label></p>
                      </div>
                      <div>
                        <p><label>Order</label></p>
                        <p><input 
                          required
                          className='order'
                          tabIndex={index+1} 
                          type='text'
                          value={order} 
                          onChange={e => dispatch({type: EActionType.changeQuantity, number: audit, string: e.target.value})}
                          pattern='[1-9][0-9]{0,15}'
                          max={max_qtt}
                          min='0'
                        /></p>
                      </div>
                        
                      <div className='price'>
                        <p><label>Price</label></p>
                        <p><CurrencyInput
                          placeholder='Price'
                          value={price}
                          decimalsLimit={2}
                          onValueChange={e => dispatch({type: EActionType.changePrice, number: audit, string: e})}
                          prefix='$'
                          maxLength={15}
                          className='test'
                        /></p>
                      </div>
                      <div>
                        <p><label>Fmv</label></p>
                        <p><label>{fmv}</label></p>
                      </div>
                      <div>
                        <p><label htmlFor="">Class</label></p>
                        <p><label htmlFor="">{class_name}</label></p>
                      </div>
                      
                    </div>
                    <div>
                      {fields.map(({field_name, values}) => 
                        <div key={field_name}>
                          <p><label>{field_name}</label></p>
                          {values.map((item: string, index: number) => 
                            <p key={index}><label 
                              className={priceChangeOptions?.find(fItem => fItem.header === field_name && fItem.options.includes(item)) !== undefined && highlightFieldsMouseOver === EMouseOverPriceChange.or ? 
                                'selected-field' : ''} 
                              onClick={() => dispatch({type: EActionType.addToPriceChange, string: item, name: field_name})}>{item}
                            </label></p>)}
                        </div>
                      )}
                      <div>
                        <p><label>Issues</label></p>
                        {options !== null && options.map((item: string, index2: number) => 
                          <p key={index2}><label>
                            {item}
                          </label></p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='audit-options-container'>
                    <div className='audit-options'>
                      <fieldset>
                        <legend>Options</legend>
                        <p><button 
                          type='button'
                          style={{width: '100%'}}
                          onClick={() => dispatch({type: EActionType.removeSingleAuditSearch, number: audit})}
                        >X</button></p>
                      </fieldset>
                      
                      
                    </div>
                  </div>
                </div>
              </Fragment>
            )}
          </div>
          <hr />
          <div>
            <div className='audit-commands'>
              <label htmlFor="">Options Selected</label>
              <hr />
              {priceChangeOptions.map(item => 
                <div key={item.header}>
                  <p className='filter-option-header'>{item.header}</p>
                  {item.options.map(oItem => 
                    <p onClick={() => dispatch({type: EActionType.removeFromPriceChange, string: oItem, name: item.header})} key={oItem}>{oItem}</p>  
                  )}
                </div>
              )}
              <hr />
              <p>New Price</p>
              <hr />
              <p>
                <CurrencyInput
                  name='set-price'
                  placeholder='Price'
                  value={bulkPriceChange}
                  decimalsLimit={2}
                  onValueChange={e => dispatch({type: EActionType.changeBulkPrice, string: e})}
                  prefix='$'
                  maxLength={15}
                />
              </p>
              <p><button type='button' onClick={() => dispatch({type: EActionType.setFullFieldPrices})}>FULL Set Price</button></p>
              <p><button 
                type='button' 
                onClick={() => dispatch({type: EActionType.setAndFieldPrices})}>
                AND Set Price
              </button></p>
              <p><button 
                type='button' 
                onMouseLeave={() => dispatch({type: EActionType.mouseOverPriceChange, number: EMouseOverPriceChange.none})}
                onMouseOver={() => dispatch({type: EActionType.mouseOverPriceChange, number: EMouseOverPriceChange.or})} 
                onClick={() => dispatch({type: EActionType.setOrFieldPrices})}>
                OR Set Price
              </button></p>
              <hr />
              <p><label htmlFor="">Order</label></p>
              <hr />
              <p>
                <input 
                  placeholder='Quantity'
                  type='number'
                  value={bulkChangeOrderQuantity}
                  onChange={e => dispatch({type: EActionType.bulkChangeOrderQuntity, string: e.target.value})}
                />
              </p>
              <p>
                <button
                  type='button'
                  onClick={() => dispatch({type: EActionType.bulkChangeOrder})}
                >Set Order Quantity</button>
              </p>
                <button
                  type='button'
                  onClick={() => dispatch({type: EActionType.maxOrder})}
                >Max</button>
              <button
                  type='button'
                  onClick={() => dispatch({type: EActionType.noneOrder})}
                >None</button>
              <hr />
            </div>
          </div>
        </div>
      </form>
      <form className='window window-alert' onSubmit={e => checkOrder(e)}>
        <label htmlFor='sbPayStatus'>Order Payment Status:</label>
        <br />
        <Selectbox 
          valueSelected={sbSelectedPaymentStatus}
          onChange={e => dispatch({type: EActionType.rootField, field: 'sbSelectedPaymentStatus', value: parseInt(e.value)})}
          obj={sbSvrPaymentStatus} 
          selectInfoText='---Select Payment Status---'
          id='sbPayStatus'
        />
        <br />
        <label htmlFor="price-payed">Paid</label>
        <br />
        <CurrencyInput 
          id='price-payed'
          placeholder='Enter Amount Payed'
          value={tbPricePayed}
          decimalsLimit={2}
          onValueChange={e => dispatch({type: EActionType.rootField, field: 'tbPricePayed', value: e})}
          prefix='$'
          maxLength={15}
          required
        />
        <br />
        <label htmlFor="">Order Status</label>
        <br />
        <Selectbox 
          valueSelected={sbSelectedOrderStatus} 
          onChange={e => dispatch({type: EActionType.rootField, field: 'sbSelectedOrderStatus', value: e.value})} 
          obj={sbSvrOrderStatus} 
          selectInfoText='---Select Order Status---'
        />
        <br />
        <label htmlFor='order-notes'>Order Notes</label>
        <br />
        <textarea 
          value={taOrderNotes}
          onChange={e => dispatch({type: EActionType.rootField, field: 'taOrderNotes', value: e.target.value})}
          placeholder='Enter Order Notes' 
          id='order-notes' 
        />
        <br />
        <LockSubmitButton 
          text={'Create'} 
          loadingText={'Creating Order...'} 
          disabled={btnLockSubmit} 
        />
        {parseInt(newOrderId) > 0 && <button 
          type="button" 
          onClick={() => redirectToOrderSummary(parseInt(newOrderId))}>
            Redirect To Order: º{newOrderId}
        </button>}
      </form>
      <div className={`audits-over window window-attention ${auditsOver.length > 0 ? 'show-audits-over' : ''}`}>
        {auditsOver.map(item => <Fragment key={item}>
          <label>{item}</label>
          <br />
        </Fragment>)}
      </div>
    </div>
  )
}

export default Index

export const getServerSideProps = async ({req, res} : {req: NextApiRequest, res: NextApiResponse}) => {

  const value = await nextValidateLoginHeader(userTokenIdent, req, res, async () => {
    const {token, ident} = getCookie(req)
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissions(ident, token)
    
    if(reqPermission.canLogin !== true ) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canPlaceOrders === true) return {props: {
      check: true
    }};
    else return {notFound : true}
  })
  return value
}