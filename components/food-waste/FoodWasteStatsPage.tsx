'use client'

import { Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'
import {
  cacheFoodWasteEntries,
  cacheFoodWasteGuestCounts,
  readCachedFoodWasteEntries,
  readCachedFoodWasteGuestCounts,
  readPendingFoodWasteEntries,
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
}

type GuestCount = {
  id: string
  service_date: string
  guest_count: number
  comment: string | null
  vessel?: 'crown' | 'pearl'
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

function formatAmount(value: number, lang: string, decimals = 1) {
  return `${value.toLocaleString(lang === 'sv' ? 'sv-SE' : 'da-DK', {
    maximumFractionDigits: decimals,
  })} kg`
}

function formatNumber(value: number, lang: string) {
  return value.toLocaleString(lang === 'sv' ? 'sv-SE' : 'da-DK')
}

function formatDate(value: string, lang: string) {
  return parseLocalDate(value).toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

function getEntryAmount(entry: FoodWasteEntry) {
  return Number(entry.quantity_kg) || 0
}

type Props = {
  vessel?: 'crown' | 'pearl'
}

export default function FoodWasteStatsPage({ vessel = 'crown' }: Props) {
  const { t, lang } = useTranslation()
  const today = getToday()

  const [fromDate, setFromDate] = useState(getMonthStart(today))
  const [toDate, setToDate] = useState(today)
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([])
  const [guestDate, setGuestDate] = useState(today)
  const [guestCount, setGuestCount] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingGuests, setSavingGuests] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [guestTableError, setGuestTableError] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadOverview() {
      setLoading(true)

      const cachedEntries = readCachedFoodWasteEntries(vessel)
      const pendingEntries = readPendingFoodWasteEntries(vessel)
      const cachedGuests = readCachedFoodWasteGuestCounts(vessel)

      if (
        cachedEntries.length > 0 ||
        pendingEntries.length > 0 ||
        cachedGuests.length > 0
      ) {
        setEntries(
          [...pendingEntries, ...cachedEntries].filter(
            (entry) => entry.waste_date >= fromDate && entry.waste_date <= toDate
          )
        )
        setGuestCounts(
          cachedGuests.filter(
            (count) => count.service_date >= fromDate && count.service_date <= toDate
          )
        )
        setLoading(false)
      }

      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .eq('vessel', vessel)
        .gte('waste_date', fromDate)
        .lte('waste_date', toDate)
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })

      const { data: guests, error: guestsError } = await supabase
        .from('food_waste_guest_counts')
        .select('*')
        .eq('vessel', vessel)
        .gte('service_date', fromDate)
        .lte('service_date', toDate)
        .order('service_date', { ascending: false })

      if (!isCurrent) return

      if (loadError) {
        setError(t.offlineShowingCached)
      } else {
        setError('')
        const nextEntries = data ?? []
        cacheFoodWasteEntries(nextEntries, vessel)
        setEntries(
          [...readPendingFoodWasteEntries(vessel), ...nextEntries].filter(
            (entry) => entry.waste_date >= fromDate && entry.waste_date <= toDate
          )
        )
      }

      if (guestsError) {
        setGuestTableError(true)
      } else {
        setGuestTableError(false)
        const nextGuests = guests ?? []
        cacheFoodWasteGuestCounts(nextGuests, vessel)
        setGuestCounts(nextGuests)
      }

      setLoading(false)
    }

    void loadOverview()

    return () => {
      isCurrent = false
    }
  }, [fromDate, t.offlineShowingCached, toDate, vessel])

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
            label: `${t.week} ${week}`,
            total,
          }))
          .sort((a, b) => Number(a.label.replace(`${t.week} `, '')) - Number(b.label.replace(`${t.week} `, '')))
      : Array.from(dailyTotals.entries())
          .map(([date, total]) => ({
            label: formatDate(date, lang),
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
  }, [entries, fromDate, guestCounts, lang, t.week, toDate])

  async function saveGuestCount() {
    const guests = Number(guestCount)

    if (!guests || guests <= 0) {
      setGuestMessage(t.guestCountRequired)
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
          vessel,
        },
        { onConflict: 'vessel,service_date' }
      )
      .select('*')
      .single()

    if (saveError || !data) {
      setGuestTableError(true)
      setGuestMessage(t.couldNotSaveGuests)
    } else {
      setGuestTableError(false)
      setGuestMessage(t.guestsSaved)
      setGuestCount('')
      setGuestCounts((current) => [
        data,
        ...current.filter((count) => count.service_date !== data.service_date),
      ])
      cacheFoodWasteGuestCounts([data], vessel)
    }

    setSavingGuests(false)
  }

  async function exportOverview() {
    setExporting(true)

    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()

    const overviewRows = [
      [t.periodFrom, fromDate],
      [t.periodTo, toDate],
      [t.kgInPeriod, stats.totalKg],
      [t.guests, stats.guestsTotal],
      [t.kgPerGuest, stats.kgPerGuest],
      [t.averageKgPerDay, stats.averagePerDay],
    ]

    const locationRows = stats.locations.map((location) => ({
      [t.location]: location.name,
      [t.kgInPeriod]: location.total,
      [t.averageKgPerDay]: location.averagePerDay,
    }))

    const chartRows = stats.chartPoints.map((point) => ({
      [t.period]: point.label,
      [t.kg]: point.total,
    }))

    const entryRows = entries.map((entry) => ({
      [t.date]: entry.waste_date,
      [t.location]: entry.location_name,
      [t.kg]: getEntryAmount(entry),
      [t.comment]: entry.comment ?? '',
      [t.created]: entry.created_at,
    }))

    const guestRows = guestCounts.map((guest) => ({
      [t.date]: guest.service_date,
      [t.guests]: guest.guest_count,
      [t.comment]: guest.comment ?? '',
    }))

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(overviewRows),
      t.sheetOverview
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(locationRows),
      t.sheetPerLocation
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(chartRows),
      t.sheetChartData
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(entryRows),
      t.sheetRegistrations
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(guestRows),
      t.sheetGuests
    )

    XLSX.writeFile(workbook, `food-waste-${fromDate}-til-${toDate}.xlsx`)
    setExporting(false)
  }

  const maxChartValue = Math.max(
    ...stats.chartPoints.map((point) => point.total),
    1
  )

  return (
    <main className="max-w-5xl mx-auto px-4 pt-4 pb-24 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t.foodWasteOverview}
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-white/60">
          {t.foodWasteOverviewSubtitle}
        </p>
      </header>

      {error && (
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {guestTableError && (
        <p className="rounded-2xl bg-amber-400/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {t.guestCountsNeedSql}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-500 dark:text-white/60">
            {t.fromDate}
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
            {t.toDate}
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
          <p className="text-sm text-gray-500 dark:text-white/60">{t.kgInPeriod}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.totalKg, lang)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.guests}</p>
          <div className="mt-2 text-2xl font-semibold">{formatNumber(stats.guestsTotal, lang)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.kgPerGuest}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.kgPerGuest, lang, 2)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.averagePerDay}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.averagePerDay, lang)}</div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t.weightChart}</h2>
          {loading && (
            <span className="text-sm text-gray-500 dark:text-white/60">
              {t.loadingShort}
            </span>
          )}
        </div>

        <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto pb-2">
          {!loading && stats.chartPoints.length === 0 && (
            <p className="self-center text-sm text-gray-500 dark:text-white/60">
              {t.noRegistrationsInPeriod}
            </p>
          )}

          {stats.chartPoints.map((point) => (
            <div
              key={point.label}
              className="flex h-full min-w-12 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                {formatAmount(point.total, lang)}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.writeGuests}</h2>
            <button
              onClick={() => void exportOverview()}
              disabled={loading || exporting}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition active:scale-[0.98] disabled:opacity-50 dark:bg-white/10 dark:text-white"
            >
              <Download size={16} />
              {exporting ? t.exporting : t.exportExcel}
            </button>
          </div>

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
              placeholder={t.guestCountPlaceholder}
            />
            <button
              onClick={saveGuestCount}
              disabled={savingGuests}
              className="min-h-12 rounded-2xl bg-black px-5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {savingGuests ? t.saving : t.saveGuests}
            </button>
          </div>

          {guestMessage && (
            <p className="mt-3 rounded-2xl bg-nordic-soft px-4 py-3 text-sm text-nordic">
              {guestMessage}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <h2 className="text-lg font-semibold">{t.overviewByLocation}</h2>

          <div className="mt-4 space-y-3">
            {stats.locations.map((location) => (
              <div key={location.name} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{location.name}</p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {formatAmount(location.averagePerDay, lang)} {t.perDay}
                  </p>
                </div>
                <span className="rounded-full bg-nordic-soft px-3 py-1 text-sm font-semibold text-nordic">
                  {formatAmount(location.total, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.latestRegistrations}</h2>

        {entries.slice(0, 10).map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{entry.location_name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {formatDate(entry.waste_date, lang)}
                </p>
              </div>
              <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white dark:bg-white dark:text-black">
                {formatAmount(getEntryAmount(entry), lang)}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}





