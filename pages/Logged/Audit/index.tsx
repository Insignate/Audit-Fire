import { NextApiRequest, NextApiResponse } from 'next'
import React, { ChangeEvent, useCallback, useContext, useEffect, useReducer } from 'react'
import { LockSubmitButton } from '../../../components/buttons'
import Selectbox from '../../../components/Selectbox'
import { IGetVidVname } from '../../../database/postgres/jobRegistry/dbCom'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { IAddNewCustomerJob, IContactInfo } from '../../../schemas/inputValidation'
import { userTokenIdent } from '../../../schemas/user'
import { getCookie } from '../../../utils/customCookies'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { EWindowType, ModalsContext } from '../../../utils/Modals'
import { IAlertResponse, IValueResponse, IJobPlacementSelected, IJobPlacementPerm } from '../../../tsTypes/psqlResponses'
import EditCustomer from './EditCustomer'
import RegisterCustomer from './RegisterCustomer'
import RegisterSalesman from './RegisterSalesman'
import JobName from './JobName'
import JobNumber from './JobNumber'
import Plant from './Plant'
import { addCheckedToItems, useCheckbox } from '../../../components/useCheckbox'
import Services from './Services'
import { IPermissions } from '../../../database/postgres/permissionList'
import { CheckboxArr } from '../../../components/Checkbox'
import { dbJobPermissions } from '../../../permissions/dbRegisterPerm'
import { useRouter } from 'next/router'
import { values } from '../../../utils/valueConfig'
import Head from 'next/head'

enum EActionType {
  type,
  send,
  sendComplete,
  showRegisterTypeWindow,
  changeRegSelectedSalesman,
  changeRegRemoveSalesman,
  allRegisteredSalesman,
  addToSalesman,
  removeSalesman,
  lockAddButton,
  unlockAddButton,
  lockRemoveButton,
  unlockRemoveButton,
  showWindow,
  changeContactInfo,
  changeContactNumber,
  setRegisteredCustomers,
  changeEditContactInfo,
  changeJobCreationValue,
  setEditCustomer,
  addToCustomer,
  successEditCustomerName,
  rootField,
  addToJobName,
  regJobNames,
  editOldJobName,
  changeJobNumberInput,
  setJobNumber,
  addToJobNumber,
  removeJobNumber,
  rootVidVName,
  addToPlant,
  removePlant,
  setJobPlacement,
  rootFieldBoolean,
  rootFieldNumber,
  changeJobExpectation,
  setJobsFromPlace,
  addToJobPlacement,
  removeFromJobSelection,
  lockDeleteBtn,
  moveJobId
}
enum ERegisterType{
  salesman,
  customer,
  editCustomer,
  jobName,
  jobNumber,
  jobPlacement,
  services,
  plant
}
interface IActionType{
  type: EActionType
  field?: string
  string?: string
  value?: number
  bool?: boolean
  registerWindowType?: ERegisterType
  vidName?: IGetVidVname["success"]
  contactEditInfo?: IContactInfo
  vidNamePermission?: IJobPlacementPerm["success"]
  vidNameExpect?: IJobPlacementSelected["success"]
}
const reducer = (state: Init, action: IActionType) => {
  switch (action.type){
    case EActionType.send:
      return {...state, lockButton: true}
    case EActionType.sendComplete:
      return {...state, lockButton: false}
    case EActionType.showWindow:
      return {...state, registerType: action.registerWindowType}
    case EActionType.showRegisterTypeWindow:
      return {...state, registerType: action.registerWindowType, registeredEmployees: action.vidName}
    case EActionType.changeRegSelectedSalesman:
      return {...state, regSalesmanSelected: action.value}
    case EActionType.changeRegRemoveSalesman:
      return {...state, regSalesmanRemoveSelected: action.value}
    case EActionType.allRegisteredSalesman:
      return {...state, registeredSalesman: action.vidName}
    case EActionType.removeSalesman:
      return {...state, registeredSalesman: state.registeredSalesman.filter(item =>
        item.v_id !== state.regSalesmanRemoveSelected)}
    case EActionType.addToSalesman:
      const findName = state.registeredEmployees.find(({v_id}) => 
        v_id === state.regSalesmanSelected)
      return {...state, registeredSalesman: [{v_id: findName.v_id, v_name: findName.v_name}, ...state.registeredSalesman]}
    case EActionType.lockAddButton:
      return {...state, lockAddButton: true}
    case EActionType.unlockAddButton:
      return {...state, lockAddButton: false} 
    case EActionType.lockRemoveButton: 
      return {...state, lockRemoveButton: true}
    case EActionType.unlockRemoveButton: 
      return {...state, lockRemoveButton: false}
    case EActionType.changeContactInfo:
      return  {...state, contactInfo: {...state.contactInfo, [action.field]: action.value}}
    case EActionType.changeEditContactInfo:
      return  {...state, contactEditInfo: {...state.contactEditInfo, [action.field]: action.value}}
    case EActionType.setRegisteredCustomers:
      return {...state, regCustomers: action.vidName }
    case EActionType.changeJobCreationValue:
      return {...state, jobCreation: {...state.jobCreation, [action.field]: action.value}}
    case EActionType.setEditCustomer:
      if (action.contactEditInfo.zip === null) action.contactEditInfo.zip = "0"
      return {...state, contactEditInfo: action.contactEditInfo}
    case EActionType.addToCustomer:
      return {...state, regCustomers: [{v_id: action.value, v_name: action.string} ,...state.regCustomers]}
    case EActionType.successEditCustomerName:
      return {...state, regCustomers: state.regCustomers.map(item => 
        item.v_id === state.jobCreation.customer ? 
        {...item, v_name: state.contactEditInfo.name} : item
      )}
    case EActionType.regJobNames:
      return {...state, regJobName: action.vidName}
    case EActionType.rootField:
      return {...state, [action.field]: action.string}
      case EActionType.rootFieldNumber:
      return {...state, [action.field]: action.value}
    case EActionType.addToJobName:
      return {...state, regJobName: [{v_id: action.value, v_name: state.jobName}, ...state.regJobName] }
    case EActionType.editOldJobName:
      return {...state, regJobName: state.regJobName.map(item =>
        item.v_id === state.jobCreation.jobName ? {...item , v_name: state.editJobName}: item)
      }
    case EActionType.changeJobNumberInput:
      return {...state, jobNumber: {...state.jobNumber, [action.field]: action.string}}
    case EActionType.setJobNumber: 
      return {...state, regJobNumber: action.vidName}
    case EActionType.addToJobNumber:
      return {...state, regJobNumber: [{v_id: action.value, v_name: state.jobNumber.add + " - " + state.jobNumber.addDate.replaceAll("-", "/")}, ...state.regJobNumber]}
    case EActionType.removeJobNumber:
      return {...state, regJobNumber: state.regJobNumber.filter(item => item.v_id !== state.jobCreation.jobNumber)
    }
    case EActionType.rootVidVName:
      return {...state, allPlants: action.vidName}
    case EActionType.addToPlant:
      return {...state, allPlants: [{v_id: action.value, v_name: state.plantName}, ...state.allPlants]}
    case EActionType.removePlant:
      return {...state, allPlants: state.allPlants.filter(item => item.v_id !== state.jobCreation.plant)}
    case EActionType.setJobPlacement:
      return {...state, jobPlacements: action.vidNamePermission}
    case EActionType.rootFieldBoolean:
      return {...state, [action.field]: action.bool}
    case EActionType.changeJobExpectation: 
      return {...state, jobCreation: {...state.jobCreation, expectation: action.string}}
    case EActionType.setJobsFromPlace:
      let found = false
      const placeFound = state.jobPlacements.find(item => item.v_id == action.value)
      if (placeFound !== undefined){
        const foundNumber = placeFound.v_permissions.find(item => item == dbJobPermissions.audit)
        if (foundNumber === dbJobPermissions.audit) found = true
      }
      return {...state, jobToAuditSelected: undefined, jobPlacementSelection: action.vidNameExpect, auditEnabled: found}
    case EActionType.addToJobPlacement:
      const salesmanName = state.registeredSalesman.find(item  => item.v_id === state.jobCreation.salesman)
      const salesmanInitials = salesmanName.v_name.split(" ").map(item => item[0].toUpperCase()).join("")
      const customerName = state.regCustomers.find(item => item.v_id === state.jobCreation.customer).v_name
      const jobName = state.regJobName.find(item => item.v_id === state.jobCreation.jobName).v_name
      const jobNumber = state.regJobNumber.find(item => item.v_id === state.jobCreation.jobNumber).v_name
      const plant = state.allPlants.find(item => item.v_id === state.jobCreation.plant).v_name
      return {...state, jobPlacementSelection: [{v_id: action.value, 
        v_name: `${salesmanInitials} - ${plant} - ${customerName} - ${jobName}: ${jobNumber}`},
        ...state.jobPlacementSelection]}
    case EActionType.removeFromJobSelection:
      return {...state,  jobPlacementSelection: state.jobPlacementSelection.filter(item =>
        item.v_id != state.jobToAuditSelected
      ), jobToAuditSelected: undefined}
    case EActionType.lockDeleteBtn:
      return {...state, lockDeleteBtn: true}
    case EActionType.moveJobId:
      return {...state, jobToAuditSelected: undefined, jobPlacementSelection: state.jobPlacementSelection.filter(item => item.v_id != state.jobToAuditSelected)}
    
    default: return state
  }
}
interface jobCreation extends Omit<IAddNewCustomerJob, "checkbox">{}

class Init{
  lockButton: boolean = false
  registerType: ERegisterType = -1

  showJobCreation: boolean = false

  lockDeleteBtn: boolean = false

  //Register Salesman Window
  registeredEmployees: IGetVidVname["success"] = []
  registeredSalesman: IGetVidVname["success"] = []
  regSalesmanSelected: number = undefined
  regSalesmanRemoveSelected: number = undefined
  lockAddButton: boolean = false
  lockRemoveButton: boolean = false

  jobCreation: jobCreation = {
    salesman: undefined,
    customer: undefined,
    jobName: undefined,
    jobNumber: undefined,
    plant: undefined,
    expectation: '',
    placement: undefined,
  }

  //Contact / Customer
  contactInfo: IContactInfo = {
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    fName: '',
    lName: '',
    phone: '',
    cell: '',
    notes: ''
  }
  contactEditInfo: IContactInfo = {
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    fName: '',
    lName: '',
    phone: '',
    cell: '',
    notes: ''
  }
  regCustomers: IGetVidVname["success"] = []

  //job name
  jobName: string = ""
  editJobName: string = ""
  regJobName: IGetVidVname["success"] = []


  //job Number
  jobNumber:{
    add: string
    addDate: string
  } = {
    add: "",
    addDate: "",
  }
  regJobNumber: IGetVidVname["success"] = []

  //plant
  plantName: string = ''
  allPlants: IGetVidVname["success"] = []

  jobPlacements: IJobPlacementPerm["success"] = []
  jobServiceDeleteSelected: number
  jobServiceName: string = ""

  activePlacement: number = undefined
  movePlacement: number = undefined

  jobPlacementSelection: IJobPlacementSelected["success"] = []
  jobToAuditSelected: number = undefined

  auditEnabled: boolean = false
  lockMoveBtn: boolean = false
  
}

export const Index = ({ableToAudit, abletoCreateJobs, admin}: {ableToAudit: boolean, abletoCreateJobs: boolean, admin: boolean}) => {

  const {showWindow, showCustomWindow} = useContext(ModalsContext)
  const [ state, dispatch ] = useReducer(reducer, new Init)
  const { obj, addToCheckItems, changeChecked, removeCheckItem, newInitialState } = useCheckbox()
  const router = useRouter()
  const {registeredSalesman, 
    regSalesmanRemoveSelected, 
    regSalesmanSelected, 
    registeredEmployees, 
    lockButton, 
    registerType,
    lockAddButton,
    lockRemoveButton,
    contactInfo,
    regCustomers,
    contactEditInfo,
    jobCreation,
    jobName,
    editJobName,
    regJobName,
    jobNumber,
    regJobNumber,
    plantName,
    allPlants,
    jobPlacements,
    showJobCreation,
    jobServiceName,
    jobServiceDeleteSelected,
    activePlacement,
    movePlacement,
    jobPlacementSelection,
    jobToAuditSelected,
    lockDeleteBtn,
    auditEnabled,
    lockMoveBtn,
  } = state 

  const createNewJob = async (e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.send})
    e.preventDefault()
    const jobPack:IAddNewCustomerJob = {...jobCreation, checkbox: obj}
    const svrResp = await jFetch("job-types/add-new-customer-job", "POST", {...jobPack})
    if (svrResp.success){
      if (jobCreation.placement == activePlacement)
      dispatch({type: EActionType.addToJobPlacement, value: svrResp.value})
    }
    showWindow(svrResp)
    dispatch({type: EActionType.sendComplete})
  }
  const getJobsFromPlacement = useCallback(async(e: ChangeEvent<HTMLSelectElement>["target"]) => {
    dispatch({type: EActionType.rootField, field: e.name, string: e.value})
    const parseValue = parseInt(e.value)
    if (!isNaN(parseValue)){
      const svrResp = await jFetch("job-types/get-job-placement", "POST", {vid: parseValue})
      if (svrResp.success){
        dispatch({type: EActionType.setJobsFromPlace, value: parseValue, vidNameExpect: svrResp.success})
      }
      else dispatch({type: EActionType.setJobsFromPlace, value: parseValue, vidNameExpect: []})
    }
    else dispatch({type: EActionType.setJobsFromPlace, value: parseValue, vidNameExpect: []})
  }, [])
  const openJobCreation = useCallback(() => {
    if (abletoCreateJobs){
      const getRegSalesman = async () => {
        const svrResp: IGetVidVname = await getFetch("job-types/get-registered-salesman")
        if (svrResp.success)
        dispatch({type: EActionType.allRegisteredSalesman, vidName: svrResp.success})
      }
  
      const getRegCustomers = async () => {
        const svrResp:IGetVidVname = await getFetch("job-types/get-registered-customers")
        if (svrResp.success)
        dispatch({type: EActionType.setRegisteredCustomers, vidName: svrResp.success})
      }
  
      const getPlants = async () => {
        const svrResp: IGetVidVname = await getFetch("job-types/get-registered-plants")
        if (svrResp.success)
        dispatch({type: EActionType.rootVidVName, vidName: svrResp.success })
      }

      const getJobService = async () => {
        const svrResp:IPermissions = await getFetch("job-types/get-job-services")
        if (svrResp.success){
          const checkedValues = addCheckedToItems(svrResp.success)
          newInitialState(checkedValues)
        }
      }

      getRegSalesman()
      getRegCustomers()
      getPlants()
      getJobService()

      dispatch({type: EActionType.rootFieldBoolean, field: "showJobCreation", bool: true })
    }
  }, [abletoCreateJobs, newInitialState])
  const deleteJob = useCallback(async () => {
    const parseVal = parseInt(String(jobToAuditSelected))
    if (!isNaN(parseVal)){
      const svrResp:IAlertResponse = await jFetch("job-types/delete-reg-job", "DELETE", {vid: parseVal})
      if (svrResp.alert)dispatch({type: EActionType.removeFromJobSelection})
      showWindow(svrResp)
    }
    else showCustomWindow("Info", "You need to select a job to delete", EWindowType.info)
  }, [jobToAuditSelected, showCustomWindow, showWindow])

  //salesman section
  const openSalesman = useCallback(async () => {
    const svrResp: IGetVidVname = await getFetch("job-types/get-employees")
    if (svrResp.success)
    dispatch({
      type: EActionType.showRegisterTypeWindow, 
      registerWindowType: ERegisterType.salesman,  
      vidName: svrResp.success
    })
  }, [])
  const salesmanChange = useCallback((e: ChangeEvent<HTMLSelectElement>["target"]) => {
    const newValue = parseInt(e.value)
    if (!isNaN(newValue))
      dispatch({type: EActionType.changeRegSelectedSalesman, value: newValue})
    else dispatch({type: EActionType.changeRegSelectedSalesman, value: undefined})
  } ,[])
  const removeSalesmanChange = useCallback((e: ChangeEvent<HTMLSelectElement>["target"]) => {
    const newValue = parseInt(e.value)
    if (!isNaN(newValue))
      dispatch({type: EActionType.changeRegRemoveSalesman, value: newValue})
    else dispatch({type: EActionType.changeRegRemoveSalesman, value: undefined})
  }, [])
  const registerNewSalesman = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.lockAddButton})
    e.preventDefault()
    const svrResp = await jFetch("job-types/set-new-salesman", "POST", {vid: regSalesmanSelected})
    if (svrResp.success)
      dispatch({type: EActionType.addToSalesman})
    showWindow(svrResp)
    dispatch({type: EActionType.unlockAddButton})
  }, [regSalesmanSelected, showWindow])
  const removeOldSalesman = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.lockRemoveButton})
    e.preventDefault()
    const svrResp = await jFetch("job-types/remove-salesman", "POST", {vid: regSalesmanRemoveSelected})
    if (svrResp.alert)
      dispatch({type: EActionType.removeSalesman})
    showWindow(svrResp)
    dispatch({type: EActionType.unlockRemoveButton})
  }, [regSalesmanRemoveSelected, showWindow])

  //finish salesman section

  //customer section
  const changeCustomerInfo = useCallback(e => {
    dispatch({type: EActionType.changeContactInfo, field: e.id, value: e.value})
  }, [])
  const changeEditCustomerInfo = useCallback(e => {
    dispatch({type: EActionType.changeEditContactInfo, field: e.id, value: e.value})
  }, [])
  const registerCustomer = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.lockAddButton})
    e.preventDefault()
    const svrResp: IValueResponse = await jFetch("job-types/register-customer", "POST", {...contactInfo})
    showWindow(svrResp)
    if (svrResp.success) dispatch({type: EActionType.addToCustomer, value: svrResp.value, string: contactInfo.name})
    dispatch({type: EActionType.unlockAddButton})
  }, [contactInfo, showWindow])
  const fetchDetailedCustomerData = useCallback(async (e: number) => {
    const svrResp = await jFetch("job-types/get-detailed-customer", "POST", {v_id: e})
    if(svrResp.success)
    dispatch({type: EActionType.setEditCustomer, contactEditInfo: svrResp.success})
  }, [])
  const openEditCustomer = useCallback(async () => {
    dispatch({type: EActionType.showWindow, registerWindowType: ERegisterType.editCustomer})
    if (jobCreation.customer !== undefined){
      fetchDetailedCustomerData(jobCreation.customer)
    }
  }, [jobCreation.customer, fetchDetailedCustomerData])
  const changeJobCreation = useCallback((e: {value: string, name: string} | ChangeEvent<HTMLSelectElement>["target"]) => {
    const newValue = parseInt(e.value)
    if (!isNaN(newValue)){
      dispatch({type: EActionType.changeJobCreationValue, field: e.name, value: newValue})
      return newValue
    }
    else{
      dispatch({type: EActionType.changeJobCreationValue, field: e.name, value: undefined})
      return undefined
    } 
  
  }, [])
  const getJobNameFromCustomer = useCallback(async (value: number) => {
    const svrResp = await jFetch("job-types/get-jobs-under-customer", "POST", {vid: value}) 
    if(svrResp.success)
      dispatch({type: EActionType.regJobNames, vidName: svrResp.success})
    else dispatch({type: EActionType.regJobNames, vidName: []})
  }, [])
  const getEditCustomerData = useCallback(async (e: ChangeEvent<HTMLSelectElement>["target"]) => {
    const value = changeJobCreation(e)
    if (registerType === ERegisterType.editCustomer && value > 0){
      fetchDetailedCustomerData(value)
    }
    getJobNameFromCustomer(value)
    dispatch({type: EActionType.setJobNumber, vidName: []})
  }, [registerType, changeJobCreation, fetchDetailedCustomerData, getJobNameFromCustomer])
  
  const sendEditedCustomerData = useCallback(async(e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.lockAddButton})
    e.preventDefault()
    const svrResp: IValueResponse = await jFetch("job-types/edit-registered-customer", "POST", {...contactEditInfo, vid: jobCreation.customer})
    showWindow(svrResp)
    if (svrResp.success){
      dispatch({type: EActionType.successEditCustomerName})
    }
    dispatch({type: EActionType.unlockAddButton})
  },[contactEditInfo, jobCreation.customer])

  const getJobNumberFromJobName = useCallback(async (value: string) => {
    const parseValue = parseInt(value)
    if (!isNaN(parseValue)){
      const svrResp = await jFetch("job-types/get-job-number-from-job-name", "POST", {vid: parseValue})
      if (svrResp.success){
        dispatch({type: EActionType.setJobNumber, vidName: svrResp.success})
      }
      else dispatch({type: EActionType.setJobNumber, vidName: []})
    }
    
  }, [])
  const changeJobName = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({type: EActionType.rootField, field: e.target.name, string: e.target.value})
    getJobNumberFromJobName(e.target.value)
  }, [getJobNumberFromJobName])
  const addNewJobName = useCallback(async(e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.lockAddButton})
    e.preventDefault()
    const svrResp:IValueResponse = await jFetch("job-types/add-new-job-name", "POST", {linkId: jobCreation.customer, name: jobName})
    showWindow(svrResp)
    if (svrResp.success)
      dispatch({type: EActionType.addToJobName, value: svrResp.value})
    dispatch({type: EActionType.unlockAddButton})
  }, [jobName, jobCreation.customer])
  const editOldJobName = useCallback(async(e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.lockRemoveButton})
    e.preventDefault()
    const svrResp = await jFetch("job-types/edit-job-name", "POST", {vid: jobCreation.jobName, name: editJobName})
    if (svrResp.success){
      dispatch({type: EActionType.editOldJobName})
    }
    showWindow(svrResp)
    dispatch({type: EActionType.unlockRemoveButton})
  }, [editJobName,  jobCreation.jobName])
  
  const changeSelectedJobName = useCallback(async (e: ChangeEvent<HTMLSelectElement>["target"]) => {
    changeJobCreation(e)
    getJobNumberFromJobName(e.value)
    
  }, [changeJobCreation, getJobNumberFromJobName])

  
  const changeJobNumberInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>["target"]) => {
    dispatch({type: EActionType.changeJobNumberInput, field: e.name, string: e.value})
  }, [])
  const addJobNumber = useCallback(async () => {
    //const newDate = new Date(jobNumber.addDate).toISOString().replace('T',' ').replace('Z','');
    if (jobCreation.jobName > 0){
      const svrResp: IValueResponse = await jFetch("job-types/add-job-number", "POST", {name: jobNumber.add, date: jobNumber.addDate, linkId: jobCreation.jobName})
      if (svrResp.success)
        dispatch({type: EActionType.addToJobNumber, value: svrResp.value})
      showWindow(svrResp)
    }
    else showCustomWindow("Info", "You need to select a job name to attach to the job attribute", EWindowType.info)
  }, [jobNumber.add, jobNumber.addDate, jobCreation.jobName])
  const deleteJobNumber = useCallback(async () => {
    const svrResp:IAlertResponse = await jFetch("job-types/delete-job-number", "POST", {vid: jobCreation.jobNumber})
    if (svrResp.alert) dispatch({type: EActionType.removeJobNumber})
    showWindow(svrResp)
  }, [jobCreation.jobNumber])

  //finish job number registry

  //start plant
  const addPlant = useCallback(async () => {
    const svrResp: IValueResponse = await jFetch("job-types/add-plant", "POST", {name: plantName})
    if(svrResp.success)
      dispatch({type: EActionType.addToPlant, value: svrResp.value})
    showWindow(svrResp)
  }, [plantName])
  const changePlantName = useCallback( (e: React.ChangeEvent<HTMLInputElement>["target"]) => {
    dispatch({type: EActionType.rootField, field: e.name, string: e.value})
  }, [])
  const removePlant = useCallback(async () => {
    const svrResp: IAlertResponse = await jFetch("job-types/remove-plant", "POST", {vid: jobCreation.plant})
    if (svrResp.alert)
      dispatch({type: EActionType.removePlant})
    showWindow(svrResp)
  }, [jobCreation.plant])

  //start job service

  const changeServiceInput = useCallback((e: React.ChangeEvent<HTMLInputElement>["target"]) => {
    dispatch({type: EActionType.rootField, field: "jobServiceName", string: e.value})
  }, [])
  const addService = useCallback( async() => {
    const svrResp: IValueResponse = await jFetch("job-types/add-service", "POST", {name: jobServiceName})
    showWindow(svrResp)
    if (svrResp.success)
      addToCheckItems(svrResp.value, jobServiceName, true)
    showWindow(svrResp)
  }, [jobServiceName, addToCheckItems])
  const removeService = useCallback( async() => {
    const svrResp = await jFetch("job-types/remove-service", "POST", {vid: jobServiceDeleteSelected})
    if (svrResp.alert)
      removeCheckItem(jobServiceDeleteSelected)
    showWindow(svrResp)
  }, [jobServiceDeleteSelected, removeCheckItem])

  const moveJobPlacement = useCallback(async(e: React.FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.rootFieldBoolean, field: "lockMoveBtn", bool: true})
    e.preventDefault()
    const movePlace = parseInt(String(movePlacement))
    const jobId = parseInt(String(jobToAuditSelected))
    const activePlace = parseInt(String(activePlacement))
    if (!isNaN(movePlace) && !isNaN(jobId) && (activePlace !== movePlace)){
      const svrResp = await jFetch("job-types/move-job-placement", "POST", {selectedJob: jobId, movePlacement: movePlace})
      dispatch({type: EActionType.moveJobId})
      showWindow(svrResp)
    }
    else showCustomWindow("Info", "You need to select a Job and a place to move to or you are trying to move to the same job place", EWindowType.info)
    
    dispatch({type: EActionType.rootFieldBoolean, field: "lockMoveBtn", bool: false})
  }, [jobToAuditSelected, movePlacement, activePlacement, ])

  const auditJob = useCallback(() => {
    if (jobToAuditSelected >= values.minInt && jobToAuditSelected <= values.maxInt){
      const path = (router.asPath + "/inAudit/" + jobToAuditSelected)
      router.push(path) 
    } 
    else showCustomWindow('Info', 'You need to select a job to be able to audit', EWindowType.info)
    
  }, [jobToAuditSelected, router])

  useEffect(() => {
    const getJobPlacement = async () => {
      const svrResp: IJobPlacementPerm = await getFetch("job-types/get-all-placements-with-permissions")
      if (svrResp.success)
        dispatch({type: EActionType.setJobPlacement, vidNamePermission: svrResp.success})
    }
    getJobPlacement()
  }, [])
  
  return (
    <div>
      <style jsx>{`
      
      section{
        margin: 6px;
        display: inline-block;
        padding: 8px;
        vertical-align: top;
      }
      header{
        margin-bottom: 6px;
      }
      footer{
        margin-top: 6px;
      }
      td:first-of-type{
        text-align: right;
      }
      textarea{
        width: -moz-available;
        width: -webkit-fill-available;
      }
      .job-selection{
        min-width: 400px;
      }
      .jobCreation{
        display: flex;
        flex-wrap: wrap;
      }
      .jobCreation > hr{
        margin: 0 6px;
      }
      .fillAvail{
        width: fill-available;
      }
      .maxContent{
        max-width: max-content
      }
      @media screen and (max-width: 930px){
        .jobCreation{
          flex-direction: column;
        }
        .jobCreation > hr{
          margin: 6px 0;
        }
      }
      `}</style>
      <Head>
        <title>Job Selection</title>
      </Head>
      <section className='maxContent fillAvail window window-attention job-selection'>
        <header>
          <form style={{display: "flex"}} onSubmit={e => moveJobPlacement(e)}>
            <div style={{display: "inline-block"}}>
              <label>Job Placement </label><br />
              <Selectbox 
                valueSelected={activePlacement} 
                onChange={(e: ChangeEvent<HTMLSelectElement>["target"]) =>{getJobsFromPlacement(e) }} 
                selectInfoText={'---Select Active Placement---'} 
                styling={'max-width: 150px'} 
                name={"activePlacement"}
                obj={jobPlacements} 
              />
            </div>
            <hr style={{margin: "0 6px"}} />
            {abletoCreateJobs && <div style={{display: "inline-block"}}>
              <label>Move To</label><br />
              <Selectbox 
                valueSelected={movePlacement} 
                onChange={(e: ChangeEvent<HTMLSelectElement>["target"]) => dispatch({type: EActionType.rootField, field: e.name, string: e.value})} 
                selectInfoText={'---Select Destination Placement---'} 
                styling={'max-width: 150px'} 
                name={"movePlacement"}
                obj={jobPlacements} 
                />
              <LockSubmitButton 
                text={'Move'} 
                loadingText={'Moving Job...'} 
                disabled={lockMoveBtn} 
                
              />
            </div>}
          </form>
        </header>
        <hr />
        <div style={{overflow: "auto"}}>
          <label style={{position: "sticky", left: "0"}}>Select a job below</label><br />
          <Selectbox 
            valueSelected={jobToAuditSelected} 
            onChange={(e: ChangeEvent<HTMLSelectElement>["target"]) => dispatch({type: EActionType.rootField, field: "jobToAuditSelected", string: e.value})} 
            styling={'min-width: max-content; width: fill-available; width: -moz-available; width: -webkit-fill-available; margin: 6px 0;'} 
            showHelper={false}
            size={16}
            obj={jobPlacementSelection} 
          />
        </div>
        <hr />
        <footer>
          {ableToAudit && auditEnabled && <button onClick={() => auditJob()}>Audit Selected Job</button>}
          {abletoCreateJobs && <><button onClick={() => openJobCreation()}>Create Job</button>
          <LockSubmitButton 
            text='Delete Job'
            loadingText='Deleting Selected Job'
            disabled={lockDeleteBtn} 
            type="button"
            onClick={deleteJob}
            />
          </>}
        </footer>
      </section>
      {abletoCreateJobs && showJobCreation &&
      <section className='window window-attention'>
        <div className="jobCreation">
          <form onSubmit={e => createNewJob(e)}>
            <table>
              <caption>Job Creation</caption>
              <thead></thead>
              <tbody>
                <tr>
                  <td>
                    <label>Salesman:</label>
                  </td>
                  <td>
                    <Selectbox 
                      valueSelected={jobCreation.salesman} 
                      onChange={changeJobCreation} 
                      selectInfoText={'---Select A Salesman---'} 
                      obj={registeredSalesman} 
                      styling={`width: 200px;`}
                      name={"salesman"}
                    />
                  </td>
                  <td>
                    <button className='fillAvail' type="button" onClick={() => openSalesman()}>Add/Remove</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Customer:</label>
                  </td>
                  <td>
                    <Selectbox 
                      valueSelected={jobCreation.customer} 
                      onChange={getEditCustomerData} 
                      selectInfoText={'---Select A Customer---'} 
                      styling={'width: 200px;'} 
                      obj={regCustomers} 
                      name="customer"
                    />
                  </td>
                  <td style={{display: "flex"}}>
                    <button className='fillAvail' type="button" onClick={() => dispatch({type: EActionType.showWindow, registerWindowType: ERegisterType.customer})}>Add</button>
                    <button className='fillAvail' type="button" onClick={() => openEditCustomer()}>Edit</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Job Name:</label>
                  </td>
                  <td>
                    <Selectbox 
                      valueSelected={jobCreation.jobName} 
                      onChange={changeSelectedJobName} 
                      selectInfoText={'---Select Job Name---'} 
                      styling={'width: 200px;'} 
                      name={'jobName'}
                      obj={regJobName} />
                  </td>
                  <td>
                    <button className='fillAvail' type="button" onClick={() => dispatch({type: EActionType.showWindow, registerWindowType: ERegisterType.jobName})}>Add/Edit</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Job Number:</label>
                  </td>
                  <td>
                    <Selectbox 
                      valueSelected={jobCreation.jobNumber} 
                      onChange={changeJobCreation}
                      selectInfoText={'---Select Job Number---'} 
                      styling={'width: 200px;'} 
                      name={"jobNumber"}
                      obj={regJobNumber} />
                  </td>
                  <td>
                    <button className='fillAvail' onClick={() => dispatch({type: EActionType.showWindow, registerWindowType: ERegisterType.jobNumber})} type="button">Add/Delete</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Plant:</label>
                  </td>
                  <td>
                    <Selectbox 
                      valueSelected={jobCreation.plant} 
                      onChange={changeJobCreation} 
                      selectInfoText={'---Select A Plant---'} 
                      styling={'width: 200px;'} 
                      obj={allPlants} 
                      name={"plant"} 
                    />
                  </td>
                  <td>
                    {admin && <button className='fillAvail' onClick={() => dispatch({type: EActionType.showWindow, registerWindowType: ERegisterType.plant})} type="button">Add/Delete</button>}
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Job Placement:</label>
                  </td>
                  <td>
                    <Selectbox 
                      valueSelected={jobCreation.placement} 
                      onChange={changeJobCreation} 
                      selectInfoText={'---Select a placement---'} 
                      styling={'width: 200px;'} 
                      name={'placement'}
                      obj={jobPlacements} />                
                    </td>
                  <td>
                    
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Job Expectation:</label>
                  </td>
                  <td colSpan={2}>
                    <textarea 
                    value={jobCreation.expectation}
                    style={{
                      width: "294px", 
                      height: "114px", 
                      maxWidth: "294px", 
                      maxHeight: "114px"
                    }} 
                    placeholder="Info: What do you expect the job to arrive with? What the auditers should do to it's contents? OBS: auditers will see all of this box contents"
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => dispatch({type: EActionType.changeJobExpectation, string: e.target.value})}
                    />
                    
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Services:</label>
                  </td>
                  <td>
                    <CheckboxArr 
                      options={obj} 
                      checkHandler={changeChecked} />
                  </td>
                  <td>
                    <button className='fillAvail' onClick={() => dispatch({type: EActionType.showWindow, registerWindowType: ERegisterType.services})} type="button">Add/Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <LockSubmitButton text={'Create Job'} loadingText={'Creating Job'} disabled={lockButton} />
          </form >
          {(registerType >= 0 && registerType <= 7) && <><hr />
            {registerType === ERegisterType.salesman ? 
              <RegisterSalesman 
                employees={registeredEmployees}
                onChange={salesmanChange}
                onChangeRemove={removeSalesmanChange}
                valueSelected={regSalesmanSelected}
                newSalesman={registerNewSalesman}
                removeSalesman={removeOldSalesman}
                selectedSalesman={regSalesmanRemoveSelected}
                salesman={registeredSalesman} 
                btnRegisterSalesman={lockAddButton} 
                btnRemoveSalesman={lockRemoveButton}
              /> : registerType === ERegisterType.customer ?
              <RegisterCustomer 
                contactInfo={contactInfo} 
                lockButton={lockAddButton} 
                inputChange={changeCustomerInfo}
                registerNewCustomer={registerCustomer}
              /> : registerType === ERegisterType.editCustomer ?
              <EditCustomer 
                contactEditInfo={contactEditInfo} 
                lockButton={lockAddButton} 
                inputChange={changeEditCustomerInfo} 
                editCustomer={sendEditedCustomerData} 
              /> : registerType === ERegisterType.jobName ?
              <JobName 
                addNewJobName={addNewJobName} 
                editJobName={editOldJobName} 
                inputChange={changeJobName} 
                vJobName={jobName} 
                vEditJobName={editJobName} 
                lockAddBtn={lockAddButton} 
                lockEditBtn={lockRemoveButton} 
              /> : registerType === ERegisterType.jobNumber ?
              <JobNumber 
                collection={jobNumber} 
                addFunc={addJobNumber} 
                deleteFunc={deleteJobNumber}
                inputFunc={changeJobNumberInput}
              /> : registerType === ERegisterType.plant && admin ?
              <Plant 
                addString={plantName}
                addFunc={addPlant} 
                deleteFunc={removePlant} 
                inputFunc={changePlantName} 
              /> : registerType === ERegisterType.services &&
              <Services 
                addString={jobServiceName}
                addFunc={addService}
                deleteFunc={removeService}
                inputFunc={changeServiceInput}
                optionsToRemove={obj} 
                removeSelected={jobServiceDeleteSelected} 
                removeChangeFunc={(e: React.ChangeEvent<HTMLInputElement>["target"]) => dispatch({type: EActionType.rootFieldNumber, field: "jobServiceDeleteSelected", value: parseInt(e.value)})}              
              />
            }
          </>}
          
        </div>
      </section>}
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
    if(reqPermission.canCreateJobs === true || reqPermission.canAudit === true) return {props: {
      ableToAudit: reqPermission.canAudit === true ? true : false,
      abletoCreateJobs: reqPermission.canCreateJobs === true ? true : false,
      admin: reqPermission.isAdmin === true ? true : false
    }};
    else return {notFound : true}
  })
  return value
}