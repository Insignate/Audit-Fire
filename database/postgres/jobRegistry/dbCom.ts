import { IContactInfo, IEditExistingCustomerJob } from "../../../schemas/inputValidation";
import { IAlertResponse, IBasicResponse, IJobPlacementPerm, IJobPlacementSelected, IJobSingleFullName, IValueResponse } from "../../../tsTypes/psqlResponses";
import { values } from "../../../utils/valueConfig";
import { getDB } from "../connection";
const { db } = getDB()

export interface IGetVidVname{
  success?: Array<{
    v_id: number
    v_name: string
  }>
  info?: string
  error?:string
}

export const getDbEmployees = async (): Promise<IGetVidVname> => {
  try {
    const svrResp = await db.func("user_get_all");
    if (svrResp.length >=1)
      return {success: svrResp}
    else 
      return {info: "No Salesman Registered"};
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get salesman"};
  }
}

export const getDbSalesman = async (): Promise<IGetVidVname> => {
  try {
    const svrResp = await db.func("job_get_salesman");
    if (svrResp.length >=1) return {success: svrResp}
    else if(svrResp.length <= 0) return {info: "No Salesman Registered"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not retrieve Salesman"}
  }
}

export const setDbSalesman = async (newSalesman: number): Promise<IBasicResponse> => {
  try {
    const svrResp = await db.func("job_set_salesman", [newSalesman]);
    const salesman = svrResp[0].job_set_salesman;
    if (salesman > 0) return {success: "New Salesman Registered "}
    else return {info: "Salesman Already Registered or Doesn't exists!"}
  } catch (err) {
    console.error(err.message)
    return {error: "Could Not Set New Salesman"}
  }
}

export const removeDbSalesman = async (removeSalesman: number): Promise<IBasicResponse> => {
  try {
    const svrResp = await db.func("job_delete_salesman", [removeSalesman])
    const deletedSalesman = svrResp[0].job_delete_salesman;
    if (deletedSalesman > 0) return {alert: "Salesman Deleted"}
    else return {error: "Salesman Doesn't exists or was not deleted"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not delete Salesman"}
  }
}

export const registerDbCustomer = async (contactInfo: IContactInfo): Promise<IValueResponse> => {
  const {name, address, city, state, country, zip, fName, lName, phone, cell, notes} = contactInfo
  const parsedZip = parseInt(zip)
  let newZip = null
  if (!isNaN(parsedZip)){
    if (parsedZip > values.maxInt) return {info: "the max value for zip code is: " + values.maxInt}
    newZip = parsedZip
  }
  
  try {
    const svrResp = await db.func("job_insert_customer", [
      name, address, city, state, country, newZip, fName, lName, phone, cell, notes
    ]);
    if (svrResp[0].job_insert_customer > 0) return({success: "customer registered", value: svrResp[0].job_insert_customer});
    else return {error: "Could not register customer"}
  } catch (err) {
    console.error(err);
    return {info: "Customer Already Registered"}
  }
}

export const getDbCustomers = async (): Promise<IGetVidVname> => {
  try{
    const svrResp = await db.func("job_get_customers");
    if(svrResp.length > 0) return {success: svrResp} 
    else return {error: "No customers Registered"};
  }
  catch(error){
    console.error(error)
    return{info: "Could not retrieve customers"}
  }
  
  
}

export interface IRespContactInfo{
  success?: IContactInfo
  info?: string
  error?: string
}

export const getDbDetailedCustomer = async(vid: number):Promise<IRespContactInfo> => {
  try {
    const svrResp:IContactInfo = await db.func("job_get_customer", [vid]);
    if(vid > 0) return {success: svrResp[0]}
    else return {info: "Customer Not Found"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get customer "}
  }
}

export const editDbCustomer = async(customerEditInfo: IEditExistingCustomerJob):Promise<IValueResponse> => {
  const {vid, name, address, city, state, country, zip, fName, lName, phone, cell, notes} = customerEditInfo
  const parsedZip = parseInt(zip)
  let newZip = null
  if (!isNaN(parsedZip)){
    if (parsedZip > values.maxInt) return {info: "the max value for zip code is: " + values.maxInt}
    newZip = parsedZip
  }
  try {
    const svrResp = await db.func("job_edit_customer", [vid, name, address, city, state, newZip, fName, lName, phone, cell, notes, country])
    const destructured = svrResp[0].job_edit_customer;
    if (destructured > 0) return {success: "Customer Edited", value: destructured}
    else return {info: "Customer was not edited/doesn't exists"}
  } catch (err) {
    console.error(err);
    return {error: "Could not edit customer"}
  }




}

export const registerNewJobName = async(linkId: number, name: string) => {
  try {
    const psqlResp = await db.func("job_insert_job_name", [linkId, name]);
    const destructured = psqlResp[0].job_insert_job_name;
    if (destructured > 0) return {success: "Registered", value: destructured}
    else return {info: "Invalid/Already Exists"}
  } catch (err) {
    console.error(err);
    return {info: "Could not register/Already Exists"}
  }
}

export const getDbJobsFromCustomer = async(vid: number):Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("job_get_from_customer", [vid]);
    if (psqlResp.length > 0) return {success: psqlResp}; 
    return {info: "No jobs registered for this customer"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get jobs from customer"}
  }
}

export const editDbJobName = async(vid: number, name: string):Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("job_edit_name", [vid, name]);
    const jobEdit = psqlResp[0].job_edit_name;
    if (jobEdit > 0)return {success: "Job Edited!", value: jobEdit}
    else return {info: "Job name was not edited"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not edit job name"}
  }
}

export const addDbJobNumber = async(name: string,jobDate: Date, linkId: number):Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("job_add_number", [linkId, name, jobDate]);
    const resp = psqlResp[0].job_add_number;
    if (resp > 0) return {success: "New Job Number Registered", value: resp}
    else return {info: "Job number already exists"}
  } catch (err) {
    console.error(err);
    return {error: "Could not register job or already exists"}
  }
}

export const getDbJobNumberFromJobName = async (vid: number) => {
  try {
    const psqlResp = await db.func("job_get_number_from_name", [vid]);
    if (psqlResp.length > 0) return {success: psqlResp}
    else return {info: "No job number over the registered job name"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not get job number"}
  }
}

export const deleteDbJobNumber = async (vid: number):Promise<IAlertResponse> => {
  try {
    const psqlResp = await db.func("job_delete_number", [vid])
    if (psqlResp[0].job_delete_number > 0) return {alert: "Job deleted Successfully"}
    return {info: "Job number was not deleted"}
  } catch (err) {
    console.error(err)
    return {error: "Could not delete job number selected"}
  }

}

export const getDbPlants = async ():Promise<IGetVidVname> => {
  try {
    const psqlResp = await db.func("job_get_plants")
    if (psqlResp.length > 0) return {success: psqlResp}
    return {info: "No plants registered"}
  } catch (err) {
    console.error(err)
    return {error: "Could not get plants"}
  }
}

export const setDbPlant = async (name: string):Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("job_set_plant", [name])
    if (psqlResp.length > 0)
      return {success: "Plant Inserted", value: psqlResp[0].job_set_plant}
    return {info: "No plant added or already exists"}
  } catch (err) {
    console.error(err)
    return {error: "Could not set plant or already exists"}
  }
}

export const deleteDbPlant = async(vid: number) => {
  try {
    const psqlResp = await db.func("job_delete_plant", [vid])
    if (psqlResp.length > 0)
    return {alert: "Plant deleted"}
    return {info: "No plant delete or already doesn't exists"}
  } catch (error) {
    console.error(error)
    return {error: "Could not delete plant or it is already deleted"}
  }
}

export const addDbService = async(name: string):Promise<IValueResponse> => {
  try {
    const psqlResp = await db.func("job_add_service", [name]);
    const serviceResp = psqlResp[0].job_add_service;
    if (serviceResp > 0) return {success: "Service Added", value: serviceResp}
    else return {info: "Service was not added or already exists"}
  } catch (err) {
    console.error(err);
    return {error: "Could not add service or already exists"}
  }
}

export const getDbServices = async() => {
  try {
    const psqlResp = await db.func("job_get_services");
    if (psqlResp.length > 0) return {success: psqlResp}
    return {info: "No job services registered"}
  } catch (err) {
    console.error(err.message);
    return {info: "Could not get job services"}
  }
}

export const deleteDbService = async(vid: number): Promise<IAlertResponse> => {
  try {
    const psqlResp = await db.func("job_delete_service", [vid]);
    const value = psqlResp[0].job_delete_service;
    if (value > 0) return {alert: "Service Deleted"}
    return {info: "Service already deleted"}
  } catch (err) {
    console.error(err.message)
    return {info: "Could not delete service or is already deleted"}
  }
}

export const addDbCustomerJob = async (salesman: number, customer: number, jobName: number, jobNumber:number, plant: number, expectation: string, placement: number, checkbox: Array<{v_id: number, checked: boolean}>) => {
  try {
    const psqlResp = await db.func("job_add_customer_job", [salesman, customer, jobName, jobNumber, placement, plant, expectation])
    const value = psqlResp[0].job_add_customer_job;
    if (value > 0){
      const services = await editDbJobServices(value, checkbox);
      if (services.success) return {success: "Job Created", value}
      return {error: "Job was not created"}
    }
    return {error: "Job was not created"}
  } catch (err) {
    console.error(err.message);
    return {error: "Could not create job"}
  }
}

export const editDbJobServices = async (vid: number, checkbox: Array<{v_id: number, checked: boolean}>) => {
  try {
    const modJobServices = checkbox.map(({v_id, checked}) => {return {v_id, checked}});
    const psqlResp = await db.func("job_edit_customer_services", [vid, JSON.stringify(modJobServices)])
    const value = psqlResp[0].job_edit_customer_services;
    if (value === true) return {success: "Job service set"}
    return {error: "Job Service was not set"}
  } catch (err) {
    console.error(err.message);
    return {info : "Could not edit services"}
  }
}

export const getDbJobsFromPlacement = async (vid: number): Promise<IJobPlacementSelected> => {
  try {
    const psqlResp = await db.func("job_get", [vid]);
    if(psqlResp.length > 0) return {success: psqlResp}
    else return {info: "No Jobs Registered under the selected option"}
  } catch (err) {
    console.error(err.message);
    return {info: "Could not get registered jobs"}
  }

}

export const deleteDbPlacedJob =  async (vid: number):Promise<IAlertResponse> => {
  try {
    const deleteJob = await db.func('job_delete', [vid])
    if (deleteJob[0].job_delete > 0)
      return {alert: 'Job Deleted'}
    else return {info: 'Job Already Has Audits And Cannot Be Deleted'}
  } catch (err) {
    console.error(err)
    return {error: 'Job Already Has Audits And Cannot Be Deleted'};
  }
}

export const getDbJobPlacementPerm = async (): Promise<IJobPlacementPerm> => {
  let arr: IJobPlacementPerm["success"] = [];
  let found = false;
  try {
    const psqlResp = await db.func('job_get_reg_placement');
    if (psqlResp.length > 0) {
      psqlResp.forEach(({v_id, v_permissions, v_name}) => {
        found = false;
        for(let i = 0; i <= arr.length-1; i++){
          if (arr[i].v_id === v_id) {
            arr[i]['v_permissions'].push(v_permissions);
            found = true;
            i = arr.length;
          }
        }
        if (found === false)arr.push({v_id, v_permissions : [v_permissions], v_name}) 
      })
      return {success: arr}
    }
    else return {info: "No jobs placement registered"}
  } catch (error) {
    console.error(error);
    return {error: "Could not get job placements"}
  }
    

}

export const moveDbJobPlacement =  async (selectedJob: number, movePlacement: number) => {
  try {
    const moveJob = await db.func('job_move_audit_place', [selectedJob, movePlacement]);
    if (moveJob[0].job_move_audit_place > 0)
    return {success: "Job Moved!"};
    return {info: "No job was moved"};
  } catch (error) {
    console.error(error)
    return {error: "Could not move the job selected"}
  }
}

export const getSingleFullJobName = async (vid: number):Promise<IJobSingleFullName> => {
  try {
    const psqlResp = await db.func('job_get_full_name', [vid])
    if (psqlResp.length > 0) return {success: psqlResp[0]}
    return {info: "No job found"}
  } catch (err) {
    console.error(err)
    return{error: "Could not get job name"}
  }
}