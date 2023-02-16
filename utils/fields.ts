export const mergeSequentialFieldIds = (fields : Array<{v_id: number, val: string}>): 
  Array<{v_id: number, value_arr: Array<string>}> => {
  let thisValue = 0;
  const arrValues:Array<{v_id: number, value_arr: Array<string>}> = []
  fields.forEach(item => {
    if (item.v_id === thisValue){
      arrValues.at(-1).value_arr.push(item.val)
    }
    else {
      thisValue = item.v_id
      arrValues.push({v_id: item.v_id, value_arr: [item.val]})
    }
  })
  return arrValues;
}