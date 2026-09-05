import { NextRequest, NextResponse } from 'next/server'
import {
  parseAccessShip,
  requestHasShipAccess,
} from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { PARTIS } from '@/lib/partis'

function todayInCopenhagen() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function text(value: unknown, max = 20000) {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, 10)
    : []
}

function sanitizeHandoverHtml(value: string) {
  return value
    .replace(/<(script|style|iframe|object|embed|form|meta|link|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|meta|link|svg|math)[^>]*\/?>/gi, '')
    .replace(/\s(on\w+|style|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(["'])\s*(javascript:|data:)[\s\S]*?\2/gi, '')
}

export async function GET(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  if (!ship || !(await requestHasShipAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const parti = request.nextUrl.searchParams.get('parti')
  const status = request.nextUrl.searchParams.get('status')
  const mode = request.nextUrl.searchParams.get('mode')
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('handover_notes')
    .select(
      mode === 'status'
        ? 'parti,shift_date,read_by,receiver_name,created_at,updated_at,status'
        : '*'
    )
    .eq('department', ship)

  if (parti) {
    const validPartis = ship === 'pearl' ? PARTIS.pearl : PARTIS.galley
    if (!validPartis.includes(parti)) {
      return NextResponse.json({ error: 'Ukendt parti.' }, { status: 400 })
    }
    query = parti === 'Varm Skagerak'
      ? query.in('parti', ['Varm Skagerak', 'Skagerak'])
      : query.eq('parti', parti)
  }
  if (status === 'draft' || status === 'published') {
    query = query.eq('status', status)
  } else if (mode === 'status') {
    query = query.or('status.eq.published,status.is.null')
  }

  query = query
    .order('shift_date', { ascending: false })
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const notes: Array<Record<string, unknown>> = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((note) => ({
    ...note,
    parti: note.parti === 'Skagerak' ? 'Varm Skagerak' : note.parti,
    images: normalizeImageUrls(note.images, ship),
  }))

  if (mode !== 'status' && status === 'published' && notes.length > 0) {
    const counts = new Map<string, number>()
    const ids = notes.map((note) => String(note.id))

    for (let index = 0; index < ids.length; index += 100) {
      const { data: commentRows } = await supabase
        .from('handover_comments')
        .select('handover_id')
        .in('handover_id', ids.slice(index, index + 100))

      for (const row of commentRows ?? []) {
        const id = String(row.handover_id)
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    }

    for (const note of notes) {
      note.comment_count = counts.get(String(note.id)) ?? 0
    }
  }

  return NextResponse.json({ data: notes })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  if (!body || !ship || !(await requestHasShipAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const action = body.action
  const supabase = getSupabaseAdmin()

  async function markPreviousHandoverAsRead(parti: string, currentId: string) {
    const previousPartis = parti === 'Varm Skagerak'
      ? ['Varm Skagerak', 'Skagerak']
      : [parti]
    const { data: previousUnread } = await supabase
      .from('handover_notes')
      .select('id,receiver_name')
      .eq('department', ship)
      .in('parti', previousPartis)
      .eq('status', 'published')
      .is('read_by', null)
      .neq('id', currentId)
      .order('shift_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const previousReceiver = text(previousUnread?.receiver_name, 100).trim()
    if (!previousUnread?.id || !previousReceiver) return

    await supabase
      .from('handover_notes')
      .update({
        read_by: previousReceiver,
        read_at: new Date().toISOString(),
      })
      .eq('id', previousUnread.id)
      .eq('department', ship)
      .eq('status', 'published')
      .is('read_by', null)
  }

  if (action === 'mark-read') {
    const id = text(body.id, 100)
    if (!id) {
      return NextResponse.json({ error: 'Overlevering mangler.' }, { status: 400 })
    }

    const { data: handover, error: lookupError } = await supabase
      .from('handover_notes')
      .select('receiver_name')
      .eq('id', id)
      .eq('department', ship)
      .eq('status', 'published')
      .single()

    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
    const readBy = text(handover?.receiver_name, 100).trim()
    if (!readBy) return NextResponse.json({ error: 'Modtager mangler.' }, { status: 400 })

    const { error } = await supabase
      .from('handover_notes')
      .update({ read_by: readBy, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('department', ship)
      .eq('status', 'published')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const parti = text(body.parti, 200).trim()
  const authorName = text(body.author_name, 100)
  const receiverName = text(body.receiver_name, 100)
  const shiftDate = text(body.shift_date, 20)
  const note = sanitizeHandoverHtml(text(body.note))
  const images = stringArray(body.images).map(imageStorageValue)
  const draftId = text(body.id, 100)
  const validPartis = ship === 'pearl' ? PARTIS.pearl : PARTIS.galley

  if (!parti || !validPartis.includes(parti) || !shiftDate) {
    return NextResponse.json({ error: 'Ugyldige data.' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(shiftDate) || shiftDate < todayInCopenhagen()) {
    return NextResponse.json({ error: 'Datoen kan ikke være før i dag.' }, { status: 400 })
  }

  if (action === 'save-draft') {
    const payload = {
      department: ship,
      parti,
      author_name: authorName,
      receiver_name: receiverName,
      shift_date: shiftDate,
      note,
      images,
      status: 'draft',
      draft_saved_at: new Date().toISOString(),
    }

    if (draftId) {
      const { data, error } = await supabase
        .from('handover_notes')
        .update(payload)
        .eq('id', draftId)
        .eq('department', ship)
        .eq('status', 'draft')
        .select('*')
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }

    const { data: existing } = await supabase
      .from('handover_notes')
      .select('id')
      .eq('department', ship)
      .eq('parti', parti)
      .eq('status', 'draft')
      .maybeSingle()

    const result = existing?.id
      ? await supabase
          .from('handover_notes')
          .update(payload)
          .eq('id', existing.id)
          .eq('department', ship)
          .select('*')
          .single()
      : await supabase.from('handover_notes').insert(payload).select('*').single()

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // A successfully saved, non-empty draft means the next handover has begun.
    // Only then may the previous published handover be closed as read.
    if (authorName.trim() || receiverName.trim() || note.trim() || images.length > 0) {
      await markPreviousHandoverAsRead(parti, result.data.id)
    }

    return NextResponse.json({ data: result.data })
  }

  if (action === 'publish') {
    if (!authorName.trim() || !receiverName.trim() || !note.trim()) {
      return NextResponse.json({ error: 'Obligatoriske felter mangler.' }, { status: 400 })
    }

    const payload = {
      department: ship,
      parti,
      author_name: authorName,
      receiver_name: receiverName,
      shift_date: shiftDate,
      note,
      images,
      status: 'published',
      read_by: null,
      read_at: null,
      created_at: new Date().toISOString(),
    }

    const result = draftId
      ? await supabase
          .from('handover_notes')
          .update(payload)
          .eq('id', draftId)
          .eq('department', ship)
          .eq('status', 'draft')
          .select('*')
          .single()
      : await supabase.from('handover_notes').insert(payload).select('*').single()

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }
    await markPreviousHandoverAsRead(parti, result.data.id)
    return NextResponse.json({ data: result.data })
  }

  return NextResponse.json({ error: 'Ukendt handling.' }, { status: 400 })
}

function imageStorageValue(value: string) {
  const marker = '/storage/v1/object/public/handover-images/'
  const index = value.indexOf(marker)
  if (index >= 0) return decodeURIComponent(value.slice(index + marker.length)).split('?')[0]

  const proxyMarker = '/api/handover-images/'
  const proxyIndex = value.indexOf(proxyMarker)
  if (proxyIndex >= 0) {
    return decodeURIComponent(value.slice(proxyIndex + proxyMarker.length)).split('?')[0]
  }

  return value
}

function normalizeImageUrls(value: unknown, ship: 'crown' | 'pearl') {
  return stringArray(value).map((image) => {
    const path = imageStorageValue(image)
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `/api/handover-images/${encodeURI(path)}?ship=${ship}`
  })
}
