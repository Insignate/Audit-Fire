import React from 'react'


export interface ISelectBox{
  valueSelected: number | string
  onChange: (e:React.ChangeEvent<HTMLSelectElement>['target']) => void
  selectInfoText?: string
  styling?: string
  name?: string
  showHelper?: boolean
  size?: number
  obj: Array<{
    v_id: number
    v_name: string
  }>
  required?: boolean
  id?: string
}

export const Selectbox = ({
    valueSelected,
    onChange,
    selectInfoText = '',
    obj,
    showHelper = true,
    size = 1, 
    styling = '',
    name = undefined,
    required = true,
    id = ''
  }: ISelectBox) => {
  return (
    <select 
      name={name} 
      size={size} 
      value={valueSelected} 
      onChange={e => onChange(e.target)}
      required 
      id={id}
    >
      <style jsx>{`
      select{
        ${styling}
      }
      `}</style>
      {showHelper && <option value={required ? "" : "0"} id="0">{selectInfoText}</option>}
      {obj.map(({v_id, v_name}) => 
        <option key={v_id} value={v_id} id={v_id.toString()}>{v_name}</option>
      )}
    </select>
  )
}

export default Selectbox