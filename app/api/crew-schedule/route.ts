import { NextRequest, NextResponse } from 'next/server'
import { requestHasShipAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  if (!(await requestHasShipAccess(request, 'crown'))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const department = request.nextUrl.searchParams.get('department')
  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')
  if (!department || !from || !to) {
    return NextResponse.json({ error: 'Ugyldige datoer.' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('crew_schedule')
    .select('*')
    .eq('department', department)
    .gte('date', from)
    .lte('date', to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
