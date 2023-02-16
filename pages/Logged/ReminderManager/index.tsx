import Head from 'next/head'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SelfLockSubmitButton } from '../../../components/buttons'
import { jFetch } from '../../../utils/fetchs'
import { ModalsContext } from '../../../utils/Modals'

interface IAct{
  type: EAct
  field?: string
  value?: string | number | boolean
  number?: number
}

enum EAct {
  rootField,
}

const reducer = (state: Init, action: IAct) => {
  switch(action.type){

    case EAct.rootField:
      return {...state, [action.field]: action.value}
    default: return state

  }
}

class Init{

}

const Index = () => {
  const {showWindow, reminders, newReminder, deleteReminder, toggleReminder, showReminder} = useContext(ModalsContext)
  const [rem, setRem] = useState('')

  const saveReminder = useCallback( async () => {
    const svrResp = await jFetch('others/save-self-reminder', 'POST', {newReminder: rem})
    if(svrResp.success) newReminder(svrResp.value, rem)
    showWindow(svrResp)
  }, [rem, newReminder])

  const removeReminder = useCallback( async (id: number) => {
    const svrResp = await jFetch('others/delete-self-reminder', 'DELETE', {v_id:id})
    if (svrResp.success) deleteReminder(id) 
    showWindow(svrResp)
  }, [deleteReminder])

  useEffect(() => {

  }, [])
  return (
    <div>
      <style jsx>{`
      section{
        float: left;
      }
      textarea{
        min-width: 200px;
        min-height: 150px;
      }
      .window{
        margin: 6px;
      }
      table th, table td{
        padding: 2px 4px;
        border-top: solid 2px var(--foreground);
      }
      `}</style>
      <Head>
        <title>Reminders</title>
      </Head>
      <section className='window window-read'>
        <label>Set New Reminder</label>
        <hr style={{margin: '2px 0 6px 0'}} />
        {useMemo(() => <textarea
          placeholder='New Reminder'
          maxLength={500}
          value={rem}
          onChange={e => setRem(e.target.value)}
        />, [rem])}
        {useMemo(() => <p><label>{rem.length} out of 500 Characters</label></p>, [rem])}
        <hr style={{margin: '6px 0'}} />
        <SelfLockSubmitButton 
          text='Save'
          loadingText='Saving...' 
          onClick={() => saveReminder()} 
          styling='width: 100%;'
        />
      </section>
      <section className='window window-read'>
        <table>
          <caption>Set Reminders</caption>
          <thead>
            <tr>
              <th>Reminder</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map(({info, id}) =>
              <tr key={id}>
                <td>{info}</td>
                <td><button onClick={() => removeReminder(id)}>Remove</button></td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      <section className='window window-read'>
        <p><label>Toggle Reminder Window</label></p>
        <p>
          <button
            style={{width: '100%'}}
            onClick={() => toggleReminder()}
          >{showReminder ? 'Hide' : 'Show'}</button>
        </p>
      </section>
    </div>
  )
}

export default Index