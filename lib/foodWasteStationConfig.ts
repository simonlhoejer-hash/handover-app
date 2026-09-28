import { FOOD_WASTE_LOCATIONS } from './foodWasteLocations'

export type WasteArea = 'morning-buffet' | 'evening-buffet' | 'mess' | 'production'
export type FoodWasteStation = {
  slug: string
  name: string
  area: WasteArea
  active: boolean
  order: number
}

const areaBySlug: Record<string, WasteArea> = {
  'skagerak-morgen-varmt': 'morning-buffet', 'skagerak-morgen-koldt': 'morning-buffet',
  'commodore-morgen-varmt': 'morning-buffet', 'commodore-morgen-koldt': 'morning-buffet',
  'skagerak-aften-boernebuffet': 'evening-buffet', 'skagerak-aften-koldt': 'evening-buffet',
  'skagerak-aften-varmt': 'evening-buffet', 'skagerak-aften-oerne': 'evening-buffet',
  'messen-morgen-koldt': 'mess', 'messen-morgen-varmt': 'mess', 'messen-morgen-tallerkenspild': 'mess',
  'messen-frokost-koldt': 'mess', 'messen-frokost-varmt': 'mess', 'messen-frokost-tallerkenspild': 'mess',
  'messen-aften-koldt': 'mess', 'messen-aften-varmt': 'mess', 'messen-aften-tallerkenspild': 'mess',
  'produktion-main-galley': 'production', 'produktion-skagerak-galley': 'production',
  'produktion-slagteri': 'production', 'produktion-proviant-daek-1': 'production',
}

export function defaultFoodWasteStations(ship: 'crown' | 'pearl'): FoodWasteStation[] {
  return FOOD_WASTE_LOCATIONS
    .filter((location) => areaBySlug[location.slug])
    .filter((location) => ship === 'crown' || areaBySlug[location.slug] !== 'production')
    .map((location, order) => ({ ...location, area: areaBySlug[location.slug], active: true, order }))
}

export function withCurrentMessStations(stations: FoodWasteStation[], ship: 'crown' | 'pearl') {
  const currentMess = defaultFoodWasteStations(ship).filter((station) => station.area === 'mess')
  const withoutMess = stations.filter((station) => station.area !== 'mess')
  const productionIndex = withoutMess.findIndex((station) => station.area === 'production')
  const index = productionIndex < 0 ? withoutMess.length : productionIndex

  return [...withoutMess.slice(0, index), ...currentMess, ...withoutMess.slice(index)]
    .map((station, order) => ({ ...station, order }))
}

export function stationSlug(name: string) {
  return name.toLocaleLowerCase('da-DK').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}
