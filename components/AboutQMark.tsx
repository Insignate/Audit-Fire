import React, { Fragment } from 'react'
import Image from './Image'

interface IHelpText{
  helpText: Array<string>
  width: string
  height: string
}

interface IHelpTextTag{
  helpText: JSX.Element
  width: string
  height: string
}

const AboutQMark = ({helpText, width= '30px', height= '30px'}: IHelpText) => {
  return (
    <div className='showOnHover'>
      <style jsx>{`
      .showOnHover{
        position: relative;
      }
      .showOnHover > span{
        opacity: 0;
        transition: opacity var(--fast-transition);
        position: absolute;
        pointer-events: none;
        width: 170px;
        left: -160px;
      }
      .showOnHover:hover > span{
        z-index: 5;
        opacity: 1;
        pointer-events: auto;
      }  
      `}</style>
      <Image src="/pictures/qmark.svg" alt="Name" width={width} height={height} verticalAlign='top' />
      <span className='window window-lookup'>{helpText.map((item, index) => <Fragment key={index}>{item}<br /></Fragment>)}</span>
    </div>
  )
}

export default AboutQMark

export const AboutQMarkTag = ({helpText, width= '30px', height= '30px'}: IHelpTextTag) => {
  return (
    <div className='showOnHover'>
      <style jsx>{`
      .showOnHover{
        position: relative;
      }
      .showOnHover > span{
        opacity: 0;
        transition: opacity var(--fast-transition);
        position: absolute;
        pointer-events: none;
        width: 170px;
        left: -160px;
      }
      .showOnHover:hover > span{
        z-index: 5;
        opacity: 1;
        pointer-events: auto;
      }  
      `}</style>
      <Image src="/pictures/qmark.svg" alt="Name" width={width} height={height} verticalAlign='top' />
      <span className='window window-lookup'>{helpText}</span>
    </div>
  )
}