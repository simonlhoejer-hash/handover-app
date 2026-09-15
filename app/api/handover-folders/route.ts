import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasShipAccess, requestHasSouschefAccess } from '@/lib/apiAccess'
import { readHandoverFolders, writeHandoverFolders, type HandoverFolderGroup } from '@/lib/handoverFolderConfig'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

async function adminRequest(request: NextRequest, ship: 'crown' | 'pearl') {
  return requestHasSouschefAccess(request, ship)
}

export async function GET(request: NextRequest) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  if (!ship || (!(await requestHasShipAccess(request, ship)) && !(await adminRequest(request, ship)))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }
  try {
    return NextResponse.json({ data: await readHandoverFolders(ship) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mapperne kunne ikke hentes.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { ship?: unknown; name?: unknown; group?: unknown } | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  if (!ship || !(await adminRequest(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
  const group: HandoverFolderGroup = body?.group === 'skyllerier' ? 'skyllerier' : 'partier'
  if (!name || name.startsWith('__')) return NextResponse.json({ error: 'Skriv et gyldigt navn.' }, { status: 400 })
  try {
    const folders = await readHandoverFolders(ship)
    if (folders.some((folder) => folder.name.toLocaleLowerCase('da-DK') === name.toLocaleLowerCase('da-DK'))) {
      return NextResponse.json({ error: 'Mappen findes allerede.' }, { status: 409 })
    }
    return NextResponse.json({ data: await writeHandoverFolders(ship, [...folders, { name, group }]) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mappen kunne ikke oprettes.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null) as { ship?: unknown; name?: unknown } | null
  const ship = parseAccessShip(typeof body?.ship === 'string' ? body.ship : null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!ship || !name || !(await adminRequest(request, ship))) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }
  const { count, error } = await getSupabaseAdmin()
    .from('handover_notes')
    .select('id', { count: 'exact', head: true })
    .eq('department', ship)
    .eq('parti', name)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count) return NextResponse.json({ error: 'Slet først overleveringerne i mappen.' }, { status: 409 })
  try {
    const folders = await readHandoverFolders(ship)
    return NextResponse.json({ data: await writeHandoverFolders(ship, folders.filter((folder) => folder.name !== name)) })
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : 'Mappen kunne ikke slettes.' }, { status: 500 })
  }
}
