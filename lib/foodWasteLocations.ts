export const FOOD_WASTE_LOCATIONS = [
  { name: 'Skagerak morgen', slug: 'skagerak-morgen' },
  { name: 'Skagerak aften', slug: 'skagerak-aften' },
  { name: 'Skagerak morgen varmt', slug: 'skagerak-morgen-varmt' },
  { name: 'Skagerak morgen koldt', slug: 'skagerak-morgen-koldt' },
  { name: 'Commodore morgen varmt', slug: 'commodore-morgen-varmt' },
  { name: 'Commodore morgen koldt', slug: 'commodore-morgen-koldt' },
  { name: 'Skagerak aften børnebuffet', slug: 'skagerak-aften-boernebuffet' },
  { name: 'Skagerak aften koldt', slug: 'skagerak-aften-koldt' },
  { name: 'Skagerak aften varmt', slug: 'skagerak-aften-varmt' },
  { name: 'Skagerak aften øerne', slug: 'skagerak-aften-oerne' },
  { name: 'Messen morgen', slug: 'messen-morgen' },
  { name: 'Messen frokost', slug: 'messen-frokost' },
  { name: 'Messen aften', slug: 'messen-aften' },
  { name: 'Messen morgen buffetspild', slug: 'messen-morgen-buffetspild' },
  { name: 'Messen morgen tallerkenspild', slug: 'messen-morgen-tallerkenspild' },
  { name: 'Messen frokost buffetspild', slug: 'messen-frokost-buffetspild' },
  { name: 'Messen frokost tallerkenspild', slug: 'messen-frokost-tallerkenspild' },
  { name: 'Messen aften buffetspild', slug: 'messen-aften-buffetspild' },
  { name: 'Messen aften tallerkenspild', slug: 'messen-aften-tallerkenspild' },
  { name: 'Commodore morgen', slug: 'commodore-morgen' },
  { name: 'Produktion Varm Galley', slug: 'produktion-main-galley' },
  { name: 'Produktion Skagerak Galley', slug: 'produktion-skagerak-galley' },
  { name: 'Produktion Slagteri', slug: 'produktion-slagteri' },
  { name: 'Produktion Proviant', slug: 'produktion-proviant-daek-1' },
]

export function getFoodWasteLocation(slug: string) {
  return FOOD_WASTE_LOCATIONS.find((location) => location.slug === slug)
}

export function displayFoodWasteLocation(name: string, lang: string) {
  if (lang === 'en') {
    const englishNames: Record<string, string> = {
      'Skagerak morgen': 'Skagerak morning',
      'Skagerak aften': 'Skagerak evening',
      'Skagerak morgen varmt': 'Skagerak morning · Hot',
      'Skagerak morgen koldt': 'Skagerak morning · Cold',
      'Commodore morgen varmt': 'Commodore morning · Hot',
      'Commodore morgen koldt': 'Commodore morning · Cold',
      'Skagerak aften børnebuffet': 'Evening buffet · Kids buffet',
      'Skagerak aften koldt': 'Evening buffet · Cold',
      'Skagerak aften varmt': 'Evening buffet · Hot',
      'Skagerak aften øerne': 'Evening buffet · Islands',
      'Messen morgen': 'Crew mess morning',
      'Messen frokost': 'Crew mess lunch',
      'Messen aften': 'Crew mess evening',
      'Messen morgen buffetspild': 'Morning buffet waste',
      'Messen morgen tallerkenspild': 'Morning plate waste',
      'Messen frokost buffetspild': 'Lunch buffet waste',
      'Messen frokost tallerkenspild': 'Lunch plate waste',
      'Messen aften buffetspild': 'Evening buffet waste',
      'Messen aften tallerkenspild': 'Evening plate waste',
      'Commodore morgen': 'Commodore morning',
      'Produktion Main Galley': 'Production Hot Galley',
      'Produktion Varm Galley': 'Production Hot Galley',
      'Produktion Skagerak Galley': 'Production Skagerak Galley',
      'Produktion Slagteri': 'Production Butchery',
      'Produktion Proviant': 'Production Provisions',
    }

    return englishNames[name] ?? name
  }

  if (lang === 'sv') {
    const swedishNames: Record<string, string> = {
      'Skagerak morgen varmt': 'Skagerak morgon · Varmt',
      'Skagerak morgen koldt': 'Skagerak morgon · Kallt',
      'Commodore morgen varmt': 'Commodore morgon · Varmt',
      'Commodore morgen koldt': 'Commodore morgon · Kallt',
      'Skagerak aften børnebuffet': 'Kvällsbuffé · Barnbuffé',
      'Skagerak aften koldt': 'Kvällsbuffé · Kallt',
      'Skagerak aften varmt': 'Kvällsbuffé · Varmt',
      'Skagerak aften øerne': 'Kvällsbuffé · Öarna',
      'Messen morgen buffetspild': 'Morgon buffésvinn',
      'Messen morgen tallerkenspild': 'Morgon tallrikssvinn',
      'Messen frokost buffetspild': 'Lunch buffésvinn',
      'Messen frokost tallerkenspild': 'Lunch tallrikssvinn',
      'Messen aften buffetspild': 'Kväll buffésvinn',
      'Messen aften tallerkenspild': 'Kväll tallrikssvinn',
      'Skagerak morgen': 'Skagerak morgon',
      'Skagerak aften': 'Skagerak kväll',
      'Messen morgen': 'Mässen morgon',
      'Messen frokost': 'Mässen lunch',
      'Messen aften': 'Mässen kväll',
      'Commodore morgen': 'Commodore morgon',
      'Produktion Main Galley': 'Produktion Varmkök',
      'Produktion Varm Galley': 'Produktion Varmkök',
      'Produktion Skagerak Galley': 'Produktion Skagerak-kök',
      'Produktion Slagteri': 'Produktion Slakteri',
      'Produktion Proviant': 'Produktion Proviant',
    }

    return swedishNames[name] ?? name
  }

  if (name === 'Produktion Main Galley') return 'Produktion Varm Galley'

  const danishNames: Record<string, string> = {
    'Skagerak morgen varmt': 'Skagerak morgen · Varmt',
    'Skagerak morgen koldt': 'Skagerak morgen · Koldt',
    'Commodore morgen varmt': 'Commodore morgen · Varmt',
    'Commodore morgen koldt': 'Commodore morgen · Koldt',
    'Skagerak aften børnebuffet': 'Aftenbuffet · Børnebuffet',
    'Skagerak aften koldt': 'Aftenbuffet · Koldt',
    'Skagerak aften varmt': 'Aftenbuffet · Varmt',
    'Skagerak aften øerne': 'Aftenbuffet · Øerne',
    'Messen morgen buffetspild': 'Messen morgen · Buffetspild',
    'Messen morgen tallerkenspild': 'Messen morgen · Tallerkenspild',
    'Messen frokost buffetspild': 'Messen frokost · Buffetspild',
    'Messen frokost tallerkenspild': 'Messen frokost · Tallerkenspild',
    'Messen aften buffetspild': 'Messen aften · Buffetspild',
    'Messen aften tallerkenspild': 'Messen aften · Tallerkenspild',
  }

  return danishNames[name] ?? name
}

export function getFoodWasteLocationPresentation(name: string, lang: string) {
  const displayName = displayFoodWasteLocation(name, lang)
  const isMorningBuffet = /^(Skagerak|Commodore) morgen (varmt|koldt)$/.test(name)
  const isEveningBuffet = /^Skagerak aften (børnebuffet|koldt|varmt|øerne)$/.test(name)

  if (!isMorningBuffet && !isEveningBuffet) {
    return { title: displayName, subtitle: '', tone: 'neutral' as const }
  }

  const title = displayName.split('·').pop()?.trim() || displayName
  const station = name.startsWith('Commodore') ? 'Commodore' : 'Skagerak'
  const meal = isMorningBuffet
    ? lang === 'en' ? 'morning buffet' : lang === 'sv' ? 'morgonbuffé' : 'morgenbuffet'
    : lang === 'en' ? 'evening buffet' : lang === 'sv' ? 'kvällsbuffé' : 'aftenbuffet'

  return {
    title,
    subtitle: `${station} ${meal}`,
    tone: isMorningBuffet ? 'morning' as const : 'evening' as const,
  }
}
