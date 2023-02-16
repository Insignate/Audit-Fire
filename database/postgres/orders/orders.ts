import { NextApiRequest, NextApiResponse } from "next"
import RequesterInfo from "../../../permissions/requester"
import { castInput, validateDataInput, validateHeader } from "../../../schemas/dataValidation"
import { IAddName50, ICreateOrder, IEditOrder, IEditOrderAuditPermission, IGetVid, IOrderAuditPermission, IOrderCreateCustomer, IOrderCreateShip, IOrderEditCustomer, ISearchAudits, vAddName50, vCreateOrder, vEditOrder, vEditOrderAuditPermission, vGetOrderHistoryDetails, vGetVid, vOrderAuditPermission, vOrderCreateCustomer, vOrderCreateShip, vOrderEditCustomer, vOrderSearchCustomer, vSearchAudits } from "../../../schemas/inputValidation"
import { IMultipleAuditSearch, IValueResponse } from "../../../tsTypes/psqlResponses"
import * as db from "./dbCom"


export const getAuditPermissions = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true &&
    userPermissions.canAuditOrderManage !== true) return userPermissions.canPlaceOrders

  return await db.getAuditPermissions()
}

export const getOrderPermissions = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true &&
    userPermissions.canAuditOrderManage !== true) return userPermissions.canPlaceOrders

  return await db.getOrderPermissions()
}

export const newOrderAuditPermission = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vOrderAuditPermission, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true) return userPermissions.canAuditOrderManage

  const {audit, order, name}: IOrderAuditPermission = req.body

  return await db.newOrderAuditPermission(audit, order, name)
}

export const getRegOrderAuditPermission = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true &&
    userPermissions.canOrderHistory !== true &&
    userPermissions.canPlaceOrders !== true) return userPermissions.canAuditOrderManage

  return await db.getRegOrderAuditPermission()
}

export const editOrderPermission = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vEditOrderAuditPermission, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true) return userPermissions.canAuditOrderManage

  const {audit, order, v_id}: IEditOrderAuditPermission = req.body

  return await db.editOrderPermission(audit, order, v_id)
}

export const deleteOrderPermission = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true) return userPermissions.canAuditOrderManage

  const {v_id}: IGetVid = req.body

  return await db.deleteOrderPermission(v_id)
}

export const createOrderCustomer = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vOrderCreateCustomer, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes}:IOrderCreateCustomer  = req.body

  return await db.createOrderCustomer(fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes)
}

export const searchCustomer = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vOrderSearchCustomer, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes}:IOrderCreateCustomer  = req.body

  return await db.searchCustomer(fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes)
}

export const registerOrderShipping = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vOrderCreateShip, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {
    v_id,
    fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes}:IOrderCreateShip  = req.body

  return await db.registerOrderShipping(
    v_id,
    fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes)
  
}

export const editCustomer = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vOrderEditCustomer, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {
    v_id,
    fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes}:IOrderEditCustomer  = req.body

  return await db.orderEditCustomer(
    v_id,
    fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes)
  
}

export const editOrderShipping = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vOrderCreateShip, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {
    v_id,
    fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes}:IOrderEditCustomer  = req.body

  return await db.editOrderShipping(
    v_id,
    fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes)
  
}

export const findCustomerShipAddress = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {v_id}:IGetVid = req.body

  return await db.findCustomerShipAddress(v_id)
  
}

export const deleteOrderCustomer = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {v_id}:IGetVid = req.body

  return await db.deleteOrderCustomer(v_id)
  
}

export const deleteOrderShipping = async (req: NextApiRequest, res: NextApiResponse): Promise<IValueResponse> => {  
  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {v_id}:IGetVid = req.body

  return await db.deleteOrderShipping(v_id)
  
}

export const orderSearchAudit = async (req: NextApiRequest, res: NextApiResponse): Promise<IMultipleAuditSearch> => {  
  const val = await validateDataInput(vSearchAudits, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {search, options, classId}:ISearchAudits = req.body

  return await db.orderSearchAudit(options, search, classId)
  
}

export const createOrder = async (req: NextApiRequest, res: NextApiResponse) => {  
  const val = await validateDataInput(vCreateOrder, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {customer_id, ship_id, audit_pack, payed, payStatus, orderStatus, notes}:ICreateOrder = req.body
  
  const values = await db.createOrder(customer_id, ship_id, audit_pack, payed, payStatus, orderStatus, notes)
  
  return values

}

export const createPaymentStatus = async (req: NextApiRequest, res: NextApiResponse) => {  
  const val = await validateDataInput(vAddName50, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true) return userPermissions.canAuditOrderManage

  const {name}:IAddName50 = req.body

  return await db.createPaymentStatus(name)
  
}

export const getPaymentStatus = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateHeader(req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true && 
    userPermissions.canOrderHistory !== true && 
    userPermissions.canPlaceOrders !== true) return userPermissions.canAuditOrderManage
  
  return await db.getPaymentStatus()
}

export const deletePaymentStatus = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true) return userPermissions.canAuditOrderManage

  const {v_id} = req.body

  return await db.deletePaymentStatus(v_id)
}

export const orderSearchCustomerOnlyName = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vOrderSearchCustomer, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true &&
    userPermissions.canAuditOrderManage !== true &&
    userPermissions.canOrderHistory !== true) 
    return {error: 'You do not have permissions to search for customers'}
  const {fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes}:IOrderCreateCustomer  = req.body

  return await db.searchCustomerOnlyName(fname,
    mname,
    lname,
    phone,
    cell,
    address,
    city,
    state,
    country,
    zip,
    notes)
}

//search orders from order status
export const searchOrderStatus = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true &&
    userPermissions.canOrderHistory !== true) return {error: 'You do not have permissions to search for customers'}

  const {v_id} = req.body

  return await db.searchOrderStatus(v_id)
}

//search order from pay status
export const searchOrderPayStatus = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true &&
    userPermissions.canOrderHistory !== true &&
    userPermissions.canPlaceOrders !== true) return {error: 'You do not have permissions to search for customers'}

  const {v_id} = req.body

  return await db.searchOrderPayStatus(v_id)
}

//search customer orders searchCustomerOrder
export const searchCustomerOrder = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true &&
    userPermissions.canOrderHistory !== true &&
    userPermissions.canPlaceOrders !== true) return {error: 'You do not have permissions to search for customers'}

  const {v_id} = req.body

  return await db.searchCustomerOrder(v_id)
}

//edit order
export const editOrder = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vEditOrder, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canPlaceOrders !== true) return userPermissions.canPlaceOrders

  const {orderId, payStatus, orderStatus, paid, notes, audits}:IEditOrder = req.body

  const patchAudit = []
  for(let i = 0; i <= audits.length - 1; i++) {
    let auditFound = false; 
    patchAudit.forEach((item, index) => {
      if (item.audit_id === audits[i].audit_id){
        auditFound = true;
        patchAudit[index].user_order = patchAudit[index].user_order + audits[i].user_order
      }
    })
    if (auditFound === false){
      patchAudit.push(audits[i])
    }
  }

  return await db.editOrder(orderId, payStatus, orderStatus, paid, notes, patchAudit)
}

export const deleteOrder = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canAuditOrderManage !== true) return userPermissions.canAuditOrderManage

  const {v_id} = req.body

  return await db.deleteOrder(v_id)
}

export const getOrderHistory = async (req: NextApiRequest, res: NextApiResponse) => {  

  const val = await validateDataInput(vGetVid, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canOrderHistory !== true) return userPermissions.canAuditOrderManage

  const {v_id} = req.body

  return await db.getOrderHistory(v_id)
}

export const getSingleFullOrderHistory = async (req: NextApiRequest, res: NextApiResponse) => {  
  castInput(vGetOrderHistoryDetails, req)
  const val = await validateDataInput(vGetOrderHistoryDetails, req, res)
  if (val !== true) return {info: "Relog to the system"}
  const userPermissions = new RequesterInfo()
  await userPermissions.initiateReq(req)
  if (userPermissions.canLogin !== true) return userPermissions.canLogin
  if (userPermissions.canOrderHistory !== true) return userPermissions.canAuditOrderManage

  const {v_id, datetime} = req.body

  return await db.getSingleFullOrderHistory(v_id, datetime)
}