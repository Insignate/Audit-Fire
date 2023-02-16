import React, { useCallback } from 'react'
import { IGetValueVidVname } from '../../tsTypes/psqlResponses'
import Selectbox from '../Selectbox'

interface ISearchCustomerJob{
  jobsFound: IGetValueVidVname['value']
  fnSelectedJob: (value: string) => void 
  selectedJob: string
}

const SearchCustomerJob = ({
  jobsFound,
  fnSelectedJob,
  selectedJob
}: ISearchCustomerJob) => {

  
  const jobSelectedSet = useCallback((e: string) => {
    fnSelectedJob(e)
  }, [fnSelectedJob])

  return (
    <>
      <label>Customer Job Selection</label>
      <hr style={{margin: '6px 0'}} />
      <Selectbox
        valueSelected={selectedJob} 
        onChange={e => jobSelectedSet(e.value)} 
        obj={jobsFound}
        size={18}
        showHelper={false}
        styling={'width: 100%;'}
      />
    </>
  )
}

export default SearchCustomerJob

export const getStaticProps = () => {
  return {notFound: true}
}