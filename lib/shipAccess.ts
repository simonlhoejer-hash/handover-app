export type AccessShip = 'crown' | 'pearl'

export const ACCESS_COOKIE_NAMES: Record<AccessShip, string> = {
  crown: 'handover_crown_access',
  pearl: 'handover_pearl_access',
}

function getCode(ship: AccessShip) {
  const environmentCode =
    ship === 'crown'
      ? process.env.CROWN_ACCESS_CODE
      : process.env.PEARL_ACCESS_CODE

  if (!environmentCode) {
    throw new Error(`Adgangskoden til ${ship} mangler i miljøvariablerne.`)
  }

  return environmentCode.trim().toUpperCase()
}

function getSigningSecret() {
  if (!process.env.ACCESS_SESSION_SECRET) {
    throw new Error('ACCESS_SESSION_SECRET mangler i miljøvariablerne.')
  }

  return process.env.ACCESS_SESSION_SECRET
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
  const candidate = new TextEncoder().encode(code.trim().toUpperCase())
  const expected = new TextEncoder().encode(getCode(ship))
  if (candidate.length !== expected.length) return false

  let difference = 0
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate[index] ^ expected[index]
  }
  return difference === 0
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
