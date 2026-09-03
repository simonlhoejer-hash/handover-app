import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import {
  SOUSCHEF_ACCESS_COOKIE_NAME,
  verifySouschefAccessToken,
} from '@/lib/shipAccess'

const PARTI = 'Souschef opfølgning'

type TaskStatus = 'new' | 'doing' | 'waiting' | 'done'
type TaskPriority = 'normal' | 'important' | 'critical'

type ManagerTask = {
  id: string
  title: string
  description: string
  owner: string
  dueDate: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
}

async function hasAccess(request: NextRequest) {
  const token = request.cookies.get(SOUSCHEF_ACCESS_COOKIE_NAME)?.value
  try {
    return await verifySouschefAccessToken(token)
  } catch {
    return false
  }
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function cleanTasks(value: unknown): ManagerTask[] {
  if (!Array.isArray(value)) return []
  const statuses = new Set<TaskStatus>(['new', 'doing', 'waiting', 'done'])
  const priorities = new Set<TaskPriority>(['normal', 'important', 'critical'])

  return value.slice(0, 300).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const title = cleanText(row.title, 160)
    if (!title) return []
    const now = new Date().toISOString()
    const status = statuses.has(row.status as TaskStatus) ? row.status as TaskStatus : 'new'
    const priority = priorities.has(row.priority as TaskPriority) ? row.priority as TaskPriority : 'normal'
    return [{
      id: cleanText(row.id, 100) || crypto.randomUUID(),
      title,
      description: cleanText(row.description, 4000),
      owner: cleanText(row.owner, 100),
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(cleanText(row.dueDate, 10)) ? cleanText(row.dueDate, 10) : '',
      status,
      priority,
      createdAt: cleanText(row.createdAt, 40) || now,
      updatedAt: now,
    }]
  })
}

async function readRow() {
  return getSupabaseAdmin()
    .from('handover_notes')
    .select('id,note,updated_at')
    .eq('department', 'crown')
    .eq('parti', PARTI)
    .eq('status', 'draft')
    .maybeSingle()
}

export async function GET(request: NextRequest) {
  if (!(await hasAccess(request))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const { data, error } = await readRow()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let tasks: ManagerTask[] = []
  try {
    tasks = cleanTasks(data?.note ? JSON.parse(data.note) : [])
  } catch {
    tasks = []
  }
  return NextResponse.json({ data: tasks, updatedAt: data?.updated_at ?? null })
}

export async function POST(request: NextRequest) {
  if (!(await hasAccess(request))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { tasks?: unknown } | null
  if (!body) return NextResponse.json({ error: 'Ugyldige data.' }, { status: 400 })
  const tasks = cleanTasks(body.tasks)
  const existing = await readRow()
  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 })
  }

  const payload = {
    department: 'crown',
    parti: PARTI,
    author_name: 'Souschef',
    receiver_name: 'Næste souschef',
    shift_date: new Date().toISOString().slice(0, 10),
    note: JSON.stringify(tasks),
    images: [],
    status: 'draft',
    draft_saved_at: new Date().toISOString(),
  }

  const result = existing.data?.id
    ? await getSupabaseAdmin()
        .from('handover_notes')
        .update(payload)
        .eq('id', existing.data.id)
        .select('updated_at')
        .single()
    : await getSupabaseAdmin()
        .from('handover_notes')
        .insert(payload)
        .select('updated_at')
        .single()

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }
  return NextResponse.json({ data: tasks, updatedAt: result.data.updated_at })
}
