import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { getFetch } from '../../utils/fetchs';
import { screenSize } from '../../styles/GlobalStyle'
import { ThemeChanger } from '../../pages/Theme';
import Image from 'next/image';

interface INavLinks{
  image: string,
  alt: string,
  link: string,
  sub: Array<ISubLinks>,
  key: number,
}

interface ISubLinks{
  text: string,
  link: string,
  sub: Array<ISubLinks>,
  key: number,
}

export default function Navbar({logout}) {

  const [navLinks, setNavLinks] = useState([])

  const getNavLinks = async () => {
    const svrResp = await getFetch("get-nav-links");
    if (svrResp.success){
      setNavLinks(svrResp.success)
    }
  }

  useEffect(() => {
    getNavLinks();
  }, [])

  return (
    <nav className='shadow-neutral'>
      <style jsx>{`
        nav{
          height: 100%;
          flex-grow: 0;
          flex-shrink: 0;
          width: 150px;
          background-color: var(--nav-background);
          display: flex;
          flex-direction: column;
          z-index: 20;
          transition: width var(--fast-transition);
        }
        
        ul{
          height: 100%;
          background-color: var(--nav-background);
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: scroll;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        ul::-webkit-scrollbar{
          display: none;
        }
        li{
          border-top-left-radius: var(--obj-border-radius);
          border-bottom-left-radius: var(--obj-border-radius);
        }
        
        li:hover{
          background: linear-gradient(.25turn, var(--nav-link-gradient1), var(--nav-link-gradient2), var(--nav-link-gradient1));
          background-size: 400% 100%;
          animation: link-anim infinite 2s linear;
        }
        li:last-of-type{
          margin-top: auto;

        }
        li:last-of-type:hover{
          background: transparent;
          
        }
        button{
          border: none;
          background-color: transparent;
          width: 100%;
          text-align: left;
        }

        button:hover{
          background-color: var(--nav-link-gradient2);
        }
        button:active{
          background-color: var(--nav-link-gradient1);
        }

        li > button > label{
          display: inline;
          align-self: center;
          padding-left: 4px;
          cursor: pointer;
          text-shadow: var(--nav-link-text-shadow);
          transition: opacity var(--fast-transition);
          transition-delay: var(--fast-transition);
        }

        hr{
          border: none;
          background-color: var(--background);
          border-radius: 2px;
          margin: 4px;
          height: 2px;
        }
        @media ${screenSize.medium}{
          nav{
            width: 50px;
            transition-delay: var(--fast-transition);
          }
          li > button > label{
            opacity: 0;
            pointer-events: none;
            transition-delay: 0.01s;
          }
        }

        
      `}</style>
      <ul>
        {navLinks.map(({image, alt, link, sub, key}) => 
          <NavLinks image={image} alt={alt} link={link} sub={sub} key={key} />
        )}
        <hr />
        <li>
          <ThemeChanger />
        </li>
        <li  className='single-link'>
          <button className='adjust-middle-img' onClick={() => logout()}>
            <Image className='themed-image' src="/pictures/logout.svg" alt="logout" width='40px' height='40px'/>
            <label>Log out</label>
          </button>
        </li>
      </ul>
      
      
    </nav>
  )
}

const NavLinks = ({image, alt, link, sub}: INavLinks) => {
  return (
    <li className='single-link'>
      <style jsx>{`
        label{
          align-self: center;
          text-shadow: var(--nav-link-text-shadow);
          cursor: pointer;
          padding: 4px;
          transition: opacity var(--fast-transition);
          transition-delay: var(--fast-transition);
        }
        li{
          border-top-left-radius: var(--obj-border-radius);
          border-bottom-left-radius: var(--obj-border-radius);
          padding: 4px 0;
        }
        li:hover{
          background: linear-gradient(.25turn, var(--nav-link-gradient1), var(--nav-link-gradient2), var(--nav-link-gradient1));
          background-size: 400% 100%;
          animation: link-anim infinite 2s linear;
        }
        li:hover > ul{
          opacity: 1;
          pointer-events: auto;
          margin-left: 150px;
        }
        ul{
          position: absolute;
          z-index: -10;
          margin-left: 100px;
          pointer-events: none;
          opacity: 0;
          background-color: var(--background);
          border-top-right-radius: var(--obj-border-radius);
          border-bottom-right-radius: var(--obj-border-radius);
          transition: opacity var(--fast-transition), margin-left var(--fast-transition), bottom var(--fast-transition);
          min-width: 130px;
          min-height: 30px;
          border-left: none;
        }

        @media ${screenSize.medium}{
          ul{
            margin-left: 0px;
          }
          label{
            opacity: 0;
            pointer-events: none;
            transition-delay: 0.01s;
          }
          li:hover > ul{
            margin-left: 50px;
          }
        }
        
        @keyframes link-anim{
          0%{background-position: 136% 186%;}
          100%{background-position: 0% 50%;}
        }
        @keyframes link-anim-up{
          0%{background-position: 0% 50%;}
          100%{background-position: 136% 186%;}
        }

      `}</style>
      <ul className='shadow-neutral-activate'>
        {sub.map(({text, link, sub, key}) => 
          <NavSubLinks text={text} link={link} sub={sub} key={key}/>
        )}
      </ul>
      <Link href={link}>
        <a className='adjust-middle-img'>
          <Image className='themed-image' src={image} alt={alt} width={40} height={40} />
          <label>{alt}</label>
        </a>
      </Link>
    </li>
  )
}

const NavSubLinks = ({text, link, sub}: ISubLinks) => {
  
  return (
    <li>
      <style jsx>{`
        a{
          display: block;
          padding: 10px 4px;
        }

        li{
          background-color: var(--nav-background);
          border-top-right-radius: 
        }

        li:hover{
          background: linear-gradient(.25turn, var(--nav-link-gradient1), var(--nav-link-gradient2), var(--nav-link-gradient1));
          background-size: 400% 100%;
          animation: link-anim infinite 2s linear;
        }

        li:first-of-type{
          border-top-right-radius: var(--obj-border-radius);
          
        }
        li:last-of-type{
          border-bottom-right-radius: var(--obj-border-radius);
        }
        
        
        ul{
          opacity: 0;
          pointer-events: none;
          position: absolute;
        }
        
        @keyframes link-anim{
          0%{background-position: 136% 186%;}
          100%{background-position: 0% 50%;}
        }
        @keyframes link-anim-up{
          0%{background-position: 0% 50%;}
          100%{background-position: 136% 186%;}
        }
      `}</style>
      <Link href={link}><a>{text}</a></Link>
      <ul>
        {sub.map(({text, link, sub, key}) => 
          <NavSubLinks text={text} link={link} sub={sub} key={key}/>
        )}
      </ul>
    </li>
  )
}
