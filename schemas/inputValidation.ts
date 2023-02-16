import {array, boolean, date, mixed, number, object, string, TypeOf} from 'yup'
import { EJobReportDetail, EJobReportType } from '../utils/enums'
import { values } from '../utils/valueConfig'

//creating a new employee
export const newEmployee = object({
  firstName: string().required().min(2).max(30),
  lastName: string().required().min(2).max(30),
  login: string().required().min(4).max(20),
  password: string().required().min(8).max(50),
  repassword: string().required().min(8).max(50),
  admLevel: number().optional(),
  checkbox: array().required().of(object().shape({
    v_id: number().required().max(32767),
    checked: boolean().required()
  }))
})
export interface INewEmployee extends TypeOf<typeof newEmployee>{};

export const schemaGetEmployee = object({
  userId: number().required().min(1).max(values.maxShort)
})

export interface IGetEmployee extends TypeOf<typeof schemaGetEmployee>{}

export const vEditEmployee = object({
  firstName: string().required().min(2).max(30),
  lastName: string().required().min(2).max(30),
  login: string().required().min(4).max(20),
  password: string().optional().max(50),
  repassword: string().optional().max(50),
  admLevel: number().optional(),
  checkbox: array().required().of(object().shape({
    v_id: number().required().max(32767),
    checked: boolean().required()
  }))
})

export interface IEditEmployee extends TypeOf<typeof vEditEmployee>{}

export const vInsertJobPlacement = object({
  placementName: string().required().min(1).max(50),
  checkbox: array().required().of(object().shape({
    v_id: number().required().max(32767),
    checked: boolean().required()
  }))
})

export interface IInsertJobPlacement extends TypeOf<typeof vInsertJobPlacement>{}

export const vGetVid = object({
  v_id: number().required().min(1).max(values.maxInt)
})

export interface IGetVid extends TypeOf<typeof vGetVid>{}

export const vEditJobPlacement = object({
  vid: number().required().min(1).max(values.maxShort),
  checkbox: array().required().of(object().shape({
    v_id: number().required().max(values.maxShort),
    checked: boolean().required()
  }))
})

export interface IEditJobPlacement extends TypeOf<typeof vEditJobPlacement>{}

export const vRemoveJobPlace = object({
  vid: number().required().min(1).max(values.maxShort)
})

export interface IRemoveJobPlace extends TypeOf<typeof vRemoveJobPlace>{}

export const vCheckShortVid = object({
  vid: number().required().min(1).max(values.maxShort)
})

export interface ICheckShortVid extends TypeOf<typeof vCheckShortVid>{}

export const vDeleteClassField = object({
  vid: number().required().min(1).max(values.maxShort),
  classId: number().required().min(1).max(values.maxShort),
})
export interface IDeleteClassField extends TypeOf<typeof vDeleteClassField>{}

export const vCheckIntVid = object({
  vid: number().required().min(1).max(values.maxInt)
})

export interface ICheckIntVid extends TypeOf<typeof vCheckIntVid>{}

export const vContactInfo = object({
  name: string().required().min(4).max(100), 
  address: string().min(0).max(100), 
  city: string().min(0).max(50),
  state: string().min(0).max(80), 
  country: string().min(0).max(100), 
  zip: string().min(0).max(10), 
  fName: string().min(0).max(40), 
  lName: string().min(0).max(40), 
  phone: string().min(0).max(15), 
  cell: string().min(0).max(15),
  notes: string().min(0).max(500)
})

export interface IContactInfo extends TypeOf<typeof vContactInfo>{}


export const vAddNewCustomerJob = object({
  salesman: number().required().min(1).max(values.maxInt),
  customer: number().required().min(1).max(values.maxInt),
  jobName: number().required().min(1).max(values.maxInt),
  jobNumber: number().required().min(1).max(values.maxInt),
  plant: number().required().min(1).max(values.maxInt),
  expectation: string().max(1000).max(values.maxInt),
  placement: number().required().min(1).max(values.maxShort),
  checkbox: array().required().of(object().shape({
    v_id: number().required().max(values.maxShort),
    checked: boolean().required()
  }))
})

export interface IAddNewCustomerJob extends TypeOf<typeof vAddNewCustomerJob>{}

export const vEditExistingCustomerJob = vContactInfo.concat(object({
  vid: number().required().min(0).max(values.maxInt)
}))

export interface IEditExistingCustomerJob extends TypeOf<typeof vEditExistingCustomerJob>{}

export const vCheckName = object({
  name: string().required().min(1).max(60),
  linkId: number().required().min(0).max(values.maxInt)
})

export interface ICheckName extends TypeOf<typeof vCheckName>{}

export const vCheckVidVname = object({
  vid: number().required().min(1).max(values.maxInt),
  name: string().required().min(1).max(60)
})

export interface ICheckVidVname extends TypeOf<typeof vCheckVidVname>{}

export const vAddJobNumberUsingJobName = object({
  name: string().required().min(1).max(100),
  linkId: number().required().min(1).max(values.maxInt),
  date: date().required()
})

export interface IAddJobNumberFromJobName extends TypeOf<typeof vAddJobNumberUsingJobName>{}

export const vAddPlant = object({
  name: string().required().min(1).max(50)
})

export interface IAddPlant extends TypeOf<typeof vAddPlant>{}

export const vAddService = object({
  name: string().required().min(1).max(50)
})

export interface IAddService extends TypeOf<typeof vAddService>{}

export const vMoveJobPlace = object({
  selectedJob: number().required().min(0).max(values.maxInt) ,
  movePlacement: number().required().min(0).max(values.maxInt)
})

export interface IMoveJobPlace extends TypeOf<typeof vMoveJobPlace>{}

export const vAddClass = object({
  name: string().required().min(1).max(50)
})

export interface IAddClass extends TypeOf<typeof vAddClass>{}

export const vAddClassField = object({
  name: string().required().min(1).max(50),
  boxSelected: number().required().min(1).max(values.maxShort),
  classSelected: number().required().min(1).max(values.maxShort),
  order: number().required().min(values.minShort).max(values.maxShort),
  entries: number().required().min(1).max(values.maxShort),
  required: boolean().required()
})

export interface IAddClassField extends TypeOf<typeof vAddClassField>{}

export const vPreDefinedOption = object({
  vid: number().required().min(1).max(values.maxInt),
  classId: number().required().min(1).max(values.maxShort),
  name: string().required().min(1).max(100)
})

export interface IPreDefinedOption extends TypeOf<typeof vPreDefinedOption>{}

export const vChangePreDefinedOptions = object({
  vid: number().required().min(1).max(values.maxInt),
  order: number().required().min(values.minShort).max(values.maxShort),
  entries: number().required().min(1).max(values.maxShort),
  required: boolean().required(),
  class_id: number().required().min(1).max(values.maxInt)
})

export interface IChangePreDefinedOptions extends TypeOf<typeof vChangePreDefinedOptions>{}

export const vAddIssue = object({
  name: string().required().min(1).max(50)
})

export interface IAddIssue extends TypeOf<typeof vAddIssue>{}

export const vAddIssueToClass = object({
  classId: number().required().min(1).max(values.maxInt),
  issueId: number().required().min(1).max(values.maxInt)
})

export interface IAddIssueToClass extends TypeOf<typeof vAddIssueToClass>{}

export const vDeleteClassOption = object({
  classId: number().required().min(1).max(values.maxInt),
  optionId: number().required().min(1).max(values.maxInt)
})

export interface IDeleteClassOption extends TypeOf<typeof vDeleteClassOption>{}

export const vCreateAudit = object({
  jobId: number().required().min(1).max(values.maxInt), 
  vclass: number().required().min(1).max(values.maxInt),
  audit: number().required().min(1).max(values.maxInt), 
  quantity: number().required().min(1).max(values.maxInt),
  fields: array().required().of(object().shape({
    v_id: number().required().max(values.maxShort),
    v_field: number().required().min(1).max(4),
    v_values: array().required().of(mixed())
  })), 
  editFields: array().required().of(object().shape({
    v_id: number().required().max(values.maxShort),
    v_field: number().required().min(1).max(4),
    v_values: array().required().of(mixed())
  })), 
  asIsAudit: boolean().required(),
  options: array().required().of(number().min(0).max(values.maxInt)),
  editOptions: array().required().of(number().min(0).max(values.maxInt)),
  notes: string().max(500),
  editNotes: string().max(500)
})

export interface ICreateAudit extends TypeOf<typeof vCreateAudit>{}

export const vEditAudit = object({
  vclass: number().required().min(1).max(values.maxInt),
  audit: number().required().min(values.minInt).max(values.maxInt), 
  quantity: number().required().min(1).max(values.maxInt),
  fields: array().required().of(object().shape({
    v_id: number().required().max(values.maxShort),
    v_field: number().required().min(1).max(4),
    v_values: array().required().of(mixed())
  })), 
  options: array().required().of(number().min(0).max(values.maxInt)), 
  notes: string().max(500),
  asked_to_audit: boolean().required() 
})

export interface IEditAudit extends TypeOf<typeof vEditAudit>{}

export const vGetAuditSpecificHistory = object({
  vid: number().required().min(values.minInt).max(values.maxInt),
  date: date().required()
})

export const vBulkAuditChange = object({
  quantity:  number().required().min(0).max(values.maxInt),
  notes: string().required().min(1).max(500),
  audits: array().required().of(number().required().min(values.minInt).max(values.maxInt)),
  options: array().of(number().required().min(values.minInt).max(values.maxInt)),
  fields: array().required().of(object().shape({
    v_field: number().required().min(values.minInt).max(values.maxInt),
    v_id: number().required().min(values.minInt).max(values.maxInt),
    values: array().required().of(mixed())
  })),
  vclass: number().required().min(1).max(values.maxInt),
  ask_to_change: boolean().required()
})

export interface IBulkAuditChange extends TypeOf<typeof vBulkAuditChange>{}

export const vBulkAuditMove = object({
  assets: array().required().of(number().required().min(values.minInt).max(values.maxInt)),
  location: string().required().min(1).max(50),
  force: boolean().required()
})

export const vOrderAuditPermission = object({
  audit: number().required().min(1).max(values.maxShort),
  order: number().required().min(1).max(values.maxShort),
  name: string().required().min(1).max(30)
})

export interface IOrderAuditPermission extends TypeOf<typeof vOrderAuditPermission>{}

export const vEditOrderAuditPermission = object({
  audit: number().required().min(1).max(values.maxShort),
  order: number().required().min(1).max(values.maxShort),
  v_id: number().required().min(1).max(values.maxShort)
})

export interface IEditOrderAuditPermission extends TypeOf<typeof vEditOrderAuditPermission>{}

export const vOrderCreateCustomer = object({
  fname: string().required().min(1).max(50),
  mname: string().nullable().max(100),
  lname: string().required().min(1).max(50),
  phone: string().nullable().max(15),
  cell: string().nullable().max(15),
  address: string().nullable().max(80),
  city: string().nullable().max(80),
  state: string().nullable().max(80),
  country: string().nullable().max(80),
  zip: number().nullable().max(values.maxInt),
  notes: string().nullable().max(500),
})

export interface IOrderCreateCustomer extends TypeOf<typeof vOrderCreateCustomer>{}

export const vOrderEditCustomer = object({
  v_id: number().required().min(1).max(values.maxInt),
  fname: string().required().min(1).max(50),
  mname: string().nullable().max(100),
  lname: string().required().min(1).max(50),
  phone: string().nullable().max(15),
  cell: string().nullable().max(15),
  address: string().nullable().max(80),
  city: string().nullable().max(80),
  state: string().nullable().max(80),
  country: string().nullable().max(80),
  zip: number().nullable().max(values.maxInt),
  notes: string().nullable().max(500),
})

export interface IOrderEditCustomer extends TypeOf<typeof vOrderEditCustomer>{}

export const vOrderSearchCustomer = object({
  fname: string().nullable().max(50),
  mname: string().nullable().max(100),
  lname: string().nullable().max(50),
  phone: string().nullable().max(20),
  cell: string().nullable().max(20),
  address: string().nullable().max(80),
  city: string().nullable().max(80),
  state: string().nullable().max(80),
  country: string().nullable().max(80),
  zip: number().nullable().max(values.maxInt),
  notes: string().nullable().max(500),
})

export interface IOrderSearchCustomer extends TypeOf<typeof vOrderSearchCustomer>{}

export const vOrderCreateShip = object({
  v_id: number().required().min(1).max(values.maxInt),
  fname: string().required().max(50),
  mname: string().max(100),
  lname: string().required().max(50),
  phone: string().nullable().max(20),
  cell: string().nullable().max(20),
  address: string().required().max(80),
  city: string().required().max(80),
  state: string().required().max(80),
  country: string().required().max(80),
  zip: number().nullable().max(values.maxInt),
  notes: string().nullable().max(500),
})

export interface IOrderCreateShip extends TypeOf<typeof vOrderCreateShip>{}

export const vSearchAudits = object({
  classId: number().min(0).max(values.maxShort),

  search: array().of(object().shape({
    v_id: number().required().min(1).max(values.maxInt),
    field_id: number().required().min(1).max(values.maxInt),
    fields: array().required().of(mixed())})
  ),
  options: array().of(number().min(1).max(values.maxInt))
})

export interface ISearchAudits extends TypeOf<typeof vSearchAudits>{}

export const vCreateOrder = object ({
  customer_id: number().required().min(1).max(values.maxInt),
  ship_id: number().required().min(1).max(values.maxInt),
  payed: number().required().min(0).max(999999999999999),
  payStatus: number().required().min(0).max(values.maxInt),
  notes: string().max(500),
  orderStatus: number().required().min(1).max(values.maxInt),
  audit_pack: array().of(object().shape({
    audit_id:number().required().min(1).max(values.maxBigInt),
    price: number().required().min(0).max(values.maxBigInt),
    order:number().required().min(1).max(values.maxInt),
  }))
  
})

export interface ICreateOrder extends TypeOf<typeof vCreateOrder>{}

export const vAddName50 = object ({
  name: string().required().min(1).max(50)
})

export interface IAddName50 extends TypeOf<typeof vAddName50>{}

export const vEditOrder = object({
  orderId: number().required().min(1).max(values.maxBigInt),
  payStatus: number().required().min(1).max(values.maxInt),
  orderStatus: number().required().min(1).max(values.maxInt),
  paid: number().required().min(0).max(999999999999999),
  notes: string(),
  audits: array().of(object().shape({
    audit_id: number().required().min(1).max(values.maxBigInt),
    price: number().required().min(0).max(999999999999999),
    user_order: number().required().min(1).max(values.maxInt)
  }))
})

export interface IEditOrder extends TypeOf<typeof vEditOrder>{}

export const vGetOrderHistoryDetails = object({
  v_id: number().required().min(1).max(values.maxBigInt),
  datetime: date().required()
})

export interface IGetOrderHistoryDetails extends TypeOf<typeof vGetOrderHistoryDetails>{}

export const vSearchCustomer = object({
  jobSelected: number().required().min(0).max(values.maxInt),
  jobName: number().required().min(0).max(values.maxInt),
  jobNumber: number().required().min(0).max(values.maxInt),
  salesman: number().required().min(0).max(values.maxInt),
  plant: number().required().min(0).max(values.maxInt)
})

export interface ISearchCustomer extends TypeOf<typeof vSearchCustomer>{}

export const vSetAuditFmv = object({
  audits: array().of(object().shape({
    fmv: number().required().min(0).max(values.maxInt),
    auditId: number().required().min(1).max(values.maxBigInt)
  }))
}) 

export interface ISetAuditFmv extends TypeOf<typeof vSetAuditFmv>{}

export const vGetEmployeeProductivity = object({
  start: date().required(),
  end: date().required()
})

export interface IGetEmployeeProductivity extends TypeOf<typeof vGetEmployeeProductivity>{}

export const vSetAnnounce = object({
  announce: string().required().min(1).max(500),
  show: boolean().required()
})

export interface ISetAnnounce extends TypeOf<typeof vSetAnnounce>{}



export const vChangeAnnounceStatus = object({
  id: number().required().min(1).max(values.maxShort),
  status: boolean().required()
})

export interface IChangeAnnounceStatus extends TypeOf<typeof vChangeAnnounceStatus>{}

export const vSetNewReminder = object({
  newReminder: string().required().min(1).max(500)
})

export interface ISetNewReminder extends TypeOf<typeof vSetNewReminder>{}

export const vChangeMyPassword = object({
  newPass: string().required().min(8).max(50),
  oldPass: string().required().min(8).max(50)
})

export interface IChangeMyPassword extends TypeOf<typeof vChangeMyPassword>{}

export const vSaveAuditPreset = object({
  class_id: number().required().min(1).max(values.maxInt),
  name: string().required().min(1),
  options: array().required().of(number().min(1).max(values.maxInt)),
  editOptions: array().required().of(number().min(1).max(values.maxInt)),
  preset: array().required().of(object().shape({
    v_id: number().required().min(1).max(values.maxInt),
    v_field: number().required().min(1).max(values.maxInt),
    values: array().required().of(mixed())
  })),
  presetEdit: array().required().of(object().shape({
    v_id: number().required().min(1).max(values.maxInt),
    v_field: number().required().min(1).max(values.maxInt),
    values: array().required().of(mixed())
  })),
  
})

export interface ISaveAuditPreset extends TypeOf<typeof vSaveAuditPreset>{}

export const vGetAuditPreset = object({
  class: number().required().min(1).max(values.maxShort)
})

export interface IGetAuditPreset extends TypeOf<typeof vGetAuditPreset>{}

export const cvInsertNewDrive = object({
  JobId: number().required("You need to select a job").min(1).max(values.maxInt),
  Model: string(),
  Size: number(),
  Serial: string(),
  PowerOnHours: number(),
  Health: number(),
  LifetimeWrites: number(),
  SmartDATA: array().of(array().of(string())),
  PushDriveToDb: boolean().required(),
  ZeroSectorRaw: object({
    WipeTimeElapsed: string(),
    StartWipe: date(),
    EndWipe: date(),
    Status: number(),
  })
})

export interface IInsertNewDrive extends TypeOf<typeof cvInsertNewDrive>{}

export const cvInsertNotWorkingDrive = object({
  SerialNumber: string().required().min(1).max(150),
  Size: number().required().min(1).max(9999999999),
  JobId: number().required().min(1).max(values.maxInt),
  Force: boolean().required()
})

export interface IInsertNotWorkingDrive extends TypeOf<typeof cvInsertNotWorkingDrive>{}

export const vGetJobDriveReport = object({
  vid: number().required().min(1).max(values.maxInt),
  detail: number().required().min(1).max(Object.keys(EJobReportDetail).length / 2),
  type: number().required().min(1).max(Object.keys(EJobReportType).length / 2)
})

export interface IGetJobDriveReport extends TypeOf<typeof vGetJobDriveReport>{}