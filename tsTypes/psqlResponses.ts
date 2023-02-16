import { number } from "yup";
import { IGetVidVname } from "../database/postgres/jobRegistry/dbCom";

export interface IErrors{
  info?: string;
  error?: string;
}

export interface IBasicResponse {
  success?: string;
  error?: string;
  info?: string;
  alert?: string;
}

export interface IWindowTypes {
  success?: string;
  error?: string;
  normal?: string;
  alert?: string;
  info?: string;
}

export interface INumberResponse extends Omit<IBasicResponse, "success">{
  success?: number;
}

export interface ITokenIdent {
  success?: string
  ident?: string
  token?: string
  error?: string
  info?: string
  change_pass?: boolean
}

export interface IUserInfo{
  success?: {
    userid: number
    fname: string
    lname: string
    ulogin: string
    admin_level: number
  }
  info?: string
  error?: string
}

export interface IUserPerm{
  success?: [{
    v_id: number;
  }]
  info?: string
  error?: string
}

export interface IUserInfoPerm{
  success?: {
    userInfo: IUserInfo["success"]
    userPerm: IUserPerm
  }
  info?: string
  error?: string
}

export interface IJobPermissions{
  success?: [{
    v_id: number
    v_name: string
  }]
  info?: string
  error?: string
}

export interface IValueResponse{
  success?: string
  value?: number
  info?: string
  error?: string
}

export interface IValueBigIntArrayResp extends IErrors{
  success?: string
  value?: Array<number>
}

export interface IJobPermissionsCheck{
  success?: [{
    v_id: number
    v_name: string
    checked: boolean
  }]
  info?: string
  error?: string
}

export interface IAlertResponse extends Omit<IBasicResponse, "success">{
  alert?: string
  value?: number
}

export interface IJobPlacementSelected{
  success?: Array<{
    v_id: number
    v_name: string
    v_expectation: string
  }>
  info?: string
  error?: string
}

export interface IJobPlacementPerm{
  success?: Array<{
    v_id: number, 
    v_name: string
    v_permissions: Array<number>
  }>
  info?: string
  error?: string
}

export interface IJobSingleFullName extends IErrors{
  success?: {
    job_full_name: string
    v_expectation: string
  }
}

export interface IGetValueVidVname extends IErrors{
  success?: string
  value?: Array<{
    v_id: number
    v_name: string
  }>
}

export interface IValuesFromClass extends IErrors{
  success?: string
  value?: Array<IObjValuesFromClass>
}

export interface IObjValuesFromClass{
  v_id: number
  v_name: string
  v_field: number
  v_label: string
  v_max_entries: number
  v_order: number
  v_required: boolean
  v_fieldValues?: IGetVidVname['success']
}

export interface IGetAuditValues extends IErrors{
  success?:{
    audit?: {
      audit_class_id: number
      v_name: string
      date_placed: string
      job_id: number
      notes: string
      quantity: number
    },
    fields?: Array<{
      v_id: number
      value_arr: string
    }>,
    options?: Array<{
      issue_id: number
    }>
  }
  info?: string
}

export interface ISendAuditValues extends IErrors{
  success?:{
    audit?: {
      audit_class_id: number
      v_name: string
      date_placed: string
      job_id: number
      notes: string
      quantity: number
    },
    fields?: Array<{
      v_id: number
      value_arr: Array<string>
    }>,
    options?: Array<{
      issue_id: number
    }>
  }
  info?: string
}

export interface IGetDbAuditHistorySingle extends IErrors{
  success?: string
  value?: {
    audit: {
      auditer: string
      editer: string
      selectedClass: number
      name: string
      date: string
      jobId: number
      notes: string
      quantity: number
      reserved: number
    },
    fields: Array<{
      v_id: number
      value_arr: Array<string>
    }>,
    options: Array<{
      issue_id: number
    }>
  }
}

export interface IGetAuditHistoryDatetime extends IErrors{
  success?: string
  value?: Array<{datetime: Date}>
}

export interface IGetRegAuditOrder extends IErrors{
  success: string
  value: Array<{
    v_id: number
    v_name: string
    audit: number
    order: number
  }>
}

export interface IGetRegCustomers extends IErrors{
  success?: string
  value?: Array<ISingleRegCustomer>
}

export interface ISingleRegCustomer{
  id: number
  fname: string
  mname: string
  lname: string
  phone: string
  cell: string
  address: string
  city: string
  state: string
  country: string
  zip: number
  notes: string
}

export interface IGetRegCustomersNameId extends IErrors{
  success?: string
  value?: Array<IRegCustomerOnlyNameId>
}

export interface IRegCustomerOnlyNameId{
  id: number
  fname: string
  mname: string
  lname: string
}

export interface ISingleAuditSearch{
  audit: number,
  fmv: number
  notes: number
  qtt_available: number
  class_name: string
  fields: Array<{
    field_name: string
    values: Array<string>
  }>
  options: Array<string>
}

export interface IMultipleAuditSearch extends IErrors{
  success?: Array<ISingleAuditSearch>,
}

export interface IAuditsFound extends IErrors{
  success?: string
  value?: Array<IUISingleAuditSearched>
}

export interface IUISingleAuditSearched extends ISingleAuditSearch{
  order: number
  max_qtt: number
  price: string
  add_to_audit: boolean
} 

export interface IAuditCompactInfo{
  audit: number
  notes: string
  quantity: number
  class_name: string
  order_id: Array<number>
  fields: Array<{
    field_name: string
    vvalues: Array<string>
  }>
  options: Array<string>
}

export interface ISvrAuditCompactInfo extends IErrors{
  success?: string
  value?: Array<IAuditCompactInfo> 
}

export interface IFullOrder extends IErrors{
  customer_info?:{
    first_name: string
    middle_name: string
    last_name: string
    phone: string
    cell: string
    notes: string
  }
  ship_to?:{
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
  order_info?: {
    paid: number
    order_status: number
    order_pay_status: number
    datetime: Date
    datetime_modified: Date
    notes: string
  }
  audits?: Array<{
    audit_id: number
    order_qtt: number
    price: number
    qtt_all_orders: number
    qtt_audit: number
    notes: string
    class_name: string
    removeFromAudit: boolean
    quantity: number
    fields: Array<{
      field_name: string
      vvalues: string
    }>
    options: string
  }>
  info?: string
}

export interface IOrderHistory extends IErrors{
  success?: string
  values?: Array<Date>
}

export interface IFullSingleOrderHistory extends IErrors{
  success?: string
  values?: {
    dt_modified?: Date
    customer?:{
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
    ship_to?:{
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
    order?: {
      paid: number
      order_status_name: string
      order_payment_status: string
      datetime: Date
      notes: string
    }
    audits?: Array<{
      audit_id: number
      price: number
      notes: string
      class_name: string
      order_qtt: number
      fields: Array<{
        field_name: string
        vvalues: Array<string>
      }>
      options: Array<string>
    }>
    info?: string
  }
  
}

export interface IGetJobAudits extends IErrors{
  success?: string
  value?: Array<{
    id: number
    quantity: number
    notes: string
    fmv: string
    name: string
    options: Array<string>
    fields: Array<{
      field_name: string
      vvalues: Array<string>
    }>
  }>
}

export interface IBulkMoveResp{
  perm?: Array<number>
  audit_id?: Array<string>
}

export interface IBulkMove extends IBulkMoveResp{
  success?: string
  ask?: boolean
  info?: string
  error?: string
}

export interface IAuditerPerformance{
  name: string,
  qtt_audited: number
}

export interface IRespAuditerPerformance extends IErrors{
  success?: string
  values?: Array<IAuditerPerformance> 
}

export interface IGetAllAnnounces extends IErrors{
  success?: string
  value?: Array<{
    info: string,
    show: boolean,
    id: number, 
    person_name: string
  }> 
}

export interface IGetMyReminders extends IErrors{
  success?: string
  value?: Array<{
    info: string
    id: number
  }>
}

export interface ISingleAuditPreset
{
  name: string
  datetime_placed: Date
  options: Array<number>
  preset: Array<{
    v_id: number
    v_field: number
    values: Array<number | string | boolean>
  }>
  options_edit:  Array<number>
  preset_edit: Array<{
    v_id: number
    v_field: number
    values: Array<number | string | boolean>
  }>
}

export interface ISvrGetAuditPreset extends IErrors{
  success?: string
  value?: Array<ISingleAuditPreset>
}

export interface ISvrGetJobDriveReport extends IErrors{
  success: {
    working_drives: Array<ISvrSingleJobDriveReport>,
    not_working_drives: Array<ISvrSingleJobNotWorkingDriveReport>
  }
}

export interface ISvrSingleJobNotWorkingDriveReport{
  size: number,
  serial_number: string
}

export interface ISvrSingleJobDriveReport{
  name: string,
  serial_number: string,
  size: number,
  wipe_config: number,
  wipe_start: null | string,
  wipe_end: null | string
}

export interface IAvailableInventory extends IErrors{
  success?: string
  value?: Array<ISvrAvailableInventory>
}

export interface ISvrAvailableInventory{
  class_name: string,
  audit: Array<{
    id: number,
    notes: string,
    qtt_in_order: number,
    quantity: number,
    fields: Array<{
      field_name: string,
      vvalues: Array<string | boolean | number>
    }>
    options: Array<string>
  }>
}