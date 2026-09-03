import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasShipAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'

export async function GET(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  if (!ship || !(await requestHasShipAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')
  const location = request.nextUrl.searchParams.get('location')
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 500, 2000)

  let query = getSupabaseAdmin()
    .from('food_waste_entries')
    .select('*')
    .eq('vessel', ship)

  if (from) query = query.gte('waste_date', from)
  if (to) query = query.lte('waste_date', to)
  if (location) query = query.eq('location_name', location)
  if (ship === 'pearl') query = query.not('location_name', 'like', 'Produktion %')

  const { data, error } = await query
    .order('waste_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const ship = parseAccessShip(
    typeof body?.ship === 'string'
      ? body.ship
      : typeof body?.vessel === 'string'
        ? body.vessel
        : null
  )
  if (!body || !ship || !(await requestHasShipAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const wasteDate = typeof body.waste_date === 'string' ? body.waste_date.slice(0, 10) : ''
  const locationName = typeof body.location_name === 'string' ? body.location_name.trim().slice(0, 200) : ''
  const quantityKg = Number(body.quantity_kg)
  const comment = typeof body.comment === 'string' ? body.comment.slice(0, 1000) : null
  const clientId = typeof body.client_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.client_id)
    ? body.client_id
    : null
  const locationIsAllowed = FOOD_WASTE_LOCATIONS.some(
    (location) =>
      location.name === locationName &&
      (ship === 'crown' || !location.name.startsWith('Produktion '))
  )

  if (!wasteDate || !locationIsAllowed || !Number.isFinite(quantityKg) || quantityKg <= 0 || quantityKg > 10000) {
    return NextResponse.json({ error: 'Ugyldig registrering.' }, { status: 400 })
  }

  const values = {
    ...(clientId ? { id: clientId } : {}),
    waste_date: wasteDate,
    location_name: locationName,
    quantity_kg: quantityKg,
    comment,
    vessel: ship,
  }

  let { data, error } = await getSupabaseAdmin()
    .from('food_waste_entries')
    .insert(values)
    .select('*')
    .single()

  // A retry after a timeout may arrive after the first request was already
  // committed. The client UUID makes that retry return the original row
  // instead of creating a duplicate measurement.
  if (error?.code === '23505' && clientId) {
    const existing = await getSupabaseAdmin()
      .from('food_waste_entries')
      .select('*')
      .eq('id', clientId)
      .eq('vessel', ship)
      .single()
    data = existing.data
    error = existing.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  const id = request.nextUrl.searchParams.get('id')?.slice(0, 100) || ''
  if (!ship || !id || !(await requestHasShipAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const { error } = await getSupabaseAdmin()
    .from('food_waste_entries')
    .delete()
    .eq('id', id)
    .eq('vessel', ship)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
