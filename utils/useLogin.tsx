import { useCallback, useEffect, useReducer } from "react"
import { jFetch, getFetch } from "./fetchs"
import { ITokenIdent } from "../tsTypes/psqlResponses"
import { useRouter } from "next/router";

interface IActions {
  type: number;
  error?: string;
}

enum actions {
  logInUser,
  failedLogin,
  logOut,
  changePass
}

export enum enumPage {
  loading,
  loggingPage,
  logged,
  changePassword
}

class InitialState {
  error: string = "Welcome!";
  page: number = enumPage.loading;
}

const userReducer = (state: InitialState, action: IActions) => {
  switch (action.type){
    case actions.logInUser: {
      return {
        ...state,
        page: enumPage.logged,
      }
    }
    case actions.failedLogin: {
      return{
        ...state,
        error: action.error
      }
    }
    case actions.logOut: {
      return{
        ...state,
        page: enumPage.loggingPage,
      }
    }
    case actions.changePass:
      return {...state, page: enumPage.changePassword}
    default: {
      return {...state}
    }
  }
}


export const useLogin = () => {
  const router = useRouter()

  const [state, dispach] = useReducer(userReducer, new InitialState);

  const {page, error} = state;

  const login = async (username: string, password: string): Promise<boolean> => {
    const svrResp: ITokenIdent = await jFetch("login", 'POST', {username, password});
    if (svrResp.success && svrResp.change_pass === true){
      dispach({type: actions.changePass})
    }
    else if (svrResp.success){
      dispach({type: actions.logInUser})
      return true
    }
    else if (svrResp.info){
      dispach({type: actions.failedLogin, error: svrResp.info})
      return false
    }
    else {
      dispach({type: actions.failedLogin, error: svrResp.error})
      return false
    }
  }

  const loggedPages = useCallback(() => {
    dispach({type: actions.logInUser})
  },[])

  const logout = useCallback( async (): Promise<void> => {
    dispach({type: actions.logOut})
    await getFetch("logout");
    router.push("/")
  }, [])

  const isLogged = useCallback(async (): Promise<boolean> => {
    const svrResp = await getFetch("token-login")
    if (svrResp.success){
      dispach({type: actions.logInUser})
      return true
    }
    else {
      logout()
      return false
    }
  }, [])

  useEffect(() => {
    isLogged();
  }, [])

  return {login, logout, page, error, dispach, loggedPages}
}