import { NextResponse } from 'next/server'
import {
  ACCESS_COOKIE_NAMES,
  AccessShip,
  createAccessToken,
  isCorrectAccessCode,
  LEGACY_ACCESS_COOKIE_NAMES,
} from '@/lib/shipAccess'

function isAccessShip(value: unknown): value is AccessShip {
  return value === 'crown' || value === 'pearl'
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    ship?: unknown
    code?: unknown
  } | null

  let valid = false
  try {
    valid = Boolean(
      body &&
      isAccessShip(body.ship) &&
      typeof body.code === 'string' &&
      (await isCorrectAccessCode(body.ship, body.code))
    )
  } catch {
    return NextResponse.json(
      { error: 'Serverens adgang er ikke konfigureret endnu.' },
      { status: 503 }
    )
  }

  if (!valid || !body || !isAccessShip(body.ship)) {
    return NextResponse.json(
      { error: 'Forkert kode. Prøv igen.' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: ACCESS_COOKIE_NAMES[body.ship],
    value: await createAccessToken(body.ship),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })

  if (body.ship === 'pearl') {
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

export async function DELETE() {
  const response = NextResponse.json({ ok: true })

  for (const cookieName of [
    ...Object.values(ACCESS_COOKIE_NAMES),
    ...LEGACY_ACCESS_COOKIE_NAMES,
  ]) {
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

  return response
}
