import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  ACCESS_COOKIE_NAMES,
  AccessShip,
  LEGACY_ACCESS_COOKIE_NAMES,
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
  const response = NextResponse.redirect(accessUrl)

  if (ship === 'pearl') {
    for (const cookieName of LEGACY_ACCESS_COOKIE_NAMES) {
      response.cookies.set({
        name: cookieName,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })
    }
  }

  return response
}

export const config = {
  matcher: ['/crown/:path*', '/pearl/:path*'],
}
