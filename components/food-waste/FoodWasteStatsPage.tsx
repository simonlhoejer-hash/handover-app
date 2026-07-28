'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'
import { supabase } from '@/lib/supabase'

type FoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number
  comment: string | null
}

type LocationSummary = {
  name: string
  total: number
  averagePerWeek: number
  averagePerDay: number
}

type WeekSummary = {
  week: number
  total: number
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getIsoWeek(dateString: string) {
  const date = new Date(dateString)
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7

  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getWeekStart(dateString: string) {
  const date = new Date(dateString)
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dateNumber = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${dateNumber}`
}

function formatAmount(value: number) {
  return `${value.toLocaleString('da-DK', {
    maximumFractionDigits: 1,
  })} kg`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

export default function FoodWasteStatsPage() {
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = getToday()
  const currentYear = today.slice(0, 4)
  const currentMonth = today.slice(0, 7)
  const currentWeekStart = getWeekStart(today)

  useEffect(() => {
    let isCurrent = true

    async function loadEntries() {
      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .gte('waste_date', `${currentYear}-01-01`)
        .lte('waste_date', `${currentYear}-12-31`)
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (!isCurrent) return

      if (loadError) {
        setError('Kunne ikke hente food waste-overblik.')
        setEntries([])
      } else {
        setError('')
        setEntries(data ?? [])
      }

      setLoading(false)
    }

    void loadEntries()

    return () => {
      isCurrent = false
    }
  }, [currentYear])

  const stats = useMemo(() => {
    const byLocation = new Map<string, number>()
    const byWeek = new Map<number, number>()

    let yearTotal = 0
    let monthTotal = 0
    let weekTotal = 0

    for (const entry of entries) {
      const amount = entry.quantity_kg

      yearTotal += amount
      byLocation.set(
        entry.location_name,
        (byLocation.get(entry.location_name) ?? 0) + amount
      )

      const week = getIsoWeek(entry.waste_date)
      byWeek.set(week, (byWeek.get(week) ?? 0) + amount)

      if (entry.waste_date.startsWith(currentMonth)) {
        monthTotal += amount
      }

      if (entry.waste_date >= currentWeekStart && entry.waste_date <= today) {
        weekTotal += amount
      }
    }

    const weeksWithData = Math.max(byWeek.size, 1)
    const daysWithData = Math.max(
      new Set(entries.map((entry) => entry.waste_date)).size,
      1
    )

    const locations: LocationSummary[] = FOOD_WASTE_LOCATIONS.map((location) => {
      const total = byLocation.get(location.name) ?? 0

      return {
        name: location.name,
        total,
        averagePerWeek: total / weeksWithData,
        averagePerDay: total / daysWithData,
      }
    }).sort((a, b) => b.total - a.total)

    const weeks: WeekSummary[] = Array.from(byWeek.entries())
      .map(([week, total]) => ({ week, total }))
      .sort((a, b) => b.week - a.week)
      .slice(0, 8)

    return {
      yearTotal,
      monthTotal,
      weekTotal,
      averagePerDay: yearTotal / daysWithData,
      locations,
      weeks,
    }
  }, [currentMonth, currentWeekStart, entries, today])

  return (
    <main className="max-w-5xl mx-auto px-4 pt-4 pb-24 space-y-6">
      <header className="relative flex items-center justify-center">
        <Link
          href="/galley/food-waste"
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
          aria-label="Tilbage"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Food waste overblik
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-white/60">
            Live tal fra kokkenes registreringer
          </p>
        </div>
      </header>

      {error && (
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">I år</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.yearTotal)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">Denne måned</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.monthTotal)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">Denne uge</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.weekTotal)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">Gns. pr. dag</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.averagePerDay)}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <h2 className="text-lg font-semibold">Årsoversigt pr. sted</h2>

          <div className="mt-4 space-y-3">
            {stats.locations.map((location) => (
              <div key={location.name} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{location.name}</p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {formatAmount(location.averagePerWeek)} pr. uge · {formatAmount(location.averagePerDay)} pr. dag
                  </p>
                </div>
                <span className="rounded-full bg-nordic-soft px-3 py-1 text-sm font-semibold text-nordic">
                  {formatAmount(location.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <h2 className="text-lg font-semibold">Seneste uger</h2>

          <div className="mt-4 space-y-3">
            {loading && (
              <p className="text-sm text-gray-500 dark:text-white/60">Henter...</p>
            )}

            {!loading && stats.weeks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-white/60">Ingen registreringer endnu.</p>
            )}

            {stats.weeks.map((week) => (
              <div key={week.week} className="flex items-center justify-between gap-3">
                <span className="font-medium">Uge {week.week}</span>
                <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  {formatAmount(week.total)}
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
                {formatAmount(entry.quantity_kg)}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
