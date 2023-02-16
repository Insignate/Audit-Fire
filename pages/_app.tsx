import { GlobalStyle } from '../styles/GlobalStyle'
import { Login } from './Login'
import Navbar from '../components/navbar/Navbar'
import { ThemeProvider } from 'next-themes'
import { useLogin, enumPage } from '../utils/useLogin'
import { useRouter } from 'next/router'
import { Loading } from "../utils/Loading"
import { ModalsContextProvider } from '../utils/Modals'
import { DialogModalContextProvider } from '../utils/ModalDialog'
import { MessageBox } from '../utils/MessageBox'
import { DialogBox } from '../components/DialogBox'
import '../styles/globals.css'
import Reminders from './reminders'
import ChangePassword from './Logged/ChangePassword'
import PlaySong from './PlaySong'
import Head from 'next/head'


function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const {login, logout, page, error, loggedPages} = useLogin();


  const attemptLogin = async (username: string, password: string) => {
    //@ts-ignore
    const isLogged = await login(username, password);
    const location = window.location.href
    if (isLogged === true && !location.includes('Logged', 10))
      router.push('/Logged/')
    return isLogged
  }
  return <>
  <Head>
    <title>Login Page</title>
  </Head>
    <ModalsContextProvider>
      <DialogModalContextProvider>
        <GlobalStyle />
        <ThemeProvider themes={['bright', 'dark', 'red']}>
          <style global jsx>{`
            *{
              margin: 0;
              padding: 0;
            }
            main{
              width: calc(100% - 12px);
              overflow-y: auto;
            }
            html, body{
              font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
                Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
            }
            html, body, body > div{
              height: 100%;
              width: 100%;
            }
            body > div{
              display: flex;
            }
            li{
              list-style: none;
            }
            
          `}</style>
          <DialogBox />
          {page === enumPage.loading && <Loading />}
          {page === enumPage.logged && <Navbar logout={logout}/> }
          <PlaySong />
          <main>
            <MessageBox />
            {page === enumPage.changePassword && <ChangePassword pushLogin={loggedPages} />}
            {page === enumPage.logged && <Reminders isLogged={page}/>}
            {page === enumPage.loggingPage && <Login attemptLogin={attemptLogin} error={error}  />}
            {page === enumPage.logged && <Component {...pageProps} />}
          </main>
        </ThemeProvider>
      </DialogModalContextProvider>
    </ModalsContextProvider>
  </>
}



export default MyApp
