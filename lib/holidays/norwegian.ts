import { getEasterSunday } from './easter'

/* ============================= */
/*  🇳🇴 NORSKE OFFENTLIGE HELLIGDAGE */
/* ============================= */

export function getNorwegianPublicHolidays(year: number) {
  const easter = getEasterSunday(year)

  const maundyThursday = addDays(easter, -3)
  const goodFriday = addDays(easter, -2)
  const easterMonday = addDays(easter, 1)
  const ascensionDay = addDays(easter, 39)
  const pentecost = addDays(easter, 49)
  const pentecostMonday = addDays(easter, 50)

  return [
    { date: new Date(year, 0, 1), name: 'Nyttårsdag' },
    { date: maundyThursday, name: 'Skjærtorsdag' },
    { date: goodFriday, name: 'Langfredag' },
    { date: easter, name: '1. påskedag' },
    { date: easterMonday, name: '2. påskedag' },
    { date: ascensionDay, name: 'Kristi himmelfartsdag' },
    { date: pentecost, name: '1. pinsedag' },
    { date: pentecostMonday, name: '2. pinsedag' },
    { date: new Date(year, 4, 1), name: '1. mai – Arbeidernes dag' },
    { date: new Date(year, 4, 17), name: '17. mai – Grunnlovsdag' },
    { date: new Date(year, 11, 25), name: '1. juledag' },
    { date: new Date(year, 11, 26), name: '2. juledag' },
  ]
}

/* ============================= */
/*  🇳🇴 NORSKE SKOLEFERIER */
/* ============================= */

export function getNorwegianSchoolHolidays(year: number) {
  return [
    {
      name: 'Vinterferie',
      start: getDateOfISOWeek(8, year),
      end: addDays(getDateOfISOWeek(8, year), 6),
    },
    {
      name: 'Påskeferie',
      start: new Date(year, 2, 30), // kan senere kobles til påske dynamisk
      end: new Date(year, 3, 6),
    },
    {
      name: 'Sommerferie',
      start: new Date(year, 5, 20),
      end: addDays(new Date(year, 5, 20), 42),
    },
    {
      name: 'Høstferie',
      start: getDateOfISOWeek(40, year),
      end: addDays(getDateOfISOWeek(40, year), 6),
    },
    {
      name: 'Juleferie',
      start: new Date(year, 11, 20),
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
