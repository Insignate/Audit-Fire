
import React, { useState } from 'react'

const PlaySong = () => {
  const [audio, setAudio] = useState('/Music/freeme.mp3')
  return (
    <div className='window window-read'>
      <style jsx>{`
      div{
        position: fixed;
        top: -40px;
        right: -270px;
        border-radius: 0;
        border-bottom-left-radius: 6px;
        transition: top var(--fast-transition), right var(--fast-transition), opacity var(--fast-transition);
        z-index: 100;
        opacity: 0;
      }
      div:hover{
        top: -3px;
        right: -2px;
        opacity: 1;
      }

      `}</style>
      <audio controls>
        <source src={audio} type="audio/mpeg" />
      </audio> 
    </div>
  )
}

export default PlaySong