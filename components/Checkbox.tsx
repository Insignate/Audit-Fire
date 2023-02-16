import React, { ChangeEventHandler, Fragment, InputHTMLAttributes } from 'react'

interface ICheckbox {
  checkHandler: ChangeEventHandler<HTMLInputElement>; 
  newName?: string;
  checked: boolean;
  id?: string;
}

export const Checkbox = ({checkHandler, newName = '', checked, id = ''}: ICheckbox) => {
  return (
    <>
      <style jsx>{`
      label{
        display: block;
      }
      `}</style>  
      <label>
        <input 
          id={id} 
          type="checkbox" 
          name={newName} 
          onChange={checkHandler}
          checked={checked}
        /> 
        {" " + newName}
      </label>
    </>
  )
}


interface ICheckboxArr {
  options: Array<{
    v_id: string
    v_name: string
    checked: boolean
  }>
  checkHandler:  InputHTMLAttributes<HTMLInputElement>["onChange"]
}

export const CheckboxArr = ({options, checkHandler}: ICheckboxArr) => {

  return (<>
    {options.map(item => 
      <Fragment key={item.v_id}>
      <label>
        <input 
          id={item.v_id}
          type="checkbox"
          name={item.v_name}
          onChange={checkHandler}
          checked={item.checked}
        />{" " + item.v_name}
      </label>
      </Fragment>
    )}
    </>
  )
}