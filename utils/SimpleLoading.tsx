import { useEffect, useState } from "react"

import styled, {keyframes} from "styled-components"


const keyLoad = keyframes`

  0% {
    transform: scale(0);
    opacity: 0;

  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
`

const StlSpan = styled.span`
  width: 20px;
  height: 20px;
  margin-right: 4px;
  border: solid var(--obj-border-size) var(--load-border-color);
  background-color: var(--load-inner-color);
  box-shadow: var(--box-shadow-config) var(--load-shadow-color);
  display: inline-block;
  border-radius: 1em;
  opacity: 0;
  animation: ${keyLoad} 2s infinite;
  animation-delay: calc(0.2s * var(--i));
`



export function SimpleLoading({quantity} : {quantity: number}) {

  const [squares, setSquares] = useState([])
  

  useEffect(() => {
    var rows = []
    for (var x = 1; x <= quantity; x++){
      rows.push(<StlSpan key={x} style={{ "--i": x } as React.CSSProperties}></StlSpan>)
    }
    setSquares(rows);
  }, [])
  

  return (
    <div>
      <style jsx>{`
      div{
        margin: 8px;
        
        display: inline-block;
      }
      `}</style>
      {squares.map(item => item)}
    </div>
  )
}
