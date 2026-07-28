export type CachedFoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number | string
  comment: string | null
  pending?: boolean
}

export type CachedFoodWasteGuestCount = {
  id: string
  created_at?: string
  service_date: string
  guest_count: number
  comment: string | null
}

const FOOD_WASTE_CACHE_KEY = 'foodWasteCachedEntries'
const FOOD_WASTE_GUEST_CACHE_KEY = 'foodWasteCachedGuestCounts'
export const FOOD_WASTE_PENDING_KEY = 'foodWastePendingEntries'

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
}

export function readPendingFoodWasteEntries() {
  return readStorageArray<CachedFoodWasteEntry>(FOOD_WASTE_PENDING_KEY)
}

export function writePendingFoodWasteEntries(entries: CachedFoodWasteEntry[]) {
  writeStorageArray(FOOD_WASTE_PENDING_KEY, entries)
}

export function readCachedFoodWasteEntries() {
  return readStorageArray<CachedFoodWasteEntry>(FOOD_WASTE_CACHE_KEY)
}

export function cacheFoodWasteEntries(entries: CachedFoodWasteEntry[]) {
  const byId = new Map<string, CachedFoodWasteEntry>()

  for (const entry of [...entries, ...readCachedFoodWasteEntries()]) {
    if (entry.pending || entry.id.startsWith('local-')) continue
    byId.set(entry.id, entry)
  }

  writeStorageArray(
    FOOD_WASTE_CACHE_KEY,
    Array.from(byId.values())
      .sort((a, b) => b.waste_date.localeCompare(a.waste_date))
      .slice(0, 500)
  )
}

export function removeCachedFoodWasteEntry(id: string) {
  writeStorageArray(
    FOOD_WASTE_CACHE_KEY,
    readCachedFoodWasteEntries().filter((entry) => entry.id !== id)
  )
}

export function readCachedFoodWasteGuestCounts() {
  return readStorageArray<CachedFoodWasteGuestCount>(FOOD_WASTE_GUEST_CACHE_KEY)
}

export function cacheFoodWasteGuestCounts(counts: CachedFoodWasteGuestCount[]) {
  const byDate = new Map<string, CachedFoodWasteGuestCount>()

  for (const count of [...counts, ...readCachedFoodWasteGuestCounts()]) {
    byDate.set(count.service_date, count)
  }

  writeStorageArray(
    FOOD_WASTE_GUEST_CACHE_KEY,
    Array.from(byDate.values())
      .sort((a, b) => b.service_date.localeCompare(a.service_date))
      .slice(0, 500)
  )
}
