import { getEasterSunday } from './easter'

/* ============================= */
/*  🇩🇰 DANSKE OFFENTLIGE HELLIGDAGE */
/* ============================= */

export function getDanishPublicHolidays(year: number) {
  const easter = getEasterSunday(year)

  const maundyThursday = addDays(easter, -3)
  const goodFriday = addDays(easter, -2)
  const easterMonday = addDays(easter, 1)
  const ascensionDay = addDays(easter, 39)
  const pentecost = addDays(easter, 49)
  const pentecostMonday = addDays(easter, 50)

  return [
    { date: new Date(year, 0, 1), name: 'Nytårsdag' },
    { date: maundyThursday, name: 'Skærtorsdag' },
    { date: goodFriday, name: 'Langfredag' },
    { date: easter, name: 'Påskedag' },
    { date: easterMonday, name: '2. Påskedag' },
    { date: ascensionDay, name: 'Kristi Himmelfart' },
    { date: pentecost, name: 'Pinsedag' },
    { date: pentecostMonday, name: '2. Pinsedag' },
    { date: new Date(year, 11, 25), name: 'Juledag' },
    { date: new Date(year, 11, 26), name: '2. Juledag' },
  ]
}

/* ============================= */
/*  🇩🇰 DANSKE SKOLEFERIER */
/* ============================= */

export function getDanishSchoolHolidays(year: number) {
  return [
    {
      name: 'Vinterferie',
      start: getDateOfISOWeek(7, year),
      end: addDays(getDateOfISOWeek(7, year), 6),
    },
    {
      name: 'Påskeferie',
      start: new Date(year, 2, 30), // kan senere kobles til påske dynamisk
      end: new Date(year, 3, 6),
    },
    {
      name: 'Sommerferie',
      start: new Date(year, 5, 27),
      end: new Date(year, 7, 9),
    },
    {
      name: 'Efterårsferie',
      start: getDateOfISOWeek(42, year),
      end: addDays(getDateOfISOWeek(42, year), 6),
    },
    {
      name: 'Juleferie',
      start: new Date(year, 11, 19),
      end: new Date(year + 1, 0, 2),
    },
  ]
}

/* ============================= */
/*  HELPERS */
/* ============================= */

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getDateOfISOWeek(week: number, year: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dayOfWeek = simple.getDay()
  const ISOweekStart = simple

  if (dayOfWeek <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())

  return ISOweekStart
}
