'use client'

import type { AccessShip } from '@/lib/shipAccess'

const ACCESS_DAYS = 180
const STORAGE_PREFIX = 'handover-offline-access-v1:'

type StoredAccess = {
  verifier: string
  expiresAt: number
}

async function deriveVerifier(ship: AccessShip, code: string) {
  const encoder = new TextEncoder()
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(code.trim().toUpperCase()),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(`handover-offline:${ship}:v1`),
      iterations: 150_000,
    },
    material,
    256
  )
  return Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function storageKey(ship: AccessShip) {
  return `${STORAGE_PREFIX}${ship}`
}

export async function rememberOfflineAccess(ship: AccessShip, code: string) {
  const value: StoredAccess = {
    verifier: await deriveVerifier(ship, code),
    expiresAt: Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000,
  }
  window.localStorage.setItem(storageKey(ship), JSON.stringify(value))
}

export async function verifyOfflineAccess(ship: AccessShip, code: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey(ship)) || 'null') as StoredAccess | null
    if (!stored || stored.expiresAt <= Date.now()) {
      window.localStorage.removeItem(storageKey(ship))
      return false
    }
    return stored.verifier === await deriveVerifier(ship, code)
  } catch {
    return false
  }
}

export function clearAllOfflineAccess() {
  try {
    window.localStorage.removeItem(storageKey('crown'))
    window.localStorage.removeItem(storageKey('pearl'))
  } catch {
    // Storage may be unavailable, while the server-side logout still works.
  }
}
