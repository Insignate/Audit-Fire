
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { screenSize } from '../styles/GlobalStyle'
import CustomImage from '../components/Image'
import Image from 'next/image'

const themes = { 
  bright: 'bright',
  dark: 'dark',
  red: 'red'
}

export const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  const setNewTheme = () => {
    if(theme === 'bright') setTheme('dark');
    else setTheme('bright')
  }

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div>
      <style jsx>{`
        
        button{
          border: none;
          background-color: transparent;
          width: 100%;
          text-align: left;
        }
        div{
          width: 100%;
          
        }
        label{
          align-self: center;
          transition: opacity var(--fast-transition);
          transition-delay: var(--fast-transition);
        }

        @media ${screenSize.medium}{
          label{
            opacity: 0;
            pointer-events: none;
            transition-delay: 0.01s;
          }
        }
      `}</style>
      <button className='adjust-middle-img' type='button' onClick={() => setNewTheme()}>
        <Image
          className='themed-image'
          src={theme === "bright" ? '/pictures/sun.svg' : '/pictures/moon.svg'} 
          alt='Change Theme' width='40px' height='40px' />
        <label>Theme: {theme}</label>
      </button>
    </div>
  )
}

export default ThemeChanger