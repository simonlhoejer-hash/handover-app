import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasShipAccess, requestHasSouschefAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { defaultFoodWasteStations, type FoodWasteStation } from '@/lib/foodWasteStationConfig'

const areas = new Set(['morning-buffet', 'evening-buffet', 'mess', 'production'])

export async function GET(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  if (!ship || !(await requestHasShipAccess(request, ship))) return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  const { data, error } = await getSupabaseAdmin().from('food_waste_station_config').select('stations').eq('vessel', ship).maybeSingle()
  if (error && error.code !== '42P01') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: Array.isArray(data?.stations) && data.stations.length ? data.stations : defaultFoodWasteStations(ship) })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { ship?: unknown; stations?: unknown } | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  if (!ship || !(await requestHasSouschefAccess(request, ship))) return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  if (!Array.isArray(body?.stations) || body.stations.length > 60) return NextResponse.json({ error: 'Ugyldige stationer.' }, { status: 400 })
  const seen = new Set<string>()
  const stations: FoodWasteStation[] = []
  for (const [index, raw] of body.stations.entries()) {
    const item = raw as Partial<FoodWasteStation>
    const slug = typeof item.slug === 'string' ? item.slug.trim().slice(0, 80) : ''
    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 120) : ''
    if (!slug || !/^[a-z0-9-]+$/.test(slug) || !name || !areas.has(String(item.area)) || seen.has(slug)) return NextResponse.json({ error: 'En station har ugyldige oplysninger.' }, { status: 400 })
    if (ship === 'pearl' && item.area === 'production') return NextResponse.json({ error: 'Produktion er ikke aktiv på Pearl.' }, { status: 400 })
    seen.add(slug)
    stations.push({ slug, name, area: item.area!, active: item.active !== false, order: index })
  }
  const { error } = await getSupabaseAdmin().from('food_waste_station_config').upsert({ vessel: ship, stations, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: stations })
}
