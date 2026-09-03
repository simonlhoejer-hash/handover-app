'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronLeft, Trash2 } from 'lucide-react'
import {
  cacheFoodWasteEntries,
  readCachedFoodWasteEntries,
  readPendingFoodWasteEntries,
  removeCachedFoodWasteEntry,
  writePendingFoodWasteEntries,
} from '@/lib/foodWasteOffline'
import { localeFor, useTranslation } from '@/lib/LanguageContext'
import { displayFoodWasteLocation } from '@/lib/foodWasteLocations'
import { queryString, secureFetch } from '@/lib/secureApi'
import { syncAllPendingFoodWaste } from '@/lib/foodWasteSync'

type FoodWasteEntry = {
  id: string
  client_id?: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number | string
  comment: string | null
  pending?: boolean
}

type Props = {
  locationName: string
  vessel?: 'crown' | 'pearl'
  basePath?: string
}

type FoodWastePayload = {
  client_id: string
  waste_date: string
  location_name: string
  quantity_kg: number
  comment: string | null
  vessel: 'crown' | 'pearl'
}

const SAVE_TIMEOUT_MS = 6000

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value: string, lang: string) {
  return new Date(value).toLocaleDateString(localeFor(lang), {
    day: 'numeric',
    month: 'short',
  })
}

function formatAmount(value: number, lang: string) {
  return `${value.toLocaleString(localeFor(lang), {
    maximumFractionDigits: 2,
  })} kg`
}

function getEntryAmount(entry: FoodWasteEntry) {
  return Number(entry.quantity_kg) || 0
}

export default function FoodWasteLocationPage({
  locationName,
  vessel = 'crown',
  basePath = '/crown',
}: Props) {
  const { t, lang } = useTranslation()
  const router = useRouter()
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [quantityKg, setQuantityKg] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [wasteReason, setWasteReason] = useState('')
  const [showReasonPrompt, setShowReasonPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  const kgInputRef = useRef<HTMLInputElement>(null)
  const saveStartedRef = useRef(false)

  const today = getToday()

  const syncPendingEntries = useCallback(async () => {
    const pendingEntries = readPendingFoodWasteEntries(vessel)
    if (pendingEntries.length === 0) {
      setSyncMessage('')
      return
    }

    await syncAllPendingFoodWaste()
    const remaining = readPendingFoodWasteEntries(vessel)
    const cachedForLocation = readCachedFoodWasteEntries(vessel).filter(
      (entry) => entry.location_name === locationName
    )
    setEntries((current) => {
      const byId = new Map<string, FoodWasteEntry>()
      for (const entry of [
        ...remaining.filter((entry) => entry.location_name === locationName),
        ...cachedForLocation,
        ...current.filter((entry) => !entry.pending && !entry.id.startsWith('local-')),
      ]) {
        byId.set(entry.id, entry)
      }
      return [...byId.values()]
    })

    setSyncMessage(
      remaining.length === 0
        ? ''
        : `${remaining.length} ${
            remaining.length === 1 ? t.registrationWaiting : t.registrationsWaiting
          }`
    )
  }, [locationName, t.registrationWaiting, t.registrationsWaiting, vessel])

  useEffect(() => {
    function updateOnlineStatus() {
      const online = navigator.onLine
      setIsOnline(online)

      if (online) {
        void syncPendingEntries()
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [syncPendingEntries])

  useEffect(() => {
    let isCurrent = true

    async function loadEntries() {
      const pending = readPendingFoodWasteEntries(vessel).filter(
        (entry) => entry.location_name === locationName
      )
      const cached = readCachedFoodWasteEntries(vessel).filter(
        (entry) => entry.location_name === locationName
      )

      if (pending.length > 0 || cached.length > 0) {
        setEntries([...pending, ...cached])
        setLoading(false)
      }

      let data: FoodWasteEntry[] = []
      let loadError: unknown = null
      try {
        const result = await secureFetch<{ data: FoodWasteEntry[] }>(
          `/api/food-waste/entries?${queryString({
            ship: vessel,
            location: locationName,
            from: getDateDaysAgo(28),
            limit: 200,
          })}`
        )
        data = result.data
      } catch (error) {
        loadError = error
      }

      if (!isCurrent) return

      if (loadError) {
        setError('')
      } else {
        setError('')
        cacheFoodWasteEntries(data, vessel)
        setEntries([...pending, ...data])
      }

      setLoading(false)
      window.setTimeout(() => kgInputRef.current?.focus(), 120)

      if (navigator.onLine) {
        void syncPendingEntries()
      }
    }

    void loadEntries()

    return () => {
      isCurrent = false
    }
  }, [locationName, syncPendingEntries, vessel])

  const todayTotal = useMemo(() => {
    return entries.reduce((total, entry) => {
      if (entry.waste_date !== today) return total
      return total + getEntryAmount(entry)
    }, 0)
  }, [entries, today])

  const historicalDailyAverage = useMemo(() => {
    if (!locationName.startsWith('Messen ')) return 0

    const dailyTotals = new Map<string, number>()
    for (const entry of entries) {
      if (entry.waste_date === today || entry.pending) continue
      dailyTotals.set(
        entry.waste_date,
        (dailyTotals.get(entry.waste_date) ?? 0) + getEntryAmount(entry)
      )
    }

    const totals = Array.from(dailyTotals.values())
    if (totals.length < 3) return 0
    return totals.reduce((sum, total) => sum + total, 0) / totals.length
  }, [entries, locationName, today])

  const enteredQuantity = Number(quantityKg.trim().replace(',', '.')) || 0
  const projectedTodayTotal = todayTotal + enteredQuantity
  const requiresWasteReason =
    historicalDailyAverage > 0 &&
    projectedTodayTotal > historicalDailyAverage * 1.25

  async function saveEntry(value: string, comment: string | null = null) {
    const quantity = Number(value.replace(',', '.'))

    if (!quantity || quantity <= 0) {
      setError(t.writeKg)
      saveStartedRef.current = false
      return
    }

    setSaving(true)
    setError('')

    const payload: FoodWastePayload = {
      client_id: crypto.randomUUID(),
      waste_date: today,
      location_name: locationName,
      quantity_kg: quantity,
      comment,
      vessel,
    }

    if (!navigator.onLine) {
      saveEntryLocally(payload)
      setSaving(false)
      showSavedAndReturn()
      return
    }

    let data: FoodWasteEntry | null = null
    let saveError: unknown = null
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS)

    try {
      const result = await secureFetch<{ data: FoodWasteEntry }>(
        '/api/food-waste/entries',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      )
      data = result.data
    } catch (error) {
      saveError = error
    } finally {
      window.clearTimeout(timeout)
    }

    if (saveError) {
      try {
        saveEntryLocally(payload)
      } catch {
        setError(t.couldNotSaveRegistration)
        saveStartedRef.current = false
        setSaving(false)
        return
      }
    } else if (data) {
      cacheFoodWasteEntries([data], vessel)
      setEntries((current) => [data, ...current])
      setQuantityKg('')
      setWasteReason('')
      setShowReasonPrompt(false)
    }

    setSaving(false)
    showSavedAndReturn()
  }

  function saveEntryLocally(payload: FoodWastePayload) {
    const localEntry: FoodWasteEntry = {
      id: `local-${payload.client_id}`,
      client_id: payload.client_id,
      created_at: new Date().toISOString(),
      waste_date: payload.waste_date,
      location_name: payload.location_name,
      quantity_kg: payload.quantity_kg,
      comment: payload.comment,
      pending: true,
    }

    const pendingEntries = readPendingFoodWasteEntries(vessel)
    writePendingFoodWasteEntries([localEntry, ...pendingEntries], vessel)

    setEntries((current) => [localEntry, ...current])
    setQuantityKg('')
    setWasteReason('')
    setShowReasonPrompt(false)
    setSyncMessage(t.savedLocally)
  }

  function showSavedAndReturn() {
    setSaved(true)
    window.setTimeout(() => {
      const foodWastePath = `${basePath}/food-waste`
      if (navigator.onLine) {
        router.push(foodWastePath)
      } else {
        window.location.assign(foodWastePath)
      }
    }, 750)
  }

  useEffect(() => {
    const value = quantityKg.trim()
    const quantity = Number(value.replace(',', '.'))

    if (!value || !Number.isFinite(quantity) || quantity <= 0) {
      saveStartedRef.current = false
      setShowReasonPrompt(false)
      return
    }

    if (saving || saved || saveStartedRef.current) return

    if (requiresWasteReason) {
      setShowReasonPrompt(true)
      saveStartedRef.current = false
      return
    }

    setShowReasonPrompt(false)

    const timer = window.setTimeout(() => {
      saveStartedRef.current = true
      void saveEntry(value)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [quantityKg, requiresWasteReason, saved, saving])

  async function deleteEntry(id: string) {
    if (id.startsWith('local-')) {
      writePendingFoodWasteEntries(
        readPendingFoodWasteEntries(vessel).filter((entry) => entry.id !== id),
        vessel
      )
      removeCachedFoodWasteEntry(id, vessel)
      setEntries((current) => current.filter((entry) => entry.id !== id))
      return
    }

    let deleteError: unknown = null
    try {
      await secureFetch(
        `/api/food-waste/entries?${queryString({ ship: vessel, id })}`,
        { method: 'DELETE' }
      )
    } catch (error) {
      deleteError = error
    }

    if (deleteError) {
      setError(t.couldNotDeleteRegistration)
      return
    }

    removeCachedFoodWasteEntry(id, vessel)
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }

  return (
    <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6">
      <header className="relative flex items-center justify-center">
        <Link
          href={`${basePath}/food-waste`}
          className="
            absolute left-0
            flex items-center justify-center
            w-10 h-10
            rounded-full
            bg-white
            border border-black/5
            shadow-sm
            dark:bg-[#0d3b3a]
            dark:border-white/10
          "
          aria-label={t.back}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {displayFoodWasteLocation(locationName, lang)}
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-white/60">
            {t.foodWaste}
          </p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-white/60">
              {t.today}
            </p>
            <div className="mt-1 text-2xl font-semibold">
              {formatAmount(todayTotal, lang)}
            </div>
          </div>
          <span className="rounded-full bg-nordic-soft px-3 py-1 text-sm font-medium text-nordic">
            {formatDate(today, lang)}
          </span>
        </div>

        <div className="mt-5 relative">
          <input
            ref={kgInputRef}
            inputMode="decimal"
            className="w-full rounded-2xl bg-gray-100 px-4 py-5 pr-16 text-4xl font-semibold text-gray-900 border border-black/5 dark:bg-[#082f2e] dark:text-white dark:border-white/10"
            placeholder="0,0"
            value={quantityKg}
            onChange={(event) => setQuantityKg(event.target.value)}
          />
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-base font-medium text-gray-500 dark:text-white/60">
            kg
          </span>
        </div>

        <p className="mt-3 text-center text-sm text-gray-500 dark:text-white/60">
          {saving ? t.saving : showReasonPrompt ? '' : t.foodWasteAutoSaveHint}
        </p>

        {showReasonPrompt && (
          <div className="mt-3 rounded-2xl border-2 border-red-500/50 bg-red-50 p-4 dark:bg-red-500/10">
            <div className="flex items-start gap-3 text-red-700 dark:text-red-200">
              <AlertTriangle className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-semibold">
                  {lang === 'en'
                    ? 'More waste than usual'
                    : lang === 'sv'
                      ? 'Mer svinn än vanligt'
                      : 'Mere spild end normalt'}
                </p>
                <p className="mt-1 text-sm opacity-80">
                  {lang === 'en'
                    ? `Today will be ${formatAmount(projectedTodayTotal, lang)}. Briefly explain why.`
                    : lang === 'sv'
                      ? `Dagens mängd blir ${formatAmount(projectedTodayTotal, lang)}. Skriv kort varför.`
                      : `Dagens mængde bliver ${formatAmount(projectedTodayTotal, lang)}. Skriv kort hvorfor.`}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(
                lang === 'en'
                  ? ['Dish was not popular', 'Too much produced', 'Fewer guests', 'Quality issue']
                  : lang === 'sv'
                    ? ['Rätten var inte populär', 'För mycket producerat', 'Färre gäster', 'Kvalitetsproblem']
                    : ['Retten var ikke populær', 'For meget produceret', 'Færre gæster', 'Kvalitetsproblem']
              ).map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setWasteReason(reason)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    wasteReason === reason
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-red-500/25 bg-white/70 text-red-700 dark:bg-white/5 dark:text-red-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={wasteReason}
              onChange={(event) => setWasteReason(event.target.value)}
              maxLength={500}
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border border-red-500/30 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-500/30 dark:bg-[#082f2e] dark:text-white"
              placeholder={lang === 'en' ? 'Reason…' : lang === 'sv' ? 'Orsak…' : 'Årsag…'}
              autoFocus
            />

            <button
              type="button"
              disabled={!wasteReason.trim() || saving}
              onClick={() => {
                saveStartedRef.current = true
                void saveEntry(quantityKg, wasteReason.trim())
              }}
              className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? t.saving
                : lang === 'en'
                  ? 'Save registration'
                  : lang === 'sv'
                    ? 'Spara registrering'
                    : 'Gem registrering'}
            </button>
          </div>
        )}

        {saved && (
          <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={18} />
            {t.foodWasteSavedReturning}
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        {syncMessage && (
          <p className="mt-3 rounded-2xl bg-amber-400/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {syncMessage}
          </p>
        )}

      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t.latestForLocation}
        </h2>

        {loading && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#0d3b3a] dark:border-white/10 dark:text-white/60">
            {t.loading}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#0d3b3a] dark:border-white/10 dark:text-white/60">
            {t.noRegistrations}
          </div>
        )}

        {entries.slice(0, 20).map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">
                  {formatDate(entry.waste_date, lang)}
                </h3>
                {entry.comment && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                    {entry.comment}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  {formatAmount(getEntryAmount(entry), lang)}
                </span>
                {entry.pending && (
                  <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {t.waiting}
                  </span>
                )}
                <button
                  onClick={() => void deleteEntry(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                  aria-label={t.deleteRegistration}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}


