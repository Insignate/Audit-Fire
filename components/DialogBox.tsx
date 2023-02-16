import React, { useContext } from 'react'
import { DialogModalContext } from '../utils/ModalDialog'


export const DialogBox = () => {
  
  const {fn, topText, bodyText, isOpen, btnAcceptText, btnCancelText, windowType, hideDialog} = useContext(DialogModalContext)
  
  const submitBtn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    fn()
    hideDialog()
  }

  const outsideClick = (name: string) => {
    if (name === 'dialog-container') hideDialog()
  }
  return (

    
    //@ts-ignore
    <div id='dialog-container' onClick={(e) => outsideClick(e.target.id)} className={`dialog-root ${isOpen ? '' : 'hidden'} `}>
      <style jsx>{`
        .dialog-root{
          position: fixed;
          display: flex;
          align-items: center;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, .5);
          z-index: 100;
          transition: opacity var(--fast-transition);
          justify-content: center;
          
        }
        .c-dialog{
          max-width: 400px;
          transform: translateY(-60px);
          transition: transform var(--fast-transition);
        }
        .c-dialog-open{
          transform: translateY(0);
        }

        .hidden{
          pointer-events: none;
          opacity: 0;
          
        }
        form > hr{
          margin: 4px 0;
        }
        form:focus > p{
          background-color: white;
        }
        
      `}</style>
      <form 
        onSubmit={e => submitBtn(e)} 
        defaultValue='will focus' 
        className={`c-dialog window ${windowType} ${isOpen ? 'c-dialog-open' : ''}`}
        >
        <p><label>{topText}</label></p>
        <hr />
        <p><label>{bodyText}</label></p>
        <hr />
        <input type='submit' value={btnAcceptText}/>
        <button onClick={() => hideDialog()} type='button'>{btnCancelText}</button>
      </form>
    </div>
  )
}