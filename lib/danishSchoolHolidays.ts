export function getDanishSchoolHolidays(year: number) {
  const holidays: { title: string; start: Date; end: Date }[] = []

  // 🟢 Vinterferie – uge 7 (mandag-søndag)
  const winterStart = getDateOfISOWeek(7, year)
  const winterEnd = new Date(winterStart)
  winterEnd.setDate(winterStart.getDate() + 6)

  holidays.push({
    title: "Vinterferie",
    start: winterStart,
    end: winterEnd,
  })

  // 🍂 Efterårsferie – uge 42
  const autumnStart = getDateOfISOWeek(42, year)
  const autumnEnd = new Date(autumnStart)
  autumnEnd.setDate(autumnStart.getDate() + 6)

  holidays.push({
    title: "Efterårsferie",
    start: autumnStart,
    end: autumnEnd,
  })

  // ☀️ Sommerferie – sidste lørdag i juni → 6 uger frem
  const juneLastDay = new Date(year, 5, 30)
  const summerStart = new Date(juneLastDay)
  while (summerStart.getDay() !== 6) {
    summerStart.setDate(summerStart.getDate() - 1)
  }

  const summerEnd = new Date(summerStart)
  summerEnd.setDate(summerStart.getDate() + 42)

  holidays.push({
    title: "Sommerferie",
    start: summerStart,
    end: summerEnd,
  })

  // 🎄 Juleferie – 19. december → 2. januar
  holidays.push({
    title: "Juleferie",
    start: new Date(year, 11, 19),
    end: new Date(year + 1, 0, 2),
  })

  return holidays
}

// Hjælpefunktion: Find mandag i ISO-uge
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
