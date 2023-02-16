import React from 'react'

interface IFieldValueModifi{
  fields: Array<{
    header: string
    value: Array<string>
  }>
  fnHeaderClick: (header: string) => void
  fnFieldClick: (header: string, field: string) => void
}

const FieldValueModifi = ({fields, fnHeaderClick, fnFieldClick}:IFieldValueModifi) => {
  return (
    <>
      <style jsx>{`
      .chunks{
        display: flex;
        flex-direction: column;
        text-align: center;
      }
      .chunks > label:first-of-type{
        color: var(--table-header);
      }
      `}</style>
      {fields.map(({header, value}) => 
        <div 
          key={header} 
          className='chunks'
        >
          <label onClick={() => fnHeaderClick(header)}>{header}</label>
          {value.map(item => 
            <label key={item} onClick={() => fnFieldClick(header, item)}>{item}</label>)}
        </div>
      )}
      <hr />
    </>
  )
}

export default FieldValueModifi