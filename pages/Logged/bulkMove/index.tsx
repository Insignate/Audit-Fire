import { NextApiRequest, NextApiResponse } from 'next'
import Head from 'next/head'
import React, { useCallback, useContext, useReducer } from 'react'
import AboutQMark, { AboutQMarkTag } from '../../../components/AboutQMark'
import { LockSubmitButton } from '../../../components/buttons'
import Image from '../../../components/Image'
import { EOrderAuditPermission } from '../../../permissions/dbRegisterPerm'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { IBulkMove } from '../../../tsTypes/psqlResponses'
import { getCookie } from '../../../utils/customCookies'
import { jFetch } from '../../../utils/fetchs'
import { DialogModalContext, EDialogWindowType } from '../../../utils/ModalDialog'
import { EWindowType, ModalsContext } from '../../../utils/Modals'


interface IActionType{
  type: EActionType
  number?: number
  string?: string
  arrAudits?: Array<string>
  arrPerm?: Array<number>
}

enum EActionType {
  removeAsset,
  changeAsset,
  changeLocation,
  auditPermission
}

const reducer = (state: Init, action: IActionType) => {
  switch(action.type){
    case EActionType.removeAsset:
      delete state.assetTag[action.number]
      return {...state, assetTag: state.assetTag.flat()}
    case EActionType.changeLocation:
      return {...state, location: action.string}
    
    case EActionType.changeAsset:
      if (action.number+1 >= state.assetTag.length)
      state.assetTag[action.number+1] = {number: '', problem: EOrderAuditPermission.ableToEdit}
      state.assetTag[action.number] = {number: action.string, problem: EOrderAuditPermission.ableToEdit}
      return {...state, assetTag: [...state.assetTag]}
    case EActionType.auditPermission:
      if(action.arrAudits?.length > 0){
        const newArr = []
        for(var i = 0; i < action.arrAudits.length; i++)
          newArr.push({number: parseInt(action.arrAudits[i]), problem: action.arrPerm[i]})
        newArr.push({number: '', problem: EOrderAuditPermission.ableToEdit})
        return {...state, assetTag: newArr}
      }
    return state
      
    default: return state
  }
}

class Init{
  assetTag: Array<{number: string, problem: EOrderAuditPermission}> = 
  [{number: '', problem: EOrderAuditPermission.ableToEdit}]
  location: string = ''
}

const Index = () => {

  const [state, dispatch] = useReducer(reducer, new Init())
  const {assetTag, location} = state
  const {showDialog} = useContext(DialogModalContext)
  const {showWindow, showCustomWindow} = useContext(ModalsContext)

  const changeAssetTag = useCallback((value: string, index: number) => {
    dispatch({type: EActionType.changeAsset, string: value, number: index})
  }, [])
  const removeAsset = useCallback((index: number) => {
    dispatch({type: EActionType.removeAsset, number: index})
  }, [])

  const sendBulkMove = useCallback( async (e = false) => {
    //@ts-ignore
    const assets = [...new Set((assetTag.filter(item => item.number !== '')).map(item => parseInt(item.number)))]
    if (location.trim() === '') return showCustomWindow('Info', 'You need to at enter a location!', EWindowType.info)
    if (assets.length <= 0) return showCustomWindow('Info', 'You need enter assets!', EWindowType.info)
    const svrResp: IBulkMove = await jFetch('audit/bulk-move', 'POST', {assets, location, force: e})
    dispatch({type: EActionType.auditPermission, arrAudits: svrResp.audit_id, arrPerm: svrResp.perm})
    if (svrResp.ask && e === false) showDialog('Info', 'Some audits needs confirmation and others needs administrator privileges, do you want to confirm those changes?', EDialogWindowType.red, async () => await sendBulkMove(true), 'Confirm', 'Cancel')
    showWindow(svrResp)
    
  }, [assetTag, location])

  const formBulkMove = useCallback((e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendBulkMove()
  }, [sendBulkMove])

  return (
    <form onSubmit={e => formBulkMove(e)}>
      <style jsx>{`
      form{
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      section{
        display: inline-block;
      }
      .window{
        margin: 8px;
      }
      .assets{
        width: 170px;
      }
      .asset-tags{
        display: flex;
        overflow-y: auto;
      }
      .asset-tags > input{
        flex-grow: 1;
        flex-shrink: 1;
        width: 100px;
      }
      .assets-container{
        overflow-y: auto;
        max-height: calc(100vh - 100px);
      }
      .not-found{
        border-color: red;
      }  
      .shipped{
        border-color: yellow;
      }
      header > input{
        width: fill-available;
      }
      .not-found{
        border-color: yellow;
      }
      .lbl-not-found{
        color: yellow;
      }
      .different{
        border-color: blue;
      }
      .lbl-different{
        color: blue;
      }
      .cannot-change{
        border-color: red;
      }
      .lbl-cannot-change{
        color: red;
      }
      .admin-change{
        border-color: fuchsia;
      }
      .lbl-admin-change{
        color: fuchsia;
      }
      .privilege-change{
        border-color: aqua;
      }
      .lbl-privilege-change{
        color: aqua;
      }
        
      `}</style>
      <Head>
        <title>Bulk Move</title>
      </Head>
      <section className='assets window window-alert'>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <label>Audits</label>
          <AboutQMarkTag 
            helpText={<>
              <p><label className='lbl-privilege-change'>Confirm To Change</label></p>
              <p><label className='lbl-admin-change'>Only Admin Modify</label></p>
              <p><label className='lbl-cannot-change'>Locked From Modify</label></p>
              <p><label className='lbl-not-found'>Not Found</label></p>
            </>} 
            width='20px'
            height='20px' 
          />
        </div>
        
        <hr style={{margin: '0 0 6px 0'}} />
        <div className='assets-container'>
          {assetTag.map((item: {number: string, problem: EOrderAuditPermission}, index) => 
            <div className='asset-tags' key={index}>
              <input 
                type="number" 
                value={item.number} 
                onChange={e => changeAssetTag(e.target.value, index)}
                placeholder='Enter Audit'
                className={item.problem === EOrderAuditPermission.notFound ? 'not-found': 
                item.problem === EOrderAuditPermission.askForEditing ? 'privilege-change': 
                item.problem === EOrderAuditPermission.onlyAdminEdit ? 'admin-change' : 
                item.problem === EOrderAuditPermission.lockedFromEditing && 'cannot-change'}
              />
              {assetTag.length > 1 && assetTag.length > index+1 && <Image 
                src='/pictures/minus.svg' 
                alt='Remove Field'
                width='30px' 
                height='30px' 
                onClick={() => removeAsset(index)}
              />}
              <br />
            </div>
          )}
        </div>
      </section>
      <section className='assets window window-alert'>
        <header>
          <label htmlFor="audits">Location</label>
          <hr style={{margin: '3px 0 6px 0'}} />
          <input 
            required
            value={location}
            onChange={e => dispatch({type: EActionType.changeLocation, string: e.target.value})}
            id='audits' 
            placeholder='Enter Location' 
          />
        </header>
        <hr style={{margin: '6px 0'}} />
        <LockSubmitButton 
          text='Submit' 
          loadingText='Chanding audits' 
          disabled={false} 
        />
      </section>
    </form>
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
    if(reqPermission.canBulkMoveAudit === true || reqPermission.canAudit) return {props: {
      pass: true
    }};
    else return {notFound : true}
  })
  return value
}