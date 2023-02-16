import Image from 'next/image'
import React from 'react'

const CustomImage = ({src, alt, width, height, padding = '0', verticalAlign = 'auto', onClick = () => {}}) => {
  return (
    <div className='custom-icons' >
      <style jsx>{`
      .custom-icons{
        display: inline-block;
        vertical-align: baseline;
      }  
      `}</style>
      <Image 
        onClick={onClick} 
        src={src} 
        alt={alt} 
        width={width} 
        height={height}
      />
    </div>
  )
}

export default CustomImage