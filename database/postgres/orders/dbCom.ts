import { ICreateOrder, IEditOrder, ISearchAudits } from "../../../schemas/inputValidation";
import { IAlertResponse, IFullOrder, IMultipleAuditSearch, IOrderHistory, ISingleAuditSearch, IValueBigIntArrayResp, IValueResponse } from "../../../tsTypes/psqlResponses";
import { getDB } from "../connection";
const { db } = getDB()



export const getAuditPermissions = async ():Promise<any> => {
  try {
    const psqlResp = await db.func("order_get_audit_permissions");
    if (psqlResp.length > 0) return {success: psqlResp}
    else return {info: "No audit permissions registered"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get audit order permissions"}
  }
}
export const getOrderPermissions = async ():Promise<any> => {
  try {
    const psqlResp = await db.func("order_get_status_permissions");
    if (psqlResp.length > 0) return {success: psqlResp}
    else return {info: "No order permissions registered"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get audit order permissions"}
  }
}
export const newOrderAuditPermission = async (audit: number, order: number, name: string): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_create_permission", [name, order, audit]);
    if (psqlResp[0].order_create_permission !== null) return {success: 'Audit/Order Permission Created', value: psqlResp[0].order_create_permission}
    else return {info: "Order/Audit Name already exists!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could create audit order permissions"}
  }
}
export const getRegOrderAuditPermission = async (): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_get_reg_permissions");
    if (psqlResp.length > 0) return {success: 'Registered Audit Ordered Permissions', value: psqlResp}
    else return {info: "There are no registered order audit permissions!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get registered audit order"}
  }
}
export const editOrderPermission = async (audit: number, order: number, v_id: number): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_edit_permissions", [audit, order, v_id]);
    if (psqlResp.length > 0) return {success: 'Order/Audit Permissions Edited', value: psqlResp}
    else return {info: "Name selected does not exists!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not edit order permission"}
  }
}
export const deleteOrderPermission = async (v_id: number): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_delete_permissions", [v_id]);
    if (psqlResp[0].order_delete_permissions > 0) return {success: 'Order/Audit Permission Deleted', value: psqlResp[0].order_delete_permissions}
    else return {info: "Permission doesn't exists!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not delete registered order type"}
  }
}
export const createOrderCustomer = async (
  fname: string,
  mname: string,
  lname: string,
  phone: string,
  cell: string,
  address: string,
  city: string,
  state: string,
  country: string,
  zip: number,
  notes: string): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_create_customer", [
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
      notes]);

    if (psqlResp[0].order_create_customer > 0) return {success: 'Customer Created', value: psqlResp[0].order_create_customer}
    else return {info: "Customer Already Exists!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not create customer"}
  }
}
export const searchCustomer = async (
  fname: string,
  mname: string,
  lname: string,
  phone: string,
  cell: string,
  address: string,
  city: string,
  state: string,
  country: string,
  zip: number,
  notes: string): Promise<IValueResponse> => {
  try {
    if (fname.length === 0) fname = '%'
    else fname = '%' + fname + '%'
    if (mname.length === 0) mname = '%'
    else mname = '%' + mname + '%'
    if (lname.length === 0) lname = '%'
    else lname = '%' + lname + '%'
    if (phone.length === 0) phone = '%'
    else phone = '%' + phone + '%'
    if (cell.length === 0) cell = '%'
    else cell = '%' + cell + '%'
    if (address.length === 0) address = '%'
    else address = '%' + address + '%'
    if (city.length === 0) city = '%'
    else city = '%' + city + '%'
    if (state.length === 0) state = '%'
    else state = '%' + state + '%'
    if (country.length === 0) country = '%'
    else country = '%' + country + '%'
    if (notes.length === 0) notes = '%'
    else notes = '%' + notes + '%'


    const psqlResp = await db.func("order_search_customer", [
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
      notes]);
    if (psqlResp.length > 0){
      return {success: 'Records Found', value: psqlResp}
    }
    else return {info: "No Customers Found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve records"}
  }
}
export const orderEditCustomer = async (
  v_id: number,
  fname: string,
  mname: string,
  lname: string,
  phone: string,
  cell: string,
  address: string,
  city: string,
  state: string,
  country: string,
  zip: number,
  notes: string): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_edit_customer", [
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
      notes]);

    if (psqlResp[0].order_edit_customer > 0) return {success: 'Customer Edited', value: psqlResp[0].order_edit_customer}
    else return {info: "Customer Not Found!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not Edit customer"}
  }
}
export const registerOrderShipping = async (
  v_id: number,
  fname: string,
  mname: string,
  lname: string,
  phone: string,
  cell: string,
  address: string,
  city: string,
  state: string,
  country: string,
  zip: number,
  notes: string): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_create_ship", [
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
      notes]);

    if (psqlResp[0].order_create_ship > 0) return {success: 'Shipping address created!', value: psqlResp[0].order_create_ship}
    else return {info: "Shipping Address Already Exists"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not create Shipping Address"}
  }
}
export const editOrderShipping = async (
  v_id: number,
  fname: string,
  mname: string,
  lname: string,
  phone: string,
  cell: string,
  address: string,
  city: string,
  state: string,
  country: string,
  zip: number,
  notes: string): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_edit_shipping", [
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
      notes]);

    if (psqlResp[0].order_edit_shipping > 0) return {success: 'Shipping Address Updated!', value: psqlResp[0].order_edit_shipping}
    else return {info: "Shipping Address Already Exists"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not create Shipping Address"}
  }
  
}
export const findCustomerShipAddress = async (v_id: number): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_find_customer_ship", [v_id]);
    if (psqlResp.length > 0) return {success: 'Shipping Addresses Found', value: psqlResp}
    else return {info: "No Shipping Address Registered"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Shipping Addresses"}
  }
  
}
export const deleteOrderCustomer = async (v_id: number): Promise<IAlertResponse> => {
  try {
    const psqlResp = await db.func("order_delete_customer", [v_id]);
    if (psqlResp[0].order_delete_customer > 0) return {alert: 'Customer Deleted!', value: psqlResp}
    else return {info: "Customer was not found!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Customer has orders or shipping addresses or could not be deleted"}
  }
  
}
export const deleteOrderShipping = async (v_id: number): Promise<IAlertResponse> => {
  try {
    const psqlResp = await db.func("order_delete_shipping", [v_id]);
    if (psqlResp[0].order_delete_shipping > 0) return {alert: 'Shipping Deleted!', value: psqlResp}
    else return {info: "Ship Not Found Or Already Deleted!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Ship Already Deleted or could bot be found"}
  }
  
}
export const orderSearchAudit = async (options: ISearchAudits['options'], searchArray: ISearchAudits['search'], classId: number): Promise<any> => {
  try {
    const auditsFound = await db.func("order_find_audits", [classId, JSON.stringify(searchArray), JSON.stringify(options)]);
    const auditArr = []
    if (auditsFound.length > 0){
      for (const element of auditsFound){
        if (element.qtt_available > 0){
          const audit = await searchAudit(element.audit)
          const newObj = {...audit.audit_info}
          delete audit.audit_info
          auditArr.push({...element, ...audit, ...newObj})
        }
      }
      
      return {success: "Audits Found", value: auditArr}
    }
    else return {info: "No Audits found!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not find audits"}
  }
}
export const searchAudit = async (audit: number): Promise<any> => {
  if (audit > 0){
    try {
      const jsonObj:ISingleAuditSearch = await db.func("order_get_found_audit", [audit]);
      return jsonObj[0].order_get_found_audit
    } catch (err) {
      console.error(err.message);
      return {error: "Could not find audits"}
    }
  }
  return {info: "No Audits found!"}
}
export const searchAuditsArray = async (auditArray: Array<number>): Promise<IMultipleAuditSearch> => {
  const auditsFound = []
  if (auditArray.length > 0){
    try {
      for (const element of auditArray){
        const jsonObj:ISingleAuditSearch = await db.func("order_get_found_audit", [element]);

        auditsFound.push(jsonObj[0].order_get_found_audit)
      };
      return {success: auditsFound}
    } catch (err) {
      console.error(err.message);
      return {error: "Could not find audits"}
    }
  }
  return {info: "No Audits found!"}
}
export const createPaymentStatus = async (name: string): Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("order_create_payment_status", [name]);
    if (psqlResp[0].order_create_payment_status !== null) return {success: 'Payment Status Created', value: psqlResp[0].order_create_payment_status}
    else return {info: "Payment Status Name Already Exists!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could create Payment Status Name"}
  }

}
export const createOrder = async ( 
    customer_id: number, 
    ship_id: number, 
    audit_pack: ICreateOrder['audit_pack'],
    payed: number , 
    payStatus: number, 
    orderStatus: number,
    notes: string
  ) => {
  try {
    const psqlResp = await db.func("order_create", [
      customer_id, 
      ship_id,
      payed,
      payStatus,
      notes,
      orderStatus,
      JSON.stringify(audit_pack)
    ]);
    if (psqlResp[0].query_status == 1) return {success: 'Order Created', status: psqlResp[0].query_status, order_id: psqlResp[0].new_order_id}
    else return {
      error: "Order Creation Failed, Some Audits have quantities over than what the system has", 
      status: psqlResp[0].query_status, 
      audits: psqlResp[0].audit_over_quantity
    }
  } catch (err) {
    console.error(err.message);
    return {error: "Could not create order"}
  }
}
export const getPaymentStatus = async () => {
  try {
    const psqlResp = await db.func("order_get_payment_status");
    if (psqlResp.length > 0) return {success: 'Audit/Order Retrieved', value: psqlResp}
    else return {info: "No Payment Status Registered Yet!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Payment Status"}
  }
}
export const deletePaymentStatus = async (v_id: number) => {
  try {
    const psqlResp = await db.func("order_delete_payment_status", [v_id]);
    if (psqlResp[0].order_delete_payment_status !== null) return {success: 'Order Payment Status Deleted', value: psqlResp[0].order_delete_payment_status}
    else return {info: "Payment Status Not Found!"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not delete Payment Status"}
  }
}
export const searchCustomerOnlyName = async (
  fname: string,
  mname: string,
  lname: string,
  phone: string,
  cell: string,
  address: string,
  city: string,
  state: string,
  country: string,
  zip: number,
  notes: string): Promise<IValueResponse> => {
  try {
    if (fname.length === 0) fname = '%'
    else fname = '%' + fname + '%'
    if (mname.length === 0) mname = '%'
    else mname = '%' + mname + '%'
    if (lname.length === 0) lname = '%'
    else lname = '%' + lname + '%'
    if (phone.length === 0) phone = '%'
    else phone = '%' + phone + '%'
    if (cell.length === 0) cell = '%'
    else cell = '%' + cell + '%'
    if (address.length === 0) address = '%'
    else address = '%' + address + '%'
    if (city.length === 0) city = '%'
    else city = '%' + city + '%'
    if (state.length === 0) state = '%'
    else state = '%' + state + '%'
    if (country.length === 0) country = '%'
    else country = '%' + country + '%'
    if (notes.length === 0) notes = '%'
    else notes = '%' + notes + '%'


    const psqlResp = await db.func("order_search_customer_only_name", [
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
      notes]);
    if (psqlResp.length > 0){
      return {success: 'Records Found', value: psqlResp}
    }
    else return {info: "No Customers Found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve records"}
  }
}
//search orders from order status
export const searchOrderStatus = async (v_id: number): Promise<IValueBigIntArrayResp> => {
  try {
    const psqlResp = await db.func("order_search_from_order_status", [v_id]);
    const arr = []
    if (psqlResp.length > 0){
      psqlResp.forEach(item =>  arr.push(item.v_id))
      return {success: 'Orders Found', value: arr}
    }
    else return {info: "No orders found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Orders"}
  }
}
// search order from order pay status searchOrderPayStatus
export const searchOrderPayStatus = async (v_id: number): Promise<IValueBigIntArrayResp> => {
  try {
    const psqlResp = await db.func("order_search_from_order_pay_status", [v_id]);
    const arr = []
    if (psqlResp.length > 0){
      psqlResp.forEach(item => arr.push(item.v_id))
      return {success: 'Orders Found', value: arr}
    }
    else return {info: "No orders found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Orders"}
  }
}
//search customer orders
export const searchCustomerOrder = async (v_id: number): Promise<IValueBigIntArrayResp> => {
  try {
    const psqlResp = await db.func("order_search_customer_order", [v_id]);
    const arr = []
    if (psqlResp[0].v_id !== null){
      psqlResp.forEach(item => 
        arr.push(item.v_id))
      return {success: 'Orders Found', value: arr}
    }
    else return {info: "No orders found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Orders"}
  }
}
//get customer order
export const getSingleOrderInfo = async (v_id: number): Promise<IFullOrder> => {
  try {
    const psqlResp = await db.func("order_get_info", [v_id])
    const order_pack = psqlResp[0].order_get_info
    if (order_pack.customer_info){
      const new_pack = {...order_pack, audits: order_pack.audits != null ? order_pack.audits.map(({audit_id, order_qtt, price, extra, fields, options}) => 
        ({audit_id, order_qtt, price, ...extra, fields, options})
      ): []}
      return {...new_pack}
    }
      
    else return {info: "No orders found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Order"}
  }
}
//edit customer order
export const editOrder = async (
orderId: number,
payStatus: number, 
orderStatus: number, 
paid: number, 
notes: string, 
audits: IEditOrder['audits']): Promise<IValueResponse> => 
{
  try {
    const psqlResp = await db.func("order_edit_order", [orderId, payStatus, orderStatus, paid, notes, JSON.stringify(audits)]);
    if (psqlResp[0].audit_over === null){
      return {success: 'Order Edited'}
    }
    else return {info: 'Order could not be edited', ...psqlResp[0]}
  } catch (err) {
    console.error(err.message);
    return {error: "Could Not Edit Order"}
  }
}

//delete order
export const deleteOrder = async (v_id: number) => {
  try {
    const psqlResp = await db.func("order_delete_order", [v_id]);
    if (psqlResp[0].order_delete_order === 0) return {alert: 'Order Deleted'}
    else return {info: "Order Not Found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not delete order"}
  }
}
//get order all modified date and time   
export const getOrderHistory = async (v_id: number):Promise<IOrderHistory> => {
  try {
    const psqlResp = await db.func("order_get_history", [v_id]);
    if(psqlResp.length > 0){
      const arr:Array<Date> = []
      psqlResp.forEach(({datetime}:{datetime: Date}) => arr.push(datetime))
      return {success: 'Order History Found', values: arr}
    }
    else return {info: "Order History Not Found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get order history"}
  }
}

//gets the order full details from that specific order id and datetime modified
export const getSingleFullOrderHistory = async (v_id: number, datetime: Date):Promise<IOrderHistory> => {
  try {
    const psqlResp = await db.func("order_get_full_specific_history", [v_id, datetime]);   
    if(psqlResp[0].order_get_full_specific_history.order !== undefined){
      return {success: 'Order History Found', values: psqlResp[0].order_get_full_specific_history}
    }
    else return {info: "Order Not Found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get order detailed history"}
  }
}