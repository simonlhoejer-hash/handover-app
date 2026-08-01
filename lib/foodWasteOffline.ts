export type CachedFoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number | string
  comment: string | null
  vessel?: 'crown' | 'pearl'
  pending?: boolean
}

export type CachedFoodWasteGuestCount = {
  id: string
  created_at?: string
  service_date: string
  guest_count: number
  comment: string | null
  vessel?: 'crown' | 'pearl'
}

const FOOD_WASTE_CACHE_KEY = 'foodWasteCachedEntries'
const FOOD_WASTE_GUEST_CACHE_KEY = 'foodWasteCachedGuestCounts'
export const FOOD_WASTE_PENDING_KEY = 'foodWastePendingEntries'
const LEGACY_LOCATION_NAMES = new Map([
  ['Produktion Kold Galley', 'Produktion Skagerak Galley'],
  ['Produktion Main Galley', 'Produktion Varm Galley'],
  ['Produktion Proviant dæk 1', 'Produktion Proviant'],
])

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readStorageArray<T>(key: string): T[] {
  if (!canUseStorage()) return []

  try {
    const saved = window.localStorage.getItem(key)
    if (!saved) return []

    const parsed = JSON.parse(saved) as T[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorageArray<T>(key: string, rows: T[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(rows))

  if (key === FOOD_WASTE_PENDING_KEY || key.startsWith(`${FOOD_WASTE_PENDING_KEY}:`)) {
    window.dispatchEvent(new Event('food-waste-pending-updated'))
  }
}

function vesselKey(key: string, vessel: 'crown' | 'pearl') {
  return vessel === 'crown' ? key : `${key}:${vessel}`
}

export function readPendingFoodWasteEntries(vessel: 'crown' | 'pearl' = 'crown') {
  return readStorageArray<CachedFoodWasteEntry>(
    vesselKey(FOOD_WASTE_PENDING_KEY, vessel)
  ).map(normalizeLegacyLocationName)
}

export function writePendingFoodWasteEntries(entries: CachedFoodWasteEntry[], vessel: 'crown' | 'pearl' = 'crown') {
  writeStorageArray(vesselKey(FOOD_WASTE_PENDING_KEY, vessel), entries)
}

export function readCachedFoodWasteEntries(vessel: 'crown' | 'pearl' = 'crown') {
  return readStorageArray<CachedFoodWasteEntry>(
    vesselKey(FOOD_WASTE_CACHE_KEY, vessel)
  ).map(normalizeLegacyLocationName)
}

function normalizeLegacyLocationName(entry: CachedFoodWasteEntry) {
  const locationName = LEGACY_LOCATION_NAMES.get(entry.location_name)
  if (!locationName) return entry

  return {
    ...entry,
    location_name: locationName,
  }
}

export function cacheFoodWasteEntries(entries: CachedFoodWasteEntry[], vessel: 'crown' | 'pearl' = 'crown') {
  const byId = new Map<string, CachedFoodWasteEntry>()

  for (const entry of [...entries, ...readCachedFoodWasteEntries(vessel)]) {
    if (entry.pending || entry.id.startsWith('local-')) continue
    byId.set(entry.id, entry)
  }

  writeStorageArray(
    vesselKey(FOOD_WASTE_CACHE_KEY, vessel),
    Array.from(byId.values())
      .sort((a, b) => b.waste_date.localeCompare(a.waste_date))
      .slice(0, 500)
  )
}

export function removeCachedFoodWasteEntry(id: string, vessel: 'crown' | 'pearl' = 'crown') {
  writeStorageArray(
    vesselKey(FOOD_WASTE_CACHE_KEY, vessel),
    readCachedFoodWasteEntries(vessel).filter((entry) => entry.id !== id)
  )
}

export function readCachedFoodWasteGuestCounts(vessel: 'crown' | 'pearl' = 'crown') {
  return readStorageArray<CachedFoodWasteGuestCount>(vesselKey(FOOD_WASTE_GUEST_CACHE_KEY, vessel))
}

export function cacheFoodWasteGuestCounts(counts: CachedFoodWasteGuestCount[], vessel: 'crown' | 'pearl' = 'crown') {
  const byDate = new Map<string, CachedFoodWasteGuestCount>()

  for (const count of [...counts, ...readCachedFoodWasteGuestCounts(vessel)]) {
    byDate.set(count.service_date, count)
  }

  writeStorageArray(
    vesselKey(FOOD_WASTE_GUEST_CACHE_KEY, vessel),
    Array.from(byDate.values())
      .sort((a, b) => b.service_date.localeCompare(a.service_date))
      .slice(0, 500)
  )
}
