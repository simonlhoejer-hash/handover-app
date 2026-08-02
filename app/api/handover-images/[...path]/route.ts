import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasShipAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const ship = parseAccessShip(request.nextUrl.searchParams.get('ship'))
  const { path: parts } = await context.params
  const path = parts.map(decodeURIComponent).join('/')
  const allowedPrefix = ship === 'crown' ? ['crown/', 'galley/'] : ['pearl/']

  if (
    !ship ||
    !allowedPrefix.some((prefix) => path.startsWith(prefix)) ||
    path.includes('..') ||
    !(await requestHasShipAccess(request, ship))
  ) {
    return NextResponse.json({ error: 'Ingen adgang.' }, { status: 401 })
  }

  const { data, error } = await getSupabaseAdmin()
    .storage
    .from('handover-images')
    .download(path)

  if (error || !data) {
    return NextResponse.json({ error: 'Billedet blev ikke fundet.' }, { status: 404 })
  }

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
