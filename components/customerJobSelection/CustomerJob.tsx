import React, { useCallback, useEffect, useState } from 'react'
import { IGetVidVname } from '../../database/postgres/jobRegistry/dbCom'
import { getFetch, jFetch } from '../../utils/fetchs'
import Selectbox from '../Selectbox'

interface ICustomerJob{
  fnCustomer?: (e: number) => void
  fnJobName?: (e: number) => void
  fnJobNumber?: (e: number) => void
  fnSalesman?: (e: number) => void
  fnPlant?: (e: number) => void
}

export const CustomerJob = ({
  fnCustomer = () => {}, 
  fnJobName = () => {},
  fnJobNumber = () => {},
  fnSalesman = () => {},
  fnPlant = () => {},

}: ICustomerJob) => {
  const [customerSelected, setCustomerSelected] = useState(0)
  const [svrCustomer, setSvrCustomer] = useState([])
  const [jobNumberSelected, setJobNumberSelected] = useState(0)
  const [svrJobNumber, setSvrJobNumber] = useState([])
  const [jobNameSelect, setJobNameSelect] = useState(0)
  const [svrJobName, setSvrJobName] = useState([])
  const [salesmanSelect, setSalesmanSelect] = useState(0)
  const [svrSalesman, setSvrSalesman] = useState([])
  const [plantSelect, setPlantSelect] = useState(0)
  const [svrPlant, setSvrPlant] = useState([])
  
  const getJobNames = useCallback(async (value: number) => {
    if (value > 0){
      fnCustomer(value)
      const svrResp = await jFetch("job-types/get-jobs-under-customer", "POST", {vid: value}) 
      if(svrResp.success)
        setSvrJobName(svrResp.success)
      else {
        setSvrJobName([])
        setSvrJobNumber([])
        setJobNameSelect(0)
        setJobNumberSelected(0)
        fnCustomer(0)
        fnJobName(0)
        fnJobNumber(0)
        
      }
    }
    else {
      setSvrJobName([])
      setSvrJobNumber([])
      setJobNameSelect(0)
      setJobNumberSelected(0)
      fnCustomer(0)
      fnJobName(0)
      fnJobNumber(0)
    }
    
  }, [setSvrJobName, fnCustomer, fnJobName, fnJobNumber])

  const getJobNumbers = useCallback(async (e: number) => {
    if (e > 0){
      const svrResp = await jFetch("job-types/get-job-number-from-job-name", "POST", {vid: e})
      if (svrResp.success){
        setSvrJobNumber(svrResp.success)
      }
      else {
        setSvrJobNumber([])
        setJobNumberSelected(0)
        fnJobNumber(0)
      }
    }
    else {
      setSvrJobNumber([])
      setJobNumberSelected(0)
      fnJobNumber(0)
    }
  },[setSvrJobNumber, fnJobNumber])

  const customerJobSelect = useCallback((e: number) => {
    setCustomerSelected(isNaN(e) ? 0 : e)
    getJobNames(e)
  }, [setCustomerSelected, getJobNames])

  const jobNameSet = useCallback((e: number) => {
    setJobNameSelect(isNaN(e) ? 0 : e)
    fnJobName(e)
    getJobNumbers(e)
  }, [setJobNameSelect, fnJobName, getJobNumbers])
  const jobNumberSet = useCallback((e: number) => {
    setJobNumberSelected(isNaN(e) ? 0 : e)
    fnJobNumber(e)
  }, [fnJobNumber, setJobNumberSelected])

  const salesmanSet = useCallback((e: number) => {
    setSalesmanSelect(isNaN(e) ? 0 : e)
    fnSalesman(e)
  }, [fnSalesman])
  
  const plantSet = useCallback((e: number) => {
    setPlantSelect(e)
    fnPlant(e)
  }, [fnPlant])

  
  
  useEffect(() => {
    const getSvrSalesman = async () => {
      const svrResp: IGetVidVname = await getFetch("job-types/get-employees")
      if (svrResp.success)
        setSvrSalesman(svrResp.success)
    }
    const getRegCustomers = async () => {
      const svrResp:IGetVidVname = await getFetch("job-types/get-registered-customers")
      if (svrResp.success)
      setSvrCustomer(svrResp.success)
    }
    const getPlants = async () => {
      const svrResp: IGetVidVname = await getFetch("job-types/get-registered-plants")
      if (svrResp.success)
      setSvrPlant(svrResp.success)
    }
    getPlants()
    getRegCustomers()
    getSvrSalesman()
  }, [])
  return (
    <>
      <label>Salesmasn:</label>
      <Selectbox 
        valueSelected={salesmanSelect} 
        onChange={e => salesmanSet(parseInt(e.value))} 
        obj={svrSalesman} 
        selectInfoText='---Select Salesman---'
        required={false}
      />
      <label>Customer Name: </label>
      <Selectbox 
        valueSelected={customerSelected} 
        onChange={e => customerJobSelect(parseInt(e.value))} 
        obj={svrCustomer} 
        selectInfoText='---Select Customer---'
        required={false}
      />
      <label>Job Name:</label>
      <Selectbox 
        valueSelected={jobNameSelect} 
        onChange={e => jobNameSet(parseInt(e.value))} 
        obj={svrJobName}
        selectInfoText='---Select Job Name---'
        required={false}
      />
      <label>Job Number:</label>
      <Selectbox 
        valueSelected={jobNumberSelected} 
        onChange={e => jobNumberSet(parseInt(e.value))} 
        obj={svrJobNumber} 
        selectInfoText='---Select Job Number---'
        required={false}
      />
      <label>Plant:</label>
      <Selectbox 
        valueSelected={plantSelect} 
        onChange={e => plantSet(parseInt(e.value))} 
        obj={svrPlant} 
        selectInfoText='---Select Plant---'
        required={false}
      />      
    </>
  )
}

export default CustomerJob

export const getStaticProps = () => {
  return {notFound: true}
}