import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasShipAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  if (!ship || !(await requestHasShipAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')
  let query = getSupabaseAdmin()
    .from('food_waste_guest_counts')
    .select('*')
    .eq('vessel', ship)
  if (from) query = query.gte('service_date', from)
  if (to) query = query.lte('service_date', to)

  const { data, error } = await query.order('service_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const ship = parseAccessShip(
    typeof body?.ship === 'string'
      ? body.ship
      : typeof body?.vessel === 'string'
        ? body.vessel
        : null
  )
  const serviceDate = typeof body?.service_date === 'string' ? body.service_date.slice(0, 10) : ''
  const guestCount = Number(body?.guest_count)

  if (
    !ship ||
    !serviceDate ||
    !Number.isInteger(guestCount) ||
    guestCount <= 0 ||
    guestCount > 10000 ||
    !(await requestHasShipAccess(request, ship))
  ) {
    return NextResponse.json({ error: 'Ugyldigt gæstetal.' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('food_waste_guest_counts')
    .upsert(
      { service_date: serviceDate, guest_count: guestCount, comment: null, vessel: ship },
      { onConflict: 'vessel,service_date' }
    )
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
