//minShort: -32768
//maxShort: 32767
//minInt: -2147483648
//maxInt: 2147483647
//maxBigInt: 9007199254740991
//minBigInt -9007199254740992

export enum values { 
  minShort = -32768,
  maxShort = 32767,
  minInt = -2147483648,
  maxInt = 2147483647,
  maxBigInt = 9007199254740991,
  minBigInt = -9007199254740991,
}

export function betweenNumber(value:string, minValue: number, maxValue: number){

  const calcValue = parseInt(value);

  if (typeof calcValue !== 'number') return ''
  if(value === '') return '';
  else if (value === '-') return '-';
  else if(calcValue < minValue || calcValue > maxValue) return 'e';
  else if(!isNaN(calcValue)) return calcValue;
  else return '';
}