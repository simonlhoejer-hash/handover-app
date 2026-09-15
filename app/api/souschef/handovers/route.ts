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
    .select('id,parti,author_name,receiver_name,shift_date,status,created_at')
    .eq('department', ship)
    .neq('parti', '__handover_folders__')
    .neq('parti', 'Souschef opfÃ¸lgning')
    .order('shift_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
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
