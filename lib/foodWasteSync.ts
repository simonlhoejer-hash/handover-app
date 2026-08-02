import { secureFetch } from '@/lib/secureApi'
import {
  cacheFoodWasteEntries,
  readPendingFoodWasteEntries,
  writePendingFoodWasteEntries,
} from '@/lib/foodWasteOffline'

const VESSELS = ['crown', 'pearl'] as const

export type FoodWasteSyncResult = {
  synced: number
  remaining: number
}

let activeSync: Promise<FoodWasteSyncResult> | null = null

export function getPendingFoodWasteCount() {
  return VESSELS.reduce(
    (total, vessel) => total + readPendingFoodWasteEntries(vessel).length,
    0
  )
}

async function runSync(): Promise<FoodWasteSyncResult> {
  let synced = 0

  for (const vessel of VESSELS) {
    const queue = readPendingFoodWasteEntries(vessel)
    const failed = []

    for (let index = 0; index < queue.length; index += 1) {
      const entry = queue[index]
      let data = null
      let error: unknown = null
      try {
        const result = await secureFetch<{ data: any }>('/api/food-waste/entries', {
          method: 'POST',
          body: JSON.stringify({
          waste_date: entry.waste_date,
          location_name: entry.location_name,
          quantity_kg: entry.quantity_kg,
          comment: entry.comment,
          ship: vessel,
        })
        })
        data = result.data
      } catch (caught) {
        error = caught
      }

      if (error || !data) {
        failed.push(entry)
      } else {
        synced += 1
        cacheFoodWasteEntries([data], vessel)
      }

      // Persist progress after every attempt. A connection loss therefore only
      // leaves failed and not-yet-attempted entries in the offline queue.
      writePendingFoodWasteEntries(
        [...failed, ...queue.slice(index + 1)],
        vessel
      )
    }
  }

  return {
    synced,
    remaining: getPendingFoodWasteCount(),
  }
}

export function syncAllPendingFoodWaste() {
  if (activeSync) return activeSync

  activeSync = runSync().finally(() => {
    activeSync = null
  })

  return activeSync
}
