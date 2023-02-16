import React, { useState } from 'react'
import { LockSubmitButton } from './buttons'

interface ILockForm{
  formItems: React.ReactElement,
  submitHandler: Function
  buttons?: React.ReactElement
  btnText?: string,
  btnLoadingText?: string,
  style?: string,
  windowType: 'attention' | 'read' | 'info' | 'lookup' | 'alert' | 'none'
}

export const LockForm = (
  {
    formItems, 
    submitHandler = () => {}, 
    buttons = undefined, 
    style = `form{
      display: inline-block;
      margin: 8px;
    }
    `,
    btnText = 'Submit', 
    btnLoadingText = 'Submiting...',
    windowType = 'read'
  }: ILockForm) => {

  const [lockButton, setLockButton] = useState(false)

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    setLockButton(true)
    e.preventDefault()
    await submitHandler()
    setLockButton(false)
  }


  return (
    <form className={`${windowType !== 'none' ? 'window window-'+windowType : ''}`} onSubmit={e => submitForm(e)}>
      <style jsx>{`
      ${style}
      .this-form-hr{
        margin: 6px 0;
      }
      `}</style>
      {formItems}
      <hr className='this-form-hr' />
      <LockSubmitButton 
        text={btnText}
        loadingText={btnLoadingText}
        disabled={lockButton} 
      />
      {buttons}
    </form>
  )
}
