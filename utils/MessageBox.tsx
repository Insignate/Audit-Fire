import React, { useContext } from 'react'
import { ModalsContext, EWindowType } from './Modals'

export const MessageBox = () => {

  const msg = useContext(ModalsContext)

  return (
    <div className={`window ${msg.windowType === EWindowType.success ? "window-read": 
      msg.windowType === EWindowType.error ? "window-attention" : 
      msg.windowType === EWindowType.info ? 'window-lookup': 
      msg.windowType === EWindowType.alert ? 'window-alert': ''}`}
      style={msg.isShown === true ? {opacity: 1, pointerEvents: "auto", right: "100px"}: {}}
      onMouseOver={() => msg.stopHideTimer()}
      onMouseLeave={() => msg.hideWindow()}
      >
      <style jsx>{`
        div{
          position: fixed;
          min-width: 150px;
          max-width: 250px;
          min-height: 130px;
          right: 0px;
          top: 80px;
          border-radius: var(--window-border-radius);
          padding: 4px;
          background-color: var(--nav-background);
          transition: opacity var(--fast-transition), right var(--fast-transition);
          pointer-events:none;
          opacity: 0;
          z-index: 10;
        }

      
      `}</style>
      <label style={{display: "block", width: "100%", textAlign: "center"}}>{msg.topText}</label>
      <hr />
      <label style={{textAlign: 'center'}}>{msg.bodyText}</label>

    </div>
  )
}
