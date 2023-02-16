import React, { useCallback } from 'react'

interface INumericPositiveInt{
  name: string,
  placeholder: string,
  min: number,
  max:number,
  value: number,
  pattern: string,
  handleChange: Function
}

export const NumericInput = ({name, placeholder, min, max, value, pattern, handleChange}: INumericPositiveInt) => {
  const change = useCallback((e:React.ChangeEvent<HTMLInputElement>)  => {
    const value = parseInt(e.target.value)
    if (isNaN(value)) handleChange('')
    else (handleChange(value))
  }, [handleChange])
  return (
    <input 
    type="number"
    pattern={pattern}
    name={name} 
    placeholder={placeholder}
    min={min} 
    max={max}
    value={value}
    onChange={e => {
      change(e)
    }}
  />
  )
}
