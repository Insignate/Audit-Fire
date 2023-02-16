import { useEffect, useState } from "react"
import styled, { keyframes } from "styled-components"


const animInput = keyframes`
  0% {
    width: 0;
  }
  50% {
    width: 100%;
  }
  100% {
    width: 100%;
    opacity: 0;
  }
`
const Span = styled.span`
  position: absolute;  
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  visibility: hidden;
  opacity: 0;
  

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100%;
    animation: ${animInput} 1s ease infinite;
    z-index: 10;
    background: var(--foreground);
    border-radius: 3px;
  }

`

interface ISubmitBtn {
  text:string | number |  React.ReactElement, 
  loadingText: string | number,
  disabled: boolean
  type?: "button" | "submit" | "reset"
  onClick?: Function
  styling?: string
}
interface ISelfLockSubmitBtn {
  text:string | number |  React.ReactElement, 
  loadingText: string | number,
  type?: "button" | "submit" | "reset"
  onClick: Function
  styling?: string
  args?: string | number
  className?: 'btn-submit' | 'btn-red-submit',
  disabled?: boolean
}


export const LockSubmitButton = ({text, loadingText, disabled, type="submit", onClick=() => {}, styling = ''}: ISubmitBtn)  => {

  return <> 
    <style jsx>{`
    button{
      ${styling}
      position: relative;
    }

    `}</style>
    <button 
      type={type}
      className="btn-submit" 
      disabled={disabled}
      onClick={() => onClick()}
    >{disabled ? loadingText : text}
      <Span style={ disabled ? {visibility:"visible", opacity:"1"}: {}}></Span>
    </button>
  </>
}

export const SelfLockSubmitButton = (
  {
    text, 
    loadingText, 
    type="submit", 
    onClick, 
    styling = '',
    className = 'btn-submit',
    args = null,
    disabled = false
  }: ISelfLockSubmitBtn) => {

  const [lock, setLock] = useState(false)
  const [mounted, setMounted] = useState(true)

  const lockBtn = async () => {
    setLock(true)
    if (args !== null) await onClick(args)
    else await onClick()
    if (mounted) setLock(false)
  }
  useEffect(() => {
    return (() => {
      setMounted(false)
    })
  }, [])
  return <> 
    <style jsx>{`
    button{
      ${styling}
      position: relative;
    }

    `}</style>
    <button 
      type={type}
      className={className}
      disabled={lock}
      onClick={() => lockBtn()}
    >{lock ? loadingText : text}
      <Span style={ lock ? {visibility:"visible", opacity:"1"}: {}}></Span>
    </button>
  </>
}

