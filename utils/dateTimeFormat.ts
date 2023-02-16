export const formatDateTimeUs = (datetime: Date): {date: string, time: string} => {
  const dateTime = new Date(datetime)
  const date = `${dateTime.getMonth()+1}/${dateTime.getDate()}/${dateTime.getFullYear()}`
  const time = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}:${dateTime.getSeconds().toString().padStart(2, '0')}`
  return {date, time}
}

export const formatDayHHMM = (datetime: Date): {day: number, time: string} => {
  const dateTime = new Date(datetime)
  const day = dateTime.getDate()
  const time = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`
  return {day, time}

}
export const formatDayHHMMIncrease3 = (datetime: Date) => {
  const dateTime = new Date(datetime)
  dateTime.setDate(dateTime.getDate() + 3)
  const date = `${dateTime.getMonth()+1}/${dateTime.getDate()}/${dateTime.getFullYear()}`
  const time = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}:${dateTime.getSeconds().toString().padStart(2, '0')}`
  return {date, time}
}