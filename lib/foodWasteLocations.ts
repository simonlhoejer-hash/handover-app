export const FOOD_WASTE_LOCATIONS = [
  { name: 'Skagerak morgen', slug: 'skagerak-morgen' },
  { name: 'Skagerak aften', slug: 'skagerak-aften' },
  { name: 'Messen morgen', slug: 'messen-morgen' },
  { name: 'Messen frokost', slug: 'messen-frokost' },
  { name: 'Messen aften', slug: 'messen-aften' },
  { name: 'Commodore morgen', slug: 'commodore-morgen' },
  { name: 'Produktion Main Galley', slug: 'produktion-main-galley' },
  { name: 'Produktion Skagerak Galley', slug: 'produktion-skagerak-galley' },
  { name: 'Produktion Kold Galley', slug: 'produktion-kold-galley' },
  { name: 'Produktion Bageri', slug: 'produktion-bageri' },
  { name: 'Produktion Slagteri', slug: 'produktion-slagteri' },
  { name: 'Produktion Proviant dæk 1', slug: 'produktion-proviant-daek-1' },
]

export function getFoodWasteLocation(slug: string) {
  return FOOD_WASTE_LOCATIONS.find((location) => location.slug === slug)
}
