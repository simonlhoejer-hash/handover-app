'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, Trash2 } from 'lucide-react'
import {
  cacheFoodWasteEntries,
  readCachedFoodWasteEntries,
  readPendingFoodWasteEntries,
  removeCachedFoodWasteEntry,
  writePendingFoodWasteEntries,
} from '@/lib/foodWasteOffline'
import { useTranslation } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

type FoodWasteEntry = {
  id: string
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
  waste_date: string
  location_name: string
  quantity_kg: number
  comment: string | null
  vessel: 'crown' | 'pearl'
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(value: string, lang: string) {
  return new Date(value).toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

function formatAmount(value: number, lang: string) {
  return `${value.toLocaleString(lang === 'sv' ? 'sv-SE' : 'da-DK', {
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

    const remaining: FoodWasteEntry[] = []

    for (const pendingEntry of pendingEntries) {
      const payload: FoodWastePayload = {
        waste_date: pendingEntry.waste_date,
        location_name: pendingEntry.location_name,
        quantity_kg: Number(pendingEntry.quantity_kg) || 0,
        comment: pendingEntry.comment,
        vessel,
      }

      const { data, error: syncError } = await supabase
        .from('food_waste_entries')
        .insert(payload)
        .select('*')
        .single()

      if (syncError || !data) {
        remaining.push(pendingEntry)
      } else if (pendingEntry.location_name === locationName) {
        cacheFoodWasteEntries([data], vessel)
        setEntries((current) => [
          data,
          ...current.filter((entry) => entry.id !== pendingEntry.id),
        ])
      }
    }

    writePendingFoodWasteEntries(remaining, vessel)

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

      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .eq('location_name', locationName)
        .eq('vessel', vessel)
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      if (!isCurrent) return

      if (loadError) {
        setError(t.offlineShowingCached)
      } else {
        setError('')
        cacheFoodWasteEntries(data ?? [], vessel)
        setEntries([...pending, ...(data ?? [])])
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
  }, [locationName, syncPendingEntries, t.offlineShowingCached, vessel])

  const todayTotal = useMemo(() => {
    return entries.reduce((total, entry) => {
      if (entry.waste_date !== today) return total
      return total + getEntryAmount(entry)
    }, 0)
  }, [entries, today])

  async function saveEntry(value: string) {
    const quantity = Number(value.replace(',', '.'))

    if (!quantity || quantity <= 0) {
      setError(t.writeKg)
      saveStartedRef.current = false
      return
    }

    setSaving(true)
    setError('')

    const payload: FoodWastePayload = {
      waste_date: today,
      location_name: locationName,
      quantity_kg: quantity,
      comment: null,
      vessel,
    }

    if (!navigator.onLine) {
      saveEntryLocally(payload)
      setSaving(false)
      showSavedAndReturn()
      return
    }

    const { data, error: saveError } = await supabase
      .from('food_waste_entries')
      .insert(payload)
      .select('*')
      .single()

    if (saveError) {
      saveEntryLocally(payload)
    } else if (data) {
      cacheFoodWasteEntries([data], vessel)
      setEntries((current) => [data, ...current])
      setQuantityKg('')
    }

    setSaving(false)
    showSavedAndReturn()
  }

  function saveEntryLocally(payload: FoodWastePayload) {
    const localEntry: FoodWasteEntry = {
      id: `local-${Date.now()}`,
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
    setSyncMessage(t.savedLocally)
  }

  function showSavedAndReturn() {
    setSaved(true)
    window.setTimeout(() => {
      router.push(`${basePath}/food-waste`)
    }, 750)
  }

  useEffect(() => {
    const value = quantityKg.trim()
    const quantity = Number(value.replace(',', '.'))

    if (!value || !Number.isFinite(quantity) || quantity <= 0) {
      saveStartedRef.current = false
      return
    }

    if (saving || saved || saveStartedRef.current) return

    const timer = window.setTimeout(() => {
      saveStartedRef.current = true
      void saveEntry(value)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [quantityKg, saved, saving])

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

    const { error: deleteError } = await supabase
      .from('food_waste_entries')
      .delete()
      .eq('id', id)

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
            dark:bg-[#162338]
            dark:border-white/10
          "
          aria-label={t.back}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {locationName}
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-white/60">
            {t.foodWaste}
          </p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
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
            className="w-full rounded-2xl bg-gray-100 px-4 py-5 pr-16 text-4xl font-semibold text-gray-900 border border-black/5 dark:bg-[#0f1b2d] dark:text-white dark:border-white/10"
            placeholder="0,0"
            value={quantityKg}
            onChange={(event) => setQuantityKg(event.target.value)}
          />
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-base font-medium text-gray-500 dark:text-white/60">
            kg
          </span>
        </div>

        <p className="mt-3 text-center text-sm text-gray-500 dark:text-white/60">
          {saving ? t.saving : t.foodWasteAutoSaveHint}
        </p>

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

        {!isOnline && (
          <p className="mt-3 rounded-2xl bg-amber-400/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {t.offlineEntriesSaved}
          </p>
        )}

      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t.latestForLocation}
        </h2>

        {loading && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#162338] dark:border-white/10 dark:text-white/60">
            {t.loading}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#162338] dark:border-white/10 dark:text-white/60">
            {t.noRegistrations}
          </div>
        )}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
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


