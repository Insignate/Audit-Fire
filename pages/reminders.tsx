import Head from 'next/head'
import React, { useContext, useEffect, useMemo, useReducer } from 'react'
import { getCustomCookie } from '../utils/customCookies'
import { ModalsContext } from '../utils/Modals'
import { enumPage } from '../utils/useLogin'

const Reminders = ({isLogged}: {isLogged: enumPage}) => {

  const {reminders, getMyReminders, showReminder, toggleReminder, setRemWindow} = useContext(ModalsContext)

  useEffect(() => {
    if (isLogged === enumPage.logged) getMyReminders()
    const {showRem} = getCustomCookie()
    setRemWindow(showRem === 'true' ? true : false)
  }, [isLogged])
  return (
    <div className={`window window-read root-div ${!showReminder && 'hide-reminders'}`}>
      <style jsx>{`
      .root-div{
        position: fixed;
        right: -170px;
        bottom: -290px;
        border-radius: 0;
        border-top-left-radius: var(--window-border-radius);
        width: 220px;
        height: 300px;
        transition: right var(--fast-transition), bottom var(--fast-transition), opacity var(--fast-transition); 
        z-index: 100;
      }
      .root-div:hover{
        right: -2px;
        bottom: -3px;
      }
      .root-div > div{
        opacity: 0;
        transition: opacity var(--fast-transition);
      }
      .root-div:hover > div{
        opacity: 1;
      }
      .single-reminder{
        margin-top: 6px;
        border-bottom: solid 2px;
        border-radius: var(--obj-border-size);
        transition: background-color var(--fast-transition);
        padding: 0 2px 2px 2px;
      }
      .single-reminder:hover{
        background-color: var(--background);
      }
      .hide-reminders{
        opacity: 0;
        pointer-events: none;
      }
      .all-reminders{
        overflow-y: auto;
        max-height: 274px;
      }
      `}</style>
      <Head>
        <title>Reminders</title>
      </Head>
      <div>
        <label>Reminders</label>
        <button
          onClick={() => toggleReminder()}
        >Hide</button>
        <button onClick={() => getMyReminders()}>Refresh</button>
        <hr />
        <div className='all-reminders'>
          {useMemo(() => reminders.map(({id, info}) => 
            <p 
              className='single-reminder'
              key={id}
            ><label>{info}</label></p>
          ), [reminders])}
        </div>

          
      </div>
    </div>
  )
}

export default Reminders