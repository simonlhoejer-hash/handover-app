import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  ACCESS_COOKIE_NAMES,
  AccessShip,
  verifyAccessToken,
} from '@/lib/shipAccess'

export async function proxy(request: NextRequest) {
  const ship: AccessShip = request.nextUrl.pathname.startsWith('/pearl')
    ? 'pearl'
    : 'crown'

  if (request.nextUrl.pathname === `/${ship}/adgang`) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(ACCESS_COOKIE_NAMES[ship])?.value

  if (await verifyAccessToken(ship, cookie)) {
    return NextResponse.next()
  }

  const accessUrl = new URL(`/${ship}/adgang`, request.url)
  return NextResponse.redirect(accessUrl)
}

export const config = {
  matcher: ['/crown/:path*', '/pearl/:path*'],
}
