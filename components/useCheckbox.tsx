import { useCallback, useState } from "react"

export const addCheckedToItems = (items: any) => {
  return items.map((item: any) => {
    return {...item, checked: false}
  })
}

export const useCheckbox = () => {
  const [obj, setObj] = useState([])
  const [initialState, setInitialState] = useState([])

  const newInitialState = useCallback((newState: Array<{v_id: number, checked: boolean}>) => {
    setInitialState(newState)
    setObj(newState)
  }, [])
  
  const resetChecked = useCallback(() =>{
    setObj(initialState)
  }, [initialState])

  const checkTrue = useCallback((newState: [{v_id: number}]) => {
    setObj(state => state.map(item => ({...item, checked: false})))
    for(let prop in newState){
      setObj(state => state.map(checks => {
        const newStatePerm = newState[prop].v_id === checks.v_id ? {...checks, checked: true} :
          {...checks}
        return newStatePerm
      }))
    }
  }, [])

  const addToCheckItems = useCallback((id: number, name: string, checked: boolean) => {
    setObj(state => [{v_id: id, v_name: name, checked}, ...state])
  },[])

  const removeCheckItem = useCallback((id: number)=> {
    setObj(state => state.filter(item => item.v_id !== id))
  },[])

  const changeChecked = useCallback((({target: {id}}): void => {
    setObj(state => state.map(item => 
      item.v_id == id ? {...item, checked: !item.checked} : {...item}
    ))
  }),[])
  return {obj, addToCheckItems, removeCheckItem, resetChecked, changeChecked, newInitialState, checkTrue}
}