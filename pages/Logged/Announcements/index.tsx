import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { SelfLockSubmitButton } from '../../../components/buttons'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { screenSize } from '../../../styles/GlobalStyle'
import { IGetAllAnnounces, IValueResponse } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { ModalsContext } from '../../../utils/Modals'

interface IAct{
  type: EAct
  field?: string,
  value?: string | number | boolean | IGetAllAnnounces['value']
  number?: number
  bool?: boolean
}

enum EAct {
  rootField,
  setNewAnnounce,
  removeAnnounce,
  changeAnnounceStatus
}

const reducer = (state: Init, action: IAct) => {
  switch(action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    case EAct.setNewAnnounce:
      return {...state, announces: [...state.announces, 
        {
          info: state.newAnnouncement, 
          show: state.showAnnounce,
          id: action.number,
          person_name: ''
        }
      ]}
    case EAct.removeAnnounce:
      return {...state, announces: state.announces.filter(item => item.id !== action.number)}
    case EAct.changeAnnounceStatus:
      return {...state, announces: state.announces.map(item => 
        item.id === action.number ? {...item, show: action.bool} : item
      )}

    default: return state
  }
}

class Init{
  newAnnouncement = ''
  showAnnounce = false

  announces: IGetAllAnnounces['value'] = []
}

const Index = () => {

  const [state, dispatch] = useReducer(reducer, new Init)
  const {showWindow} = useContext(ModalsContext)
  const {
    newAnnouncement,
    showAnnounce,
    announces,
  } = state

  const saveAnnouncement = useCallback(async () => {
    const svrResp:IValueResponse = await jFetch('others/set-announces', 'POST', {announce: newAnnouncement, show: showAnnounce})
    if(svrResp.success)
      dispatch({type: EAct.setNewAnnounce, number: svrResp.value})
    showWindow(svrResp)
  }, [newAnnouncement, showAnnounce])

  const deleteAnnounce = useCallback(async (deleteId: number) => {
    const svrResp = await jFetch('others/delete-announce', 'DELETE', {v_id: deleteId})
    if(svrResp.success) dispatch({type: EAct.removeAnnounce, number: deleteId})
    showWindow(svrResp)
  }, [])

  const changeStatus = useCallback(async (id: number, status: boolean) => {
    const svrResp = await jFetch('others/change-announce-status', 'POST', {id, status})
    if (svrResp.success)
      dispatch({type: EAct.changeAnnounceStatus, number: id, bool: status })
  }, [])

  useEffect(() => {
    const getAnnounces = async () => {
      const svrResp = await getFetch('others/get-all-announces')
      if(svrResp.success){
        dispatch({type: EAct.rootField, field: 'announces', value: svrResp.value})
      }
    }
    getAnnounces()
  }, [])
  return (
    <div>
      <style jsx>{`
        .window{
          margin: 6px;
        }  
        div > form, div > section{
          float: left;
          display: flex;
          flex-direction: column;
        }
        section > textarea{
          max-width: calc(100vw - 200px);
          min-height: 150px;
          min-width: 200px;
        }
        table td, table th{
          padding: 0 2px;
        }
        table tr{
          text-align: center;
          border-bottom: solid 2px var(--foreground);
        }
        @media ${screenSize.medium}{
          form > textarea{
            max-width: calc(100vw - 100px);
          }
        }
      `}</style>
      <Head>
        <title>Set Announces</title>
      </Head>
      <section className='window window-alert'>
        <label htmlFor='info'>Create Announcement</label>
        {useMemo(() => <textarea 
          id='info' 
          placeholder='Enter Announcement' 
          value={newAnnouncement}
          onChange={e => dispatch({type: EAct.rootField, field: 'newAnnouncement', value: e.target.value})}
          maxLength={500}
        />, [newAnnouncement])}
        {useMemo(() => <label>{newAnnouncement.length} characters out of 500</label>, [newAnnouncement])}
        <label>{useMemo(() => <input 
          type='checkbox'
          checked={showAnnounce}
          onChange={() => dispatch({type: EAct.rootField, field: 'showAnnounce', value: !showAnnounce})}
          
        />, [showAnnounce])} Show Announcement</label>
        <hr style={{margin: '6px 0'}} />
        <SelfLockSubmitButton 
          text='Save' 
          loadingText='Creating...' 
          onClick={() => saveAnnouncement()} 
        />
      </section>
      <form onClick={e => e.preventDefault()} className='window window-alert'>
        <table>
          <caption>Registered Announcements</caption>
          <thead>
            <tr>
              <th>Description</th>
              <th>Status</th>
              <th>Announcer</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {announces.map(({info, show, id, person_name}) => 
              <tr key={id}>
                <td style={{maxWidth: '500px'}}>{info}</td>
                <td>{show === true ? 'shown' : 'hidden'}</td>
                <td>{person_name}</td>
                <td className='td-buttons'>
                  <p><SelfLockSubmitButton 
                    text={show === true ? 'hide' : 'show'} 
                    loadingText={show === true ? 'hidding...' : 'changing...'}
                    onClick={() => changeStatus(id, !show)}
                    styling='width: 100%;'
                  /></p>
                  <p><SelfLockSubmitButton 
                    text='Remove' 
                    loadingText='Deleting...' 
                    onClick={() => deleteAnnounce(id)} 
                    styling='width: 100%;'
                  /></p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </form>
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
    if(reqPermission.canAnnounce === true) return {props: {
      pass: true
    }};
    else return {notFound : true}
  })
  return value
}