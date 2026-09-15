import 'server-only'

import type { AccessShip } from '@/lib/shipAccess'
import { CROWN_PARTI_GROUPS, PEARL_PARTI_GROUPS } from '@/lib/partis'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export type HandoverFolderGroup = 'partier' | 'skyllerier'
export type HandoverFolder = { name: string; group: HandoverFolderGroup }

const CONFIG_PARTI = '__handover_folders__'

function defaults(ship: AccessShip): HandoverFolder[] {
  const groups = ship === 'pearl' ? PEARL_PARTI_GROUPS : CROWN_PARTI_GROUPS
  return groups.flatMap((group) =>
    group.items.map((name) => ({
      name,
      group: group.title === 'Skyllerier' ? 'skyllerier' as const : 'partier' as const,
    }))
  )
}

function cleanFolders(value: unknown, ship: AccessShip): HandoverFolder[] {
  if (!Array.isArray(value)) return defaults(ship)
  const seen = new Set<string>()
  const folders = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const name = typeof row.name === 'string' ? row.name.trim().slice(0, 80) : ''
    const group: HandoverFolderGroup = row.group === 'skyllerier' ? 'skyllerier' : 'partier'
    const key = name.toLocaleLowerCase('da-DK')
    if (!name || seen.has(key) || name === CONFIG_PARTI) return []
    seen.add(key)
    return [{ name, group }]
  })
  return folders.length ? folders : defaults(ship)
}

export async function readHandoverFolders(ship: AccessShip) {
  const { data, error } = await getSupabaseAdmin()
    .from('handover_notes')
    .select('note')
    .eq('department', ship)
    .eq('parti', CONFIG_PARTI)
    .eq('status', 'draft')
    .maybeSingle()

  if (error) throw error
  if (!data?.note) return defaults(ship)
  try {
    return cleanFolders(JSON.parse(data.note), ship)
  } catch {
    return defaults(ship)
  }
}

export async function writeHandoverFolders(ship: AccessShip, folders: HandoverFolder[]) {
  const cleaned = cleanFolders(folders, ship)
  const supabase = getSupabaseAdmin()
  const { data: existing, error: lookupError } = await supabase
    .from('handover_notes')
    .select('id')
    .eq('department', ship)
    .eq('parti', CONFIG_PARTI)
    .eq('status', 'draft')
    .maybeSingle()
  if (lookupError) throw lookupError

  const payload = {
    department: ship,
    parti: CONFIG_PARTI,
    author_name: 'Souschef',
    receiver_name: 'Souschef',
    shift_date: new Date().toISOString().slice(0, 10),
    note: JSON.stringify(cleaned),
    images: [],
    status: 'draft',
    draft_saved_at: new Date().toISOString(),
  }
  const result = existing?.id
    ? await supabase.from('handover_notes').update(payload).eq('id', existing.id)
    : await supabase.from('handover_notes').insert(payload)
  if (result.error) throw result.error
  return cleaned
}

export async function validHandoverFolderNames(ship: AccessShip) {
  return (await readHandoverFolders(ship)).map((folder) => folder.name)
}
