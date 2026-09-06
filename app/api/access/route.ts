import { NextResponse } from 'next/server'
import {
  ACCESS_COOKIE_NAMES,
  AccessShip,
  createAccessToken,
  createSouschefAccessToken,
  isCorrectAccessCode,
  isCorrectSouschefCode,
  LEGACY_ACCESS_COOKIE_NAMES,
  SOUSCHEF_ACCESS_COOKIE_NAME,
} from '@/lib/shipAccess'

function isAccessShip(value: unknown): value is AccessShip {
  return value === 'crown' || value === 'pearl'
}

export async function POST(request: Request) {
  const isFormRequest = request.headers.get('content-type')?.includes('form') ?? false
  const body = (isFormRequest
    ? await request.formData().then((form) => ({
        ship: form.get('ship'),
        code: form.get('code'),
        destination: form.get('destination'),
      })).catch(() => null)
    : await request.json().catch(() => null)) as {
    ship?: unknown
    code?: unknown
    destination?: unknown
  } | null

  const formError = (reason: 'wrong' | 'config', status: number, message: string) => {
    if (!isFormRequest) return NextResponse.json({ error: message }, { status })
    const ship = body?.ship === 'pearl' ? 'pearl' : 'crown'
    const url = new URL(`/${ship}/adgang`, request.url)
    url.searchParams.set('error', reason)
    return NextResponse.redirect(url, 303)
  }

  let valid = false
  let souschef = false
  if (body?.ship === 'crown' && typeof body.code === 'string') {
    try {
      souschef = await isCorrectSouschefCode(body.code)
    } catch {
      souschef = false
    }
  }

  try {
    valid = Boolean(
      body &&
      isAccessShip(body.ship) &&
      typeof body.code === 'string' &&
      (await isCorrectAccessCode(body.ship, body.code))
    )
  } catch {
    return formError('config', 503, 'Serverens adgang er ikke konfigureret endnu.')
  }

  if ((!valid && !souschef) || !body || !isAccessShip(body.ship)) {
    return formError('wrong', 401, 'Forkert kode. Prøv igen.')
  }

  const destination = souschef ? '/crown/souschef' : `/${body.ship}`
  const response = isFormRequest
    ? NextResponse.redirect(new URL(`${destination}?login=1`, request.url), 303)
    : NextResponse.json({ ok: true, destination })

  if (souschef) {
    response.cookies.set({
      name: SOUSCHEF_ACCESS_COOKIE_NAME,
      value: await createSouschefAccessToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 180,
    })
    return response
  }
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
    SOUSCHEF_ACCESS_COOKIE_NAME,
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
