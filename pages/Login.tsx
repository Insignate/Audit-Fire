import { FormEvent, useCallback, useEffect, useState } from "react"
import { LockSubmitButton } from "../components/buttons"
import { ThemeChanger } from "./Theme"

export const Login = ({attemptLogin, error}) => {

  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [lockLoginBtn, setLockLoginBtn] = useState<boolean>(false)

  const submitForm = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    setLockLoginBtn(true);
    e.preventDefault();
    const isLogged: boolean = await attemptLogin(username, password);
    if(isLogged === false) {
      setLockLoginBtn(false)
    }
  }, [username, password, attemptLogin])

  useEffect(() => {
    return (
      setUsername(""),
      setPassword(""),
      setLockLoginBtn(false)
    )
  }, [])


  return(
    <div className="root-div" >
      <style jsx>{`
        .root-div{
          width: 100%;
          height: 100%;
          display: flex;
        }
        .theme-changer{
          display: fixed;
          height: 50px;
        }
        form{
          display: block;
          width: 10em;
          margin: auto;
          min-width: 200px;
        }
        form > input, form > span{
          width: -webkit-fill-available;
          width: -moz-available;
        }
        form button{
          width: -webkit-fill-available;
          width: -moz-available;
        }
        form > span{
          background-color: inherit;
          border-bottom: solid;
          display: inline-block;
          margin-bottom: 3px;
          padding-bottom: 3px;
        }
        form > label, div > span{
          background-color: inherit;
        }
      `}</style>
      <form onSubmit={e => submitForm(e)} className="window window-read">
      <div className="theme-changer"><ThemeChanger /></div>
        
        <span className="obj-read">{error}</span>
          <br />
        <label htmlFor="login">Login:</label>
        <input 
          value={username}
          onChange={e => setUsername(e.target.value)}
          type="text" 
          id="login" 
          placeholder="Enter login" 
          required 
          minLength={2} 
          maxLength={20} />
        <label htmlFor="password">Password:</label>
        <input 
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password" 
          id="password" 
          placeholder="Enter password" 
          minLength={8} 
          maxLength={50} 
          required/>
        <LockSubmitButton text={"Login"} disabled={lockLoginBtn} loadingText={"Logging In..."} />
      </form>
    </div>
  )
}

export default Login


// const Login = async details => {
//   try{
//     const body = {"username": details.UserName, "password": details.Password}
//     const response = await fetch(apiLocation + '/api/get_token',{
//       method: "POST",
//       headers: {"Content-Type" : "application/json"},
//       body: JSON.stringify(body)
//     });
//     const jsonResponse = await response.json();
//     if (jsonResponse.success){
      
//       window.localStorage.setItem('Token', jsonResponse.success.Token);
//       window.localStorage.setItem('Identification' ,jsonResponse.success.user_identification);
      
//     }
//     else if (jsonResponse.error)setError(jsonResponse.error);
//   }
//   catch(err){
//       setError("could not log in");
//       console.error(err.message);
//   }
// }