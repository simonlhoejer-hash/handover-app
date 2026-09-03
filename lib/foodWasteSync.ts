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

    for (const entry of queue) {
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
          client_id: entry.client_id,
          ship: vessel,
        })
        })
        data = result.data
      } catch (caught) {
        error = caught
      }

      if (!error && data) {
        synced += 1
        cacheFoodWasteEntries([data], vessel)
      }

      // Remove only the entry that succeeded. Re-read storage first so a new
      // registration added during sync can never be overwritten or lost.
      if (!error && data) {
        writePendingFoodWasteEntries(
          readPendingFoodWasteEntries(vessel).filter(
            (pending) => pending.id !== entry.id
          ),
          vessel
        )
      }
    }
  }

  return {
    synced,
    remaining: getPendingFoodWasteCount(),
  }
}

export function syncAllPendingFoodWaste() {
  if (activeSync) return activeSync

  const synchronizedRun =
    typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks
          .request('handover-food-waste-sync', () => runSync())
          .then((result) => result ?? {
            synced: 0,
            remaining: getPendingFoodWasteCount(),
          })
      : runSync()

  activeSync = synchronizedRun.finally(() => {
    activeSync = null
  })

  return activeSync
}
