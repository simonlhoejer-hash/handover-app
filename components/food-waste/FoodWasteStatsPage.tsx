'use client'

import { useEffect, useMemo, useState } from 'react'
import { FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'
import { supabase } from '@/lib/supabase'

type FoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number | string
  comment: string | null
}

type GuestCount = {
  id: string
  service_date: string
  guest_count: number
  comment: string | null
}

type LocationSummary = {
  name: string
  total: number
  averagePerDay: number
}

type ChartPoint = {
  label: string
  total: number
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthStart(dateString: string) {
  return `${dateString.slice(0, 7)}-01`
}

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getDateRangeDays(fromDate: string, toDate: string) {
  const from = parseLocalDate(fromDate)
  const to = parseLocalDate(toDate)
  const days = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1

  return Math.max(days, 1)
}

function getIsoWeek(dateString: string) {
  const date = parseLocalDate(dateString)
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7

  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatAmount(value: number, decimals = 1) {
  return `${value.toLocaleString('da-DK', {
    maximumFractionDigits: decimals,
  })} kg`
}

function formatNumber(value: number) {
  return value.toLocaleString('da-DK')
}

function formatDate(value: string) {
  return parseLocalDate(value).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

function getEntryAmount(entry: FoodWasteEntry) {
  return Number(entry.quantity_kg) || 0
}

export default function FoodWasteStatsPage() {
  const today = getToday()

  const [fromDate, setFromDate] = useState(getMonthStart(today))
  const [toDate, setToDate] = useState(today)
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([])
  const [guestDate, setGuestDate] = useState(today)
  const [guestCount, setGuestCount] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingGuests, setSavingGuests] = useState(false)
  const [error, setError] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [guestTableError, setGuestTableError] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadOverview() {
      setLoading(true)

      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .gte('waste_date', fromDate)
        .lte('waste_date', toDate)
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })

      const { data: guests, error: guestsError } = await supabase
        .from('food_waste_guest_counts')
        .select('*')
        .gte('service_date', fromDate)
        .lte('service_date', toDate)
        .order('service_date', { ascending: false })

      if (!isCurrent) return

      if (loadError) {
        setError('Kunne ikke hente food waste-overblik.')
        setEntries([])
      } else {
        setError('')
        setEntries(data ?? [])
      }

      if (guestsError) {
        setGuestTableError(true)
        setGuestCounts([])
      } else {
        setGuestTableError(false)
        setGuestCounts(guests ?? [])
      }

      setLoading(false)
    }

    void loadOverview()

    return () => {
      isCurrent = false
    }
  }, [fromDate, toDate])

  const stats = useMemo(() => {
    const byLocation = new Map<string, number>()
    const dailyTotals = new Map<string, number>()
    const weeklyTotals = new Map<number, number>()
    const daysInRange = getDateRangeDays(fromDate, toDate)
    const useWeeks = daysInRange > 45

    let totalKg = 0

    for (const entry of entries) {
      const amount = getEntryAmount(entry)

      totalKg += amount
      byLocation.set(
        entry.location_name,
        (byLocation.get(entry.location_name) ?? 0) + amount
      )

      dailyTotals.set(
        entry.waste_date,
        (dailyTotals.get(entry.waste_date) ?? 0) + amount
      )

      const week = getIsoWeek(entry.waste_date)
      weeklyTotals.set(week, (weeklyTotals.get(week) ?? 0) + amount)
    }

    const guestsTotal = guestCounts.reduce(
      (total, count) => total + count.guest_count,
      0
    )

    const locations: LocationSummary[] = FOOD_WASTE_LOCATIONS.map((location) => {
      const total = byLocation.get(location.name) ?? 0

      return {
        name: location.name,
        total,
        averagePerDay: total / daysInRange,
      }
    }).sort((a, b) => b.total - a.total)

    const chartPoints: ChartPoint[] = useWeeks
      ? Array.from(weeklyTotals.entries())
          .map(([week, total]) => ({
            label: `Uge ${week}`,
            total,
          }))
          .sort((a, b) => Number(a.label.replace('Uge ', '')) - Number(b.label.replace('Uge ', '')))
      : Array.from(dailyTotals.entries())
          .map(([date, total]) => ({
            label: formatDate(date),
            total,
          }))
          .reverse()

    return {
      totalKg,
      guestsTotal,
      kgPerGuest: guestsTotal > 0 ? totalKg / guestsTotal : 0,
      averagePerDay: totalKg / daysInRange,
      locations,
      chartPoints,
    }
  }, [entries, fromDate, guestCounts, toDate])

  async function saveGuestCount() {
    const guests = Number(guestCount)

    if (!guests || guests <= 0) {
      setGuestMessage('Skriv antal gæster.')
      return
    }

    setSavingGuests(true)
    setGuestMessage('')

    const { data, error: saveError } = await supabase
      .from('food_waste_guest_counts')
      .upsert(
        {
          service_date: guestDate,
          guest_count: guests,
          comment: null,
        },
        { onConflict: 'service_date' }
      )
      .select('*')
      .single()

    if (saveError || !data) {
      setGuestTableError(true)
      setGuestMessage('Kunne ikke gemme gæster endnu.')
    } else {
      setGuestTableError(false)
      setGuestMessage('Gæster gemt.')
      setGuestCount('')
      setGuestCounts((current) => [
        data,
        ...current.filter((count) => count.service_date !== data.service_date),
      ])
    }

    setSavingGuests(false)
  }

  const maxChartValue = Math.max(
    ...stats.chartPoints.map((point) => point.total),
    1
  )

  return (
    <main className="max-w-5xl mx-auto px-4 pt-4 pb-24 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Food waste overblik
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-white/60">
          Vælg periode, se vægt og skriv gæster.
        </p>
      </header>

      {error && (
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {guestTableError && (
        <p className="rounded-2xl bg-amber-400/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Gæstetal kræver den nye Supabase SQL, før de kan gemmes.
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-500 dark:text-white/60">
            Fra dato
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-12 w-full rounded-2xl bg-white px-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-500 dark:text-white/60">
            Til dato
          </span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-12 w-full rounded-2xl bg-white px-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          />
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">Kg i perioden</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.totalKg)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">Gæster</p>
          <div className="mt-2 text-2xl font-semibold">{formatNumber(stats.guestsTotal)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">Kg pr. gæst</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.kgPerGuest, 2)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">Gns. pr. dag</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.averagePerDay)}</div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Vægt graf</h2>
          {loading && (
            <span className="text-sm text-gray-500 dark:text-white/60">
              Henter...
            </span>
          )}
        </div>

        <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto pb-2">
          {!loading && stats.chartPoints.length === 0 && (
            <p className="self-center text-sm text-gray-500 dark:text-white/60">
              Ingen registreringer i perioden.
            </p>
          )}

          {stats.chartPoints.map((point) => (
            <div
              key={point.label}
              className="flex h-full min-w-12 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                {formatAmount(point.total)}
              </span>
              <div
                className="w-8 rounded-t-xl bg-nordic"
                style={{
                  height: `${Math.max((point.total / maxChartValue) * 130, 8)}px`,
                }}
              />
              <span className="text-xs text-gray-500 dark:text-white/60">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <h2 className="text-lg font-semibold">Skriv gæster</h2>

          <div className="mt-4 grid gap-3">
            <input
              type="date"
              value={guestDate}
              onChange={(event) => setGuestDate(event.target.value)}
              className="h-12 w-full rounded-2xl bg-gray-100 px-4 border border-black/5 dark:bg-[#0f1b2d] dark:border-white/10"
            />
            <input
              inputMode="numeric"
              value={guestCount}
              onChange={(event) => setGuestCount(event.target.value)}
              className="h-14 w-full rounded-2xl bg-gray-100 px-4 text-2xl font-semibold border border-black/5 dark:bg-[#0f1b2d] dark:border-white/10"
              placeholder="Antal gæster"
            />
            <button
              onClick={saveGuestCount}
              disabled={savingGuests}
              className="min-h-12 rounded-2xl bg-black px-5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {savingGuests ? 'Gemmer...' : 'Gem gæster'}
            </button>
          </div>

          {guestMessage && (
            <p className="mt-3 rounded-2xl bg-nordic-soft px-4 py-3 text-sm text-nordic">
              {guestMessage}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <h2 className="text-lg font-semibold">Oversigt pr. sted</h2>

          <div className="mt-4 space-y-3">
            {stats.locations.map((location) => (
              <div key={location.name} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{location.name}</p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {formatAmount(location.averagePerDay)} pr. dag
                  </p>
                </div>
                <span className="rounded-full bg-nordic-soft px-3 py-1 text-sm font-semibold text-nordic">
                  {formatAmount(location.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Seneste registreringer</h2>

        {entries.slice(0, 10).map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{entry.location_name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {formatDate(entry.waste_date)}
                </p>
              </div>
              <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white dark:bg-white dark:text-black">
                {formatAmount(getEntryAmount(entry))}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
