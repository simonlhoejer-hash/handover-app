import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasSouschefAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

function imageStoragePath(value: unknown) {
  if (typeof value !== 'string') return ''
  const proxyMarker = '/api/handover-images/'
  const publicMarker = '/storage/v1/object/public/handover-images/'
  const path = value.includes(proxyMarker)
    ? value.split(proxyMarker)[1]
    : value.includes(publicMarker)
      ? value.split(publicMarker)[1]
      : value.startsWith('http') ? '' : value
  return decodeURIComponent((path || '').split('?')[0])
}

export async function GET(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  if (!ship || !(await requestHasSouschefAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }
  const { data, error } = await getSupabaseAdmin()
    .from('handover_notes')
    .select('id,parti,author_name,receiver_name,shift_date,status,created_at,note')
    .eq('department', ship)
    .neq('parti', '__handover_folders__')
    .neq('parti', 'Souschef opfÃ¸lgning')
    .order('shift_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function sanitizeHandoverHtml(value: string) {
  return value
    .replace(/<(script|style|iframe|object|embed|form|meta|link|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|meta|link|svg|math)[^>]*\/?>/gi, '')
    .replace(/\s(on\w+|style|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(["'])\s*(javascript:|data:)[\s\S]*?\2/gi, '')
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  const id = cleanText(body?.id, 100)
  if (!ship || !id || !(await requestHasSouschefAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const authorName = cleanText(body?.author_name, 100)
  const receiverName = cleanText(body?.receiver_name, 100)
  const note = sanitizeHandoverHtml(cleanText(body?.note, 20000))
  if (!authorName || !receiverName || !note.replace(/<[^>]*>/g, '').trim()) {
    return NextResponse.json({ error: 'Fra, til og overlevering skal udfyldes.' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin().rpc('edit_handover_as_souschef', {
    p_handover_id: id,
    p_handover_department: ship,
    p_author_name: authorName,
    p_receiver_name: receiverName,
    p_note: note,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const edited = Array.isArray(data) ? data[0] : data
  if (!edited) return NextResponse.json({ error: 'Overleveringen findes ikke.' }, { status: 404 })
  return NextResponse.json({ data: edited })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null) as { ship?: unknown; id?: unknown } | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!ship || !id || !(await requestHasSouschefAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: note, error: lookupError } = await supabase
    .from('handover_notes')
    .select('id,images')
    .eq('id', id)
    .eq('department', ship)
    .neq('parti', '__handover_folders__')
    .neq('parti', 'Souschef opfÃ¸lgning')
    .maybeSingle()
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
  if (!note) return NextResponse.json({ error: 'Overleveringen findes ikke.' }, { status: 404 })

  const { error } = await supabase.rpc('delete_handover_as_souschef', {
    p_handover_id: id,
    p_handover_department: ship,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const paths = Array.isArray(note.images) ? note.images.map(imageStoragePath).filter(Boolean) : []
  if (paths.length) await supabase.storage.from('handover-images').remove(paths)
  return NextResponse.json({ ok: true })
}
