import React, { createContext, useMemo, useReducer } from 'react'

interface IDialogExportables extends Init{
  showDialog: (topText: string, 
    bodyText: string, 
    windowType: EDialogWindowType, 
    fn: Function,
    btnAcceptText?: string,
    btnCancelText?: string,
    closeFn?: Function
    ) => void
  hideDialog: () => void
}

interface IActionFields{
  type: EActionTypes
  topText?: string
  bodyText?: string
  windowType?: EDialogWindowType
  fn?: Function
  btnAcceptText?: string
  btnCancelText?: string
  closeFn?: Function
}

enum EActionTypes {
  setDialogWindow,
  hide
}

export enum EDialogWindowType{
  green = 'window-read',
  orange = 'window-alert',
  red = 'window-attention',
  blue = 'window-lookup',
  white = ''
}

const reducer = (state: Init, action: IActionFields) => {
  switch (action.type){
    case EActionTypes.setDialogWindow:
      return {...state, 
        windowType: action.windowType,
        topText: action.topText, 
        bodyText: action.bodyText, 
        isOpen: true,
        btnAcceptText: action.btnAcceptText,
        btnCancelText: action.btnCancelText,
        fn: action.fn,
        closeFn: action.closeFn
      }
    case EActionTypes.hide:
      return {...state,
      isOpen: false}

    default:
      return state
  }
  
}


class Init{
  topText = ''
  bodyText = ''
  btnAcceptText = ''
  btnCancelText = ''
  windowType: EDialogWindowType = EDialogWindowType.white
  isOpen = false
  fn: Function
  closeFn: Function
}

export const DialogModalContext = createContext<IDialogExportables>(undefined)

export const DialogModalContextProvider = ({children}) => {

  const [state, dispatch] = useReducer(reducer, new Init)
  const {closeFn, topText, bodyText, windowType, btnAcceptText, btnCancelText, isOpen, fn} = state;

  const showDialog = (topText: string, 
    bodyText: string, 
    windowType: EDialogWindowType, 
    fn: Function,
    btnAcceptText = 'Submit',
    btnCancelText = 'Cancel',
    closeFn = () => {}) => {
    dispatch({
      type: EActionTypes.setDialogWindow, 
      topText, 
      bodyText, 
      windowType, 
      fn,
      btnAcceptText,
      btnCancelText,
      closeFn
    })
  }

  const hideDialog = () => {
    dispatch({type: EActionTypes.hide})
    closeFn()
  }


  const contextValue = useMemo(() => {
    return {
      showDialog,
      topText,
      bodyText,
      btnAcceptText,
      btnCancelText,
      windowType,
      isOpen,
      fn,
      hideDialog,
      closeFn
    }
    },[showDialog, 
      topText,
      bodyText,
      btnAcceptText,
      btnCancelText,
      windowType,
      isOpen,
      fn,
      hideDialog,
      closeFn
    ])

  return <DialogModalContext.Provider value={contextValue}>
    {children}
  </DialogModalContext.Provider>
}

