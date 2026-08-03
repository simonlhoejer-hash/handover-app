export type LocalHandoverDraft = {
  ship: 'crown' | 'pearl'
  parti: string
  author_name: string
  receiver_name: string
  shift_date: string
  note: string
  images: string[]
  saved_at: string
}

const PREFIX = 'handover-local-draft:'

function storageKey(ship: 'crown' | 'pearl', parti: string) {
  return `${PREFIX}${ship}:${encodeURIComponent(parti)}`
}

function notify() {
  window.dispatchEvent(new Event('handover-draft-updated'))
}

export function readLocalHandoverDraft(
  ship: 'crown' | 'pearl',
  parti: string
): LocalHandoverDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const value = window.localStorage.getItem(storageKey(ship, parti))
    return value ? (JSON.parse(value) as LocalHandoverDraft) : null
  } catch {
    return null
  }
}

export function writeLocalHandoverDraft(draft: LocalHandoverDraft) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(draft.ship, draft.parti), JSON.stringify(draft))
    notify()
  } catch {
    // The online server draft remains available if browser storage is blocked.
  }
}

export function removeLocalHandoverDraft(
  ship: 'crown' | 'pearl',
  parti: string
) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey(ship, parti))
    notify()
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

export function getLocalHandoverDraftCount() {
  if (typeof window === 'undefined') return 0

  try {
    let count = 0
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(PREFIX)) count += 1
    }
    return count
  } catch {
    return 0
  }
}
