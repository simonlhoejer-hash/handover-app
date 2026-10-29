import 'server-only'

import { getSupabaseAdmin } from './supabaseServer'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000

type AttemptState = {
  failedAttempts: number
  lastAttemptAt: number
  lockedUntil: number
}

const memoryAttempts = new Map<string, AttemptState>()

function remainingSeconds(lockedUntil: number) {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
}

function readMemory(attemptKey: string) {
  const state = memoryAttempts.get(attemptKey)
  if (!state) return null
  if (state.lockedUntil <= Date.now() && Date.now() - state.lastAttemptAt > ATTEMPT_WINDOW_MS) {
    memoryAttempts.delete(attemptKey)
    return null
  }
  return state
}

export async function getLoginLock(attemptKey: string) {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('access_login_attempts')
      .select('locked_until')
      .eq('attempt_key', attemptKey)
      .maybeSingle()
    if (error) throw error
    const lockedUntil = data?.locked_until ? new Date(data.locked_until).getTime() : 0
    return { locked: lockedUntil > Date.now(), retryAfterSeconds: remainingSeconds(lockedUntil) }
  } catch {
    const state = readMemory(attemptKey)
    return {
      locked: Boolean(state && state.lockedUntil > Date.now()),
      retryAfterSeconds: state ? remainingSeconds(state.lockedUntil) : 0,
    }
  }
}

export async function recordFailedLogin(attemptKey: string) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('access_login_attempts')
      .select('failed_attempts,last_attempt_at,locked_until')
      .eq('attempt_key', attemptKey)
      .maybeSingle()
    if (error) throw error

    const lastAttemptAt = data?.last_attempt_at ? new Date(data.last_attempt_at).getTime() : 0
    const previousLockExpired = Boolean(
      data?.locked_until && new Date(data.locked_until).getTime() <= Date.now()
    )
    const currentAttempts = !previousLockExpired && Date.now() - lastAttemptAt <= ATTEMPT_WINDOW_MS
      ? Number(data?.failed_attempts) || 0
      : 0
    const failedAttempts = currentAttempts + 1
    const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
      : null
    const now = new Date().toISOString()
    const { error: upsertError } = await supabase.from('access_login_attempts').upsert({
      attempt_key: attemptKey,
      failed_attempts: failedAttempts,
      last_attempt_at: now,
      locked_until: lockedUntil,
    })
    if (upsertError) throw upsertError
    return { locked: Boolean(lockedUntil), attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts) }
  } catch {
    const current = readMemory(attemptKey)
    const failedAttempts = (current?.failedAttempts ?? 0) + 1
    const next: AttemptState = {
      failedAttempts,
      lastAttemptAt: Date.now(),
      lockedUntil: failedAttempts >= MAX_FAILED_ATTEMPTS
        ? Date.now() + LOCK_MINUTES * 60 * 1000
        : 0,
    }
    memoryAttempts.set(attemptKey, next)
    return { locked: next.lockedUntil > Date.now(), attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts) }
  }
}

export async function clearFailedLogins(attemptKey: string) {
  memoryAttempts.delete(attemptKey)
  try {
    await getSupabaseAdmin().from('access_login_attempts').delete().eq('attempt_key', attemptKey)
  } catch {
    // A successful login is still allowed if the shared rate-limit store is unavailable.
  }
}

export const LOGIN_LOCK_MINUTES = LOCK_MINUTES
