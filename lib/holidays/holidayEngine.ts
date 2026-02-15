import {
  getDanishSchoolHolidays,
  getDanishPublicHolidays
} from './danish'

import {
  getNorwegianSchoolHolidays,
  getNorwegianPublicHolidays
} from './norwegian'

export function createHolidayEngine(year: number) {
  const dkSchool = getDanishSchoolHolidays(year)
  const noSchool = getNorwegianSchoolHolidays(year)
  const dkPublic = getDanishPublicHolidays(year)
  const noPublic = getNorwegianPublicHolidays(year)

  function get(date: Date) {
    const dkPublicMatch = dkPublic.find(
      h => h?.date?.toDateString() === date.toDateString()
    )

    const noPublicMatch = noPublic.find(
      h => h?.date?.toDateString() === date.toDateString()
    )

    const dkSchoolMatch = dkSchool.find(
      h => date >= h.start && date <= h.end
    )

    const noSchoolMatch = noSchool.find(
      h => date >= h.start && date <= h.end
    )

    return {
      isDK: !!dkPublicMatch || !!dkSchoolMatch,
      isNO: !!noPublicMatch || !!noSchoolMatch,
      dkName: dkPublicMatch?.name || dkSchoolMatch?.name || null,
      noName: noPublicMatch?.name || noSchoolMatch?.name || null
    }
  }

  return { get }
}
