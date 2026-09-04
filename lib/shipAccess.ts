export type AccessShip = 'crown' | 'pearl'

export const ACCESS_COOKIE_NAMES: Record<AccessShip, string> = {
  crown: 'handover_crown_access',
  pearl: 'handover_pearl_access_v2',
}

export const LEGACY_ACCESS_COOKIE_NAMES = ['handover_pearl_access'] as const
export const SOUSCHEF_ACCESS_COOKIE_NAME = 'handover_crown_souschef_access'
const DEFAULT_SOUSCHEF_CODE_HASH =
  '4cf6f9637d171efb2bf6e67f01ed16da3588cdae3f6014c25ca760d071d5172d'

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

async function hashValue(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function getSouschefCodeHash() {
  const environmentCode = process.env.SOUSCHEF_ACCESS_CODE?.trim().toUpperCase()
  return environmentCode
    ? hashValue(environmentCode)
    : DEFAULT_SOUSCHEF_CODE_HASH
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

export async function isCorrectSouschefCode(code: string) {
  const candidate = new TextEncoder().encode(
    await hashValue(code.trim().toUpperCase())
  )
  const expected = new TextEncoder().encode(await getSouschefCodeHash())
  if (candidate.length !== expected.length) return false

  let difference = 0
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate[index] ^ expected[index]
  }
  return difference === 0
}

export async function createSouschefAccessToken() {
  return signValue(`handover-access:crown:souschef:${await getSouschefCodeHash()}`)
}

export async function verifySouschefAccessToken(token: string | undefined) {
  if (!token) return false
  return token === (await createSouschefAccessToken())
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
