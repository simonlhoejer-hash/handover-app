import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasSouschefAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

type RecoveryRow = {
  id?: unknown
  created_at?: unknown
  waste_date?: unknown
  location_name?: unknown
  quantity_kg?: unknown
  comment?: unknown
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { ship?: unknown; entries?: unknown } | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  if (!ship || !(await requestHasSouschefAccess(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }
  if (!Array.isArray(body?.entries) || body.entries.length > 500) {
    return NextResponse.json({ error: 'Ugyldig gendannelsesfil.' }, { status: 400 })
  }

  const entries = (body.entries as RecoveryRow[]).flatMap((entry) => {
    const id = typeof entry.id === 'string' ? entry.id : ''
    const createdAt = typeof entry.created_at === 'string' ? entry.created_at : ''
    const wasteDate = typeof entry.waste_date === 'string' ? entry.waste_date.slice(0, 10) : ''
    const locationName = typeof entry.location_name === 'string' ? entry.location_name.trim() : ''
    const quantityKg = Number(entry.quantity_kg)
    const createdTime = Date.parse(createdAt)

    if (!UUID.test(id) || !Number.isFinite(createdTime) || !/^\d{4}-\d{2}-\d{2}$/.test(wasteDate) ||
        !locationName.startsWith('Messen ') || !Number.isFinite(quantityKg) || quantityKg <= 0) return []

    return [{
      id,
      created_at: new Date(createdTime).toISOString(),
      waste_date: wasteDate,
      location_name: locationName.slice(0, 200),
      quantity_kg: quantityKg,
      comment: typeof entry.comment === 'string' ? entry.comment.slice(0, 1000) : null,
      vessel: ship,
    }]
  })

  if (entries.length === 0) return NextResponse.json({ data: { restored: 0 } })

  const { error } = await getSupabaseAdmin()
    .from('food_waste_entries')
    .upsert(entries, { onConflict: 'id', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { restored: entries.length } })
}
