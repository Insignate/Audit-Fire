import Head from 'next/head'
import React, { useContext, useEffect, useState } from 'react'
import { LockSubmitButton } from '../../../components/buttons'
import { IBasicResponse } from '../../../tsTypes/psqlResponses'
import { jFetch } from '../../../utils/fetchs'
import { ModalsContext } from '../../../utils/Modals'

const Index = ({pushLogin = null}: {pushLogin?: () => void}) => {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [reNewPass, setReNewPass] = useState('')
  const [lockBtn, setLockBtn] = useState(false)

  const {showWindow} = useContext(ModalsContext)

  const changePass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLockBtn(true)

    if(newPass === reNewPass){
      const svrResp:IBasicResponse = await jFetch('employee-registry/change-password', 'POST', {oldPass: oldPass.trim(), newPass: newPass.trim()})
      showWindow(svrResp)
      if (!svrResp.success) setOldPass('')
      if (pushLogin !== null) 
      {
        pushLogin()
        return
      }
    }
    else {
      setNewPass('')
      setReNewPass('')
    }
    setLockBtn(false)
  }
  useEffect(() => {
    return () => {
      <></>
    }
  }, [])
  
  return (
    <div className='root-div'>
      <style jsx>{`
        .root-div{
          justify-content: center;
          align-content: center;
          display: flex;
          height: 100%;
        }
        .window{
          margin: 6px;
          display: flex;
          flex-direction: column;
          max-width: 250px;
          align-self: center;
        }
      `}</style>
      <Head>
        <title>Change Password</title>
      </Head>
      <form onSubmit={e => changePass(e)} className='window window-attention'>
        
        <label>Password Change</label>
        <hr />
        <label htmlFor="oldPass">Old Password:</label>
        <input 
          id="oldPass" 
          type="password" 
          placeholder='Type Old Password'
          autoComplete='new-password'
          required
          minLength={8}
          maxLength={50}
          value={oldPass}
          onChange={e => setOldPass(e.target.value)}
        />
        <label htmlFor="newPass">New Password:</label>
        <input 
          id='newPass' 
          type="password" 
          placeholder='Type New Password' 
          autoComplete='new-password' 
          required
          minLength={8}
          maxLength={50}
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
        />
        <label htmlFor="renewPass">Re-Type Password:</label>
        <input 
          id='renewPass' 
          type="password" 
          placeholder='Re-Type New Password' 
          autoComplete='new-password'
          required
          minLength={8}
          maxLength={50}
          value={reNewPass}
          onChange={e => setReNewPass(e.target.value)}
        />
        <hr style={{margin: '6px 0'}} />
        <LockSubmitButton 
          text='Change'
          loadingText='Changing...' 
          disabled={lockBtn} 
        />
      </form>
    </div>
  )
}

export default Index