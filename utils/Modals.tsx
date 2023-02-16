import {createContext, useMemo, useCallback, useReducer} from 'react';
import { IGetMyReminders, IWindowTypes } from '../tsTypes/psqlResponses';
import { setCustomCookie } from './customCookies';
import { getFetch } from './fetchs';

interface IExportables extends Init{
  showWindow: (val: IWindowTypes) => void
  hideWindow: Function
  stopHideTimer: Function
  showCustomWindow: (topMsg: string, bodyMsg: string, windowType: EWindowType) => void
  getMyReminders: () => void
  clearReminders: () => void
  newReminder: (id: number, name: string) => void
  deleteReminder: (id: number) => void
  toggleReminder: () => void
  setRemWindow: (type: boolean) => void
}

export enum EWindowType{
  success,
  error,
  normal,
  info,
  alert,
}

enum EActionTypes {
  setNewWindow,
  hideWindow,
  stopHideTimer,
  rootField,
  newReminder,
  removeReminder,
  toggleReminder
}

interface IActionFields {
  type: EActionTypes,
  bodyText?: string,
  topText?: string,
  windowType?: EWindowType
  windowTimer?: NodeJS.Timer
  field?: string
  value?: number | string | boolean | IGetMyReminders['value']
  number?: number
  name?: string
}

const reducer = (state: Init, action: IActionFields) => {
  
  switch (action.type){
    case EActionTypes.rootField:
      return {...state, [action.field]: action.value}
    case EActionTypes.setNewWindow:
      clearInterval(state.windowTimer)
      return {
        ...state, 
        bodyText: action.bodyText,
        topText: action.topText,
        isShown: true,
        windowType: action.windowType,
        windowTimer: action.windowTimer,
      }
    case EActionTypes.hideWindow:
      clearInterval(state.windowTimer)
      return {
        ...state,
        isShown: false
      }
    case EActionTypes.newReminder:
      return {...state, reminders: [...state.reminders, {info: action.name, id: action.number}]}
    case EActionTypes.removeReminder:
      return {...state, reminders: state.reminders.filter(item => item.id !== action.number)}
    case EActionTypes.toggleReminder:
      setCustomCookie('showRem', !state.showReminder)
      return {...state, showReminder: !state.showReminder}
    default: return {...state}
  }
}
class Init{
  topText: string = '';
  bodyText: string = '';
  windowType: EWindowType = EWindowType.normal;
  isShown: boolean = false;
  windowTimer: NodeJS.Timer = setInterval(() => {}, 5000)
  reminders: IGetMyReminders['value'] = []
  showReminder = true;
}

export const ModalsContext = createContext<IExportables>(undefined)

export const ModalsContextProvider = ({children}) => {

  const [state, dispatch] = useReducer(reducer, new Init)
  const {
      topText, 
      bodyText, 
      windowType, 
      isShown, 
      windowTimer,
      reminders,
      showReminder
  } = state;
  const hideWindow = useCallback(() => {
    dispatch({type: EActionTypes.hideWindow})
  },[])
  const stopHideTimer = useCallback(() => {
    dispatch({type: EActionTypes.stopHideTimer})
  },[])
  const showWindow = useCallback((windowInfo: IWindowTypes) => {
    if (windowInfo.success)
      dispatch({type: EActionTypes.setNewWindow, topText: "Success", bodyText: windowInfo.success, windowType: EWindowType.success, windowTimer: setInterval(hideWindow, 4000)})
    else if (windowInfo.error)
      dispatch({type: EActionTypes.setNewWindow, topText: "Error", bodyText: windowInfo.error, windowType: EWindowType.error, windowTimer: setInterval(hideWindow, 4000)})
    else if (windowInfo.info)
      dispatch({type: EActionTypes.setNewWindow, topText: "Info", bodyText: windowInfo.info, windowType: EWindowType.info, windowTimer: setInterval(hideWindow, 4000)})
    else if (windowInfo.alert)
      dispatch({type: EActionTypes.setNewWindow, topText: "Alert", bodyText: windowInfo.alert, windowType: EWindowType.alert, windowTimer: setInterval(hideWindow, 4000)})
    else
      dispatch({type: EActionTypes.setNewWindow, topText: "Normal", bodyText: windowInfo.normal, windowType: EWindowType.normal, windowTimer: setInterval(hideWindow, 4000)})    
  },[])
  const showCustomWindow = useCallback((top: string, body: string, windowType: EWindowType) => {
    dispatch({type: EActionTypes.setNewWindow, topText: top, bodyText: body, windowType, windowTimer: setInterval(hideWindow, 4000) })
  },[])
  const getMyReminders = useCallback( async () => {
    const svrResp:IGetMyReminders = await getFetch('others/get-my-reminders')
    if(svrResp.success) 
      dispatch({type: EActionTypes.rootField, field: 'reminders', value: svrResp.value})
    else dispatch({type: EActionTypes.rootField, field: 'reminders', value: []})  
  },[])
  const clearReminders = useCallback(() => {
    dispatch({type: EActionTypes.rootField, value: []})  
  },[])
  const newReminder = useCallback((id:number, name: string) => {
    dispatch({type: EActionTypes.newReminder, number: id, name})
  },[])
  const deleteReminder = useCallback((id:number) => {
    dispatch({type: EActionTypes.removeReminder, number: id})
  },[])
  const toggleReminder = useCallback(() => {
    dispatch({type: EActionTypes.toggleReminder})
  },[])
  const setRemWindow = useCallback((type: boolean) => {
    dispatch({type: EActionTypes.rootField, field: 'showReminder', value: type})
  },[])
  const contextValue = useMemo(() => {
    return {
      showWindow,
      showCustomWindow,
      hideWindow,
      stopHideTimer,
      getMyReminders,
      clearReminders,
      newReminder,
      deleteReminder,
      toggleReminder,
      setRemWindow,
      topText,
      bodyText, 
      windowType, 
      isShown, 
      windowTimer,
      reminders,
      showReminder
    }
  }, [showWindow,
      showCustomWindow,
      hideWindow,
      stopHideTimer,
      getMyReminders,
      clearReminders,
      newReminder,
      deleteReminder,
      toggleReminder,
      setRemWindow,
      topText,
      bodyText, 
      windowType, 
      isShown, 
      windowTimer,
      reminders,
      showReminder
    ])

  return <ModalsContext.Provider value={contextValue}>
    {children}
  </ModalsContext.Provider>
}