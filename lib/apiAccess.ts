import 'server-only'

import type { NextRequest } from 'next/server'
import {
  ACCESS_COOKIE_NAMES,
  SOUSCHEF_ACCESS_COOKIE_NAMES,
  type AccessShip,
  verifyAccessToken,
  verifySouschefAccessToken,
} from '@/lib/shipAccess'

export function parseAccessShip(value: string | null | undefined): AccessShip | null {
  return value === 'crown' || value === 'pearl' ? value : null
}

export async function requestHasShipAccess(
  request: NextRequest,
  ship: AccessShip
) {
  const token = request.cookies.get(ACCESS_COOKIE_NAMES[ship])?.value
  return verifyAccessToken(ship, token)
}

export async function requestHasSouschefAccess(
  request: NextRequest,
  ship: AccessShip
) {
  const token = request.cookies.get(SOUSCHEF_ACCESS_COOKIE_NAMES[ship])?.value
  try {
    return await verifySouschefAccessToken(token, ship)
  } catch {
    return false
  }
}

export function departmentForShip(ship: AccessShip) {
  return ship
}

export function shipForDepartment(value: unknown): AccessShip | null {
  return value === 'crown' || value === 'pearl' ? value : null
}
