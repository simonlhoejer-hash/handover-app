import { NextRequest, NextResponse } from 'next/server'
import {
  parseAccessShip,
  requestHasShipAccess,
} from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

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

  if (parti) query = query.eq('parti', parti)
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

  const notes = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((note) => ({
    ...note,
    images: normalizeImageUrls(note.images, ship),
  }))

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

  if (action === 'mark-read') {
    const id = text(body.id, 100)
    const readBy = text(body.readBy, 100).trim()
    if (!id || !readBy) {
      return NextResponse.json({ error: 'Navn mangler.' }, { status: 400 })
    }

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

  if (!parti || !shiftDate) {
    return NextResponse.json({ error: 'Ugyldige data.' }, { status: 400 })
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
