import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasShipAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

async function handoverBelongsToShip(handoverId: string, ship: 'crown' | 'pearl') {
  const { data } = await getSupabaseAdmin()
    .from('handover_notes')
    .select('id')
    .eq('id', handoverId)
    .eq('department', ship)
    .maybeSingle()
  return Boolean(data)
}

export async function GET(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  const handoverId = request.nextUrl.searchParams.get('handoverId')?.slice(0, 100) || ''
  if (
    !ship ||
    !handoverId ||
    !(await requestHasShipAccess(request, ship)) ||
    !(await handoverBelongsToShip(handoverId, ship))
  ) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('handover_comments')
    .select('*')
    .eq('handover_id', handoverId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  const handoverId = typeof body?.handoverId === 'string' ? body.handoverId.slice(0, 100) : ''
  const authorName = typeof body?.authorName === 'string' ? body.authorName.trim().slice(0, 100) : ''
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 5000) : ''

  if (
    !ship ||
    !handoverId ||
    !authorName ||
    !comment ||
    !(await requestHasShipAccess(request, ship)) ||
    !(await handoverBelongsToShip(handoverId, ship))
  ) {
    return NextResponse.json({ error: 'Ugyldig forespørgsel.' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('handover_comments')
    .insert({ handover_id: handoverId, author_name: authorName, comment })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
