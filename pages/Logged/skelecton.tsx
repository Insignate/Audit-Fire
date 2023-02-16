import React, { useCallback, useReducer } from 'react'

interface IAct{
  type: EAct
  value: string | number | boolean
  field: string
}

enum EAct{
  type,
  rootField
}

const reducer = (state: Init, action: IAct) => {
  switch(action.type){
    case EAct.rootField:
      return {...state, [action.field]: action.value}
    default: return state
  }
}

class Init{
  
}


const Index = () => {

  const [ state, dispatch ] = useReducer(reducer, new Init)

  return (<></>)
}

export default Index