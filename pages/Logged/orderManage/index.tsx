import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import { parse } from 'path'
import React, { Fragment, useCallback, useContext, useEffect, useReducer, useState } from 'react'
import { LockSubmitButton, SelfLockSubmitButton } from '../../../components/buttons'
import { LockForm } from '../../../components/LockForm'
import Selectbox from '../../../components/Selectbox'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IGetRegAuditOrder, IValueResponse } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { EWindowType, ModalsContext } from '../../../utils/Modals'

interface IActionType{
  type: EActionType
  vidName?: IGetVidVname['success']
  name?: string
  number?: number
  divObj?: React.FormEvent<HTMLDivElement>
  value?: string | number | boolean | IGetRegAuditOrder['value']
  field?: string
}

enum EActionType {
  setOrderPerm,
  setAuditPerm,
  rootField,
  changeEditPermission,
  addToRegPermissions,
  changeRegPerm,
  removeRegOrder,
  addPaymentStatus,
  removePaymentStatus
}

const reducer = (state: Init, action: IActionType) => {

  switch(action.type){
    case EActionType.setAuditPerm:
      return {...state, auditPermission: action.vidName}
    case EActionType.setOrderPerm:
      return {...state, orderPermission: action.vidName}
    case EActionType.rootField:
      return {...state, [action.field]: action.value}
    case EActionType.changeEditPermission:
      const {audit, order} = state.regPermissions.find(item => item.v_id === action.number)
      if (audit !== undefined && order !== undefined)
        return {...state, orderEditSelected: order, auditEditSelected: audit, selectedEditType: action.number}
      return state
    case EActionType.addToRegPermissions:
      return {...state, regPermissions: [{v_id: action.number, v_name: state.newOrderTypeName, audit: state.auditSelected, order: state.orderSelected}, ...state.regPermissions]}
    case EActionType.removeRegOrder:
      return {...state, regPermissions: state.regPermissions.filter(item => item.v_id !== state.regToDeleteSelected)}

    case EActionType.changeRegPerm:
      return {...state, regPermissions: state.regPermissions.map(item => 
        item.v_id === state.selectedEditType ?
        {...item, audit: state.auditEditSelected, order: state.orderEditSelected} :item)}
    case EActionType.addPaymentStatus:
      return {...state, sbSvrPaymentStatus: 
        [{v_id: action.number, v_name: state.tbPaymentStatus}, ...state.sbSvrPaymentStatus]}

    case EActionType.removePaymentStatus:
      return {...state, sbSvrPaymentStatus: state.sbSvrPaymentStatus.filter(
        item => item.v_id !== state.sbSelectedPaymentStatus
      )}
    default: return state
  }
}


class Init{
  orderPermission: IGetVidVname['success'] = []
  auditPermission: IGetVidVname['success'] = []
  regPermissions: IGetRegAuditOrder['value'] = []

  orderSelected = 0
  auditSelected = 0
  orderEditSelected = 0
  auditEditSelected = 0
  selectedEditType = 0
  regToDeleteSelected = 0
  newOrderTypeName = ''
  
  tbPaymentStatus = ''
  sbSvrPaymentStatus: IGetVidVname['success'] = []
  sbSelectedPaymentStatus = 0
}

const Index = () => {

  const [state, dispatch] = useReducer(reducer, new Init)
  const [lockSubmit, setLockSubmit] = useState(false)
  const [lockEditSubmit, setLockEditSubmit] = useState(false)
  const [btnLockDeleteType, setBtnLockDeleteType] = useState(false)

  const {showWindow, showCustomWindow} = useContext(ModalsContext)

  const {
    selectedEditType,
    orderPermission, 
    auditPermission, 
    orderSelected,
    auditSelected,
    newOrderTypeName,
    auditEditSelected,
    orderEditSelected,
    regPermissions,
    regToDeleteSelected,
    tbPaymentStatus,
    sbSvrPaymentStatus,
    sbSelectedPaymentStatus,
  } = state

  const createPermission = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    setLockSubmit(true)
    e.preventDefault()

    if (auditSelected > 0 && orderSelected > 0 && newOrderTypeName.length > 0){
      const svrResp:IValueResponse = await jFetch('orders/create-permission', 'POST', {order: orderSelected, audit: auditSelected, name: newOrderTypeName})
      dispatch({type: EActionType.addToRegPermissions, number: svrResp.value})
      showWindow(svrResp)
    }
    else showCustomWindow('Info', 'Permissions needs to be set!', EWindowType.info)
    setLockSubmit(false)
  }, [newOrderTypeName, auditSelected, orderSelected, showCustomWindow, showWindow])

  const editPermission = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    setLockEditSubmit(true)
    e.preventDefault()
    const svrResp = await jFetch('orders/edit-permissions', 'PATCH', {v_id: selectedEditType, audit: auditEditSelected, order: orderEditSelected})
    if (svrResp.success){
      dispatch({type: EActionType.changeRegPerm})
    }
    showWindow(svrResp)
    
    setLockEditSubmit(false)
  }, [selectedEditType, auditEditSelected, orderEditSelected, showWindow])

  const removePermission = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    setBtnLockDeleteType(true)
    e.preventDefault()
    const svrResp = await jFetch('orders/delete-permission', 'DELETE', {v_id: regToDeleteSelected})
    if (svrResp.success) dispatch({type: EActionType.removeRegOrder})
    showWindow(svrResp)
    setBtnLockDeleteType(false)
  }, [regToDeleteSelected, showWindow])

  const createPaymentStatus = useCallback(async () => {
    const svrResp:IValueResponse = await jFetch('orders/create-payment-status', 'POST', {name: tbPaymentStatus})
    if (svrResp.success) dispatch({type: EActionType.addPaymentStatus, number: svrResp.value})
    showWindow(svrResp)
  }, [tbPaymentStatus, showWindow])

  const deletePaymentStatus = useCallback(async() => {
    const svrResp = await jFetch('orders/delete-payment-status', 'POST', {v_id: sbSelectedPaymentStatus})
    if(svrResp.success)
      dispatch({type: EActionType.removePaymentStatus})
  },[sbSelectedPaymentStatus])

  useEffect(() => {
    const getAuditPermissions = async () => {
      const svrResp = await getFetch('orders/get-audit-permissions')
      if (svrResp.success)
        dispatch({type: EActionType.setAuditPerm, vidName: svrResp.success})
      else showWindow(svrResp)
    }
    const getOrderPermissions = async () => {
      const svrResp = await getFetch('orders/get-order-permissions')
      if (svrResp.success)
        dispatch({type: EActionType.setOrderPerm, vidName: svrResp.success})
      else showWindow(svrResp)
    }
    const getRegOrderAudit = async () => {
      const svrResp:IGetRegAuditOrder = await getFetch('orders/get-reg-permissions')
      if (svrResp.success)
        dispatch({type: EActionType.rootField, field: 'regPermissions', value: svrResp.value})
      else showWindow(svrResp)
    }
    const getSvrPaymentStatus = async () => {
      const svrResp = await getFetch('orders/get-payment-status')
      if (svrResp.success)
        dispatch({type: EActionType.rootField, field: 'sbSvrPaymentStatus', value: svrResp.value})
      else showWindow(svrResp)
    }


    getAuditPermissions()
    getOrderPermissions()
    getRegOrderAudit()
    getSvrPaymentStatus()
  }, [showWindow])

  return (
    <div>
      <style jsx>{`
        .window{
          margin: 8px;
        }
        form{
          display: inline-block;
        }
        form > div{
          display: flex;
        }  
        form > hr{
          margin: 6px 0;
        }
        .container{
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
        }
      `}</style>
      <Head>
        <title>Order Manage</title>
      </Head>
      <div className='container' >
        <form onSubmit={e => createPermission(e)} className='window window-attention new-order-window'>
        
          <label htmlFor="">New Order Type Name: </label> <br />
          <input 
            required 
            value={newOrderTypeName}
            placeholder='Enter Type' 
            onChange={e => dispatch({type: EActionType.rootField, field: 'newOrderTypeName', value: e.target.value})}
          />
          <hr style={{margin: '6px 0'}} />
          <div>
            <div>
              <label>Order Permissions</label>
              <hr style={{margin: '6px 0'}} />
              {orderPermission.map(({v_id, v_name}) => 
                <Fragment key={v_id}>
                  <label><input 
                    id={v_id.toString()} 
                    type="radio" 
                    onChange={() => dispatch({type: EActionType.rootField, field: 'orderSelected', value: v_id})}
                    checked={v_id === orderSelected}
                  /> {v_name}</label>
                  <br />
                </Fragment>
              )}
            </div>
            <hr style={{margin: '0 6px'}} />
            <div>
              <label>Audit Permissions</label>
              <hr style={{margin: '6px 0'}} />
              {auditPermission.map(({v_id, v_name}) => 
                <Fragment key={v_id}>
                  <label><input 
                    id={v_id.toString()} 
                    type="radio" 
                    onChange={() => dispatch({type: EActionType.rootField, field: 'auditSelected', value: v_id})}
                    checked={v_id === auditSelected}
                  /> {v_name}</label>
                  <br />
                </Fragment>
              )}
            </div>
          </div>
          <hr style={{margin: '6px 0'}} />
          <LockSubmitButton text='Create' loadingText='Adding Permission Type' disabled={lockSubmit} />
        </form>
        <form onSubmit={e => editPermission(e)} className='window window-attention new-order-window'>
          <label>Edit Order Type </label> <br />
          <Selectbox 
            valueSelected={selectedEditType} 
            onChange={e => dispatch({type: EActionType.changeEditPermission, number: parseInt(e.value)})} 
            obj={regPermissions} 
            selectInfoText='---Select Order Name---'
          />
          <hr style={{margin: '6px 0'}} />
          <div>
            <div>
              <label>Order Permissions</label>
              <hr style={{margin: '6px 0'}} />
              {orderPermission.map(({v_id, v_name}) => 
                <Fragment key={v_id}>{/*@ts-ignore */}
                  <label>{/*@ts-ignore */}<input 
                    id={v_id} 
                    type="radio" 
                    onChange={() => dispatch({type: EActionType.rootField, field: 'orderEditSelected', value: v_id})}
                    checked={v_id === orderEditSelected}
                  /> {v_name}</label>
                  <br />
                </Fragment>
              )}
            </div>
            <hr style={{margin: '0 6px'}} />
            <div>
              <label>Audit Permissions</label>
              <hr style={{margin: '6px 0'}} />
              {auditPermission.map(({v_id, v_name}) => 
                <Fragment key={v_id}>
                  <label>{/*@ts-ignore */}<input 
                    id={v_id} 
                    type="radio" 
                    onChange={() => dispatch({type: EActionType.rootField, field: 'auditEditSelected', value: v_id})}
                    checked={v_id === auditEditSelected}
                  /> {v_name}</label>
                  <br />
                </Fragment>
              )}
            </div>
          </div>
          <hr style={{margin: '6px 0'}} />
          <LockSubmitButton text='Edit' loadingText='Editing Permission Type' disabled={lockEditSubmit} />
        </form>
        <form onSubmit={e => removePermission(e)} className='window window-attention new-order-window'>
          <label>Delete Order Type</label><br />
          <Selectbox 
            valueSelected={regToDeleteSelected} 
            onChange={e => dispatch({type: EActionType.rootField, field: 'regToDeleteSelected', value: parseInt(e.value)})} 
            obj={regPermissions}
            selectInfoText='---Select Type---'
          /><br />
          <LockSubmitButton text={'Delete'} loadingText={'Removing Type'} disabled={btnLockDeleteType} /><br />
        </form>
      </div>
      <div>
        <LockForm 
          formItems={<>
            <label>Add Order Payment Status</label>
            <br />
            <input
              value={tbPaymentStatus}
              onChange={e => dispatch({ type: EActionType.rootField, field: 'tbPaymentStatus', value: e.target.value })}
              placeholder='Payment Status'
              type="text" />
          </>}
          submitHandler={createPaymentStatus}
          windowType={'attention'}       
        />
        <LockForm 
          formItems={<>
            <label>Remove Order Payment Status</label>
            <br />
            <Selectbox 
              valueSelected={sbSelectedPaymentStatus} 
              onChange={e => dispatch({type: EActionType.rootField, field: 'sbSelectedPaymentStatus', value: parseInt(e.value)})}
              obj={sbSvrPaymentStatus} 
              selectInfoText='---Select Payment Status---'
            />
          </>} 
          submitHandler={deletePaymentStatus} 
          windowType={'attention'} 
        />
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
    
    if(reqPermission.canLogin !== true) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canAuditOrderManage === true) return {props: {
      pass: true
    }};
    else return {notFound : true}
  })
  return value
}