export function isShiftDay(date: Date) {

  const month = date.getMonth() + 1

  // ingen skiftedage vinter
  if (month === 11 || month === 12 || month === 1) {
    return false
  }

  const day = date.getDay() // 0=Sun,1=Mon...

  // uge nummer
  const start = new Date(date.getFullYear(),0,1)
  const diff =
    (date.getTime() - start.getTime()) / 86400000

  const week = Math.ceil((diff + start.getDay() + 1) / 7)

  // lige uge = tirsdag
  if (week % 2 === 0 && day === 2) {
    return true
  }

  // ulige uge = onsdag
  if (week % 2 === 1 && day === 3) {
    return true
  }

  return false

}