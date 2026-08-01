export type AccessShip = 'crown' | 'pearl'

export const ACCESS_COOKIE_NAMES: Record<AccessShip, string> = {
  crown: 'handover_crown_access',
  pearl: 'handover_pearl_access',
}

const DEFAULT_CODES: Record<AccessShip, string> = {
  crown: 'CROWN26',
  pearl: 'PEARL26',
}

function getCode(ship: AccessShip) {
  const environmentCode =
    ship === 'crown'
      ? process.env.CROWN_ACCESS_CODE
      : process.env.PEARL_ACCESS_CODE

  return (environmentCode || DEFAULT_CODES[ship]).trim().toUpperCase()
}

function getSigningSecret() {
  return (
    process.env.ACCESS_SESSION_SECRET ||
    'handoverpro-2026-shared-ship-access-session'
  )
}

async function signValue(value: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSigningSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  )

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function isCorrectAccessCode(ship: AccessShip, code: string) {
  return code.trim().toUpperCase() === getCode(ship)
}

export async function createAccessToken(ship: AccessShip) {
  return signValue(`handover-access:${ship}:${getCode(ship)}`)
}

export async function verifyAccessToken(
  ship: AccessShip,
  token: string | undefined
) {
  if (!token) return false
  return token === (await createAccessToken(ship))
}
