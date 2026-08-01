'use client'

import { ChevronDown, Download, Maximize2, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
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
  dates: string[]
}

type WasteCategoryStats = {
  totalKg: number
  averagePerDay: number
  locations: LocationSummary[]
  chartPoints: ChartPoint[]
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

function formatDecimal(value: number, lang: string, decimals = 2) {
  return value.toLocaleString(lang === 'sv' ? 'sv-SE' : 'da-DK', {
    maximumFractionDigits: decimals,
  })
}

function formatCurrency(value: number, lang: string) {
  return value.toLocaleString(lang === 'sv' ? 'sv-SE' : 'da-DK', {
    maximumFractionDigits: 0,
  })
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

function formatTime(value: string, lang: string) {
  return new Date(value).toLocaleTimeString(
    lang === 'sv' ? 'sv-SE' : 'da-DK',
    {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Copenhagen',
    }
  )
}

function LocationList({
  locations,
  lang,
  perDay,
}: {
  locations: LocationSummary[]
  lang: string
  perDay: string
}) {
  return (
    <div className="mt-4 space-y-3">
      {locations.map((location) => (
        <div
          key={location.name}
          className="grid grid-cols-[1fr_auto] items-center gap-3"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{location.name}</p>
            <p className="text-xs text-gray-500 dark:text-white/60">
              {formatAmount(location.averagePerDay, lang)} {perDay}
            </p>
          </div>
          <span className="rounded-full bg-nordic-soft px-3 py-1 text-sm font-semibold text-nordic">
            {formatAmount(location.total, lang)}
          </span>
        </div>
      ))}
    </div>
  )
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
  const [guestPanelOpen, setGuestPanelOpen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<{
    chart: string
    point: ChartPoint
  } | null>(null)
  const [expandedChart, setExpandedChart] = useState<string | null>(null)

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
    const daysInRange = getDateRangeDays(fromDate, toDate)
    const useWeeks = daysInRange > 45

    function buildCategoryStats(
      categoryEntries: FoodWasteEntry[],
      locationNames: string[]
    ): WasteCategoryStats {
      const byLocation = new Map<string, number>()
      const dailyTotals = new Map<string, number>()
      const weeklyTotals = new Map<number, number>()
      const weeklyDates = new Map<number, Set<string>>()

      for (const entry of categoryEntries) {
        const amount = getEntryAmount(entry)
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
        const dates = weeklyDates.get(week) ?? new Set<string>()
        dates.add(entry.waste_date)
        weeklyDates.set(week, dates)
      }

      const totalKg = categoryEntries.reduce(
        (total, entry) => total + getEntryAmount(entry),
        0
      )
      const locations = locationNames
        .map((name) => {
          const total = byLocation.get(name) ?? 0
          return { name, total, averagePerDay: total / daysInRange }
        })
        .sort((a, b) => b.total - a.total)
      const chartPoints: ChartPoint[] = useWeeks
        ? Array.from(weeklyTotals.entries())
            .map(([week, total]) => ({
              label: `${t.week} ${week}`,
              total,
              dates: Array.from(weeklyDates.get(week) ?? []),
            }))
            .sort(
              (a, b) =>
                Number(a.label.replace(`${t.week} `, '')) -
                Number(b.label.replace(`${t.week} `, ''))
            )
        : Array.from(dailyTotals.entries())
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, total]) => ({
              label: formatDate(date, lang),
              total,
              dates: [date],
            }))

      return {
        totalKg,
        averagePerDay: totalKg / daysInRange,
        locations,
        chartPoints,
      }
    }

    const productionNames = FOOD_WASTE_LOCATIONS.filter((location) =>
      location.name.startsWith('Produktion ')
    ).map((location) => location.name)
    const buffetNames = FOOD_WASTE_LOCATIONS.filter(
      (location) => !location.name.startsWith('Produktion ')
    ).map((location) => location.name)
    const productionNameSet = new Set(productionNames)
    const buffet = buildCategoryStats(
      entries.filter((entry) => !productionNameSet.has(entry.location_name)),
      buffetNames
    )
    const production = buildCategoryStats(
      entries.filter((entry) => productionNameSet.has(entry.location_name)),
      productionNames
    )
    const grinder = buildCategoryStats(
      entries,
      FOOD_WASTE_LOCATIONS.map((location) => location.name)
    )

    const guestsTotal = guestCounts.reduce(
      (total, count) => total + count.guest_count,
      0
    )

    return {
      buffet,
      production,
      grinder,
      guestsTotal,
      kgPerGuest: guestsTotal > 0 ? buffet.totalKg / guestsTotal : 0,
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
      setGuestPanelOpen(false)
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
      [t.buffetWaste, stats.buffet.totalKg],
      [t.productionWaste, stats.grinder.totalKg],
      [t.guests, stats.guestsTotal],
      [t.buffetKgPerGuest, stats.kgPerGuest],
      [t.productionAveragePerDay, stats.production.averagePerDay],
    ]

    const locationRows = [
      ...stats.buffet.locations.map((location) => ({
        [t.category]: t.buffetWaste,
        [t.location]: location.name,
        [t.kgInPeriod]: location.total,
        [t.averageKgPerDay]: location.averagePerDay,
      })),
      ...stats.production.locations.map((location) => ({
        [t.category]: t.productionAndDeckOne,
        [t.location]: location.name,
        [t.kgInPeriod]: location.total,
        [t.averageKgPerDay]: location.averagePerDay,
      })),
    ]

    const chartRows = [
      ...stats.buffet.chartPoints.map((point) => ({
        [t.category]: t.buffetWaste,
        [t.period]: point.label,
        [t.kg]: point.total,
      })),
      ...stats.grinder.chartPoints.map((point) => ({
        [t.category]: t.productionWaste,
        [t.period]: point.label,
        [t.kg]: point.total,
      })),
    ]

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

  const maxBuffetChartValue = Math.max(
    ...stats.buffet.chartPoints.map((point) => point.total),
    1
  )
  const maxProductionChartValue = Math.max(
    ...stats.grinder.chartPoints.map((point) => point.total),
    1
  )
  const estimatedContainers = stats.grinder.totalKg / 3000
  const estimatedSavings = estimatedContainers * 5000
  const grinderLocations: LocationSummary[] = [
    {
      name: t.buffetIncludedInGrinder,
      total: stats.buffet.totalKg,
      averagePerDay: stats.buffet.averagePerDay,
    },
    ...stats.production.locations,
  ]

  const chartConfigs = [
    {
      title: t.buffetDevelopment,
      kind: 'buffet' as const,
      points: stats.buffet.chartPoints,
      maxValue: maxBuffetChartValue,
      barClass: 'bg-amber-500',
      showEstimate: false,
    },
    {
      title: t.productionDevelopment,
      kind: 'grinder' as const,
      points: stats.grinder.chartPoints,
      maxValue: maxProductionChartValue,
      barClass: 'bg-nordic',
      showEstimate: true,
    },
  ]

  function getPointBreakdown(point: ChartPoint, kind: 'buffet' | 'grinder') {
    const selectedDates = new Set(point.dates)
    const totals = new Map<string, { total: number; times: Set<string> }>()

    for (const entry of entries) {
      if (!selectedDates.has(entry.waste_date)) continue
      if (kind === 'buffet' && entry.location_name.startsWith('Produktion ')) {
        continue
      }

      const current = totals.get(entry.location_name) ?? {
        total: 0,
        times: new Set<string>(),
      }
      current.total += getEntryAmount(entry)
      current.times.add(formatTime(entry.created_at, lang))
      totals.set(entry.location_name, current)
    }

    return Array.from(totals.entries())
      .map(([name, details]) => ({
        name,
        total: details.total,
        times: Array.from(details.times).sort(),
      }))
      .filter((location) => location.total > 0)
      .sort((a, b) => b.total - a.total)
  }

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
          <p className="text-sm text-gray-500 dark:text-white/60">{t.buffetWaste}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.buffet.totalKg, lang)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.guests}</p>
          <div className="mt-2 text-2xl font-semibold">{formatNumber(stats.guestsTotal, lang)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.buffetKgPerGuest}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.kgPerGuest, lang, 2)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.productionWaste}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.grinder.totalKg, lang)}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {chartConfigs.map((chart) => (
          <div
            key={chart.title}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{chart.title}</h2>
              <div className="flex items-center gap-2">
                {loading && (
                  <span className="text-sm text-gray-500 dark:text-white/60">
                    {t.loadingShort}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExpandedChart(chart.title)
                    if (selectedPoint?.chart !== chart.title && chart.points.length > 0) {
                      setSelectedPoint({
                        chart: chart.title,
                        point: chart.points[chart.points.length - 1],
                      })
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-gray-600 transition hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
                  aria-label={lang === 'sv' ? 'Förstora graf' : 'Forstør graf'}
                >
                  <Maximize2 size={17} />
                </button>
              </div>
            </div>

            {chart.showEstimate && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-nordic-soft px-3 py-2">
                  <p className="text-[11px] text-gray-500 dark:text-white/60">
                    {t.estimatedContainerEquivalent}
                  </p>
                  <p className="mt-1 font-semibold text-nordic">
                    {formatDecimal(estimatedContainers, lang)} {t.containerShort}
                  </p>
                </div>
                <div className="rounded-xl bg-nordic-soft px-3 py-2">
                  <p className="text-[11px] text-gray-500 dark:text-white/60">
                    {t.estimatedRenovationSavings}
                  </p>
                  <p className="mt-1 font-semibold text-nordic">
                    {formatCurrency(estimatedSavings, lang)} kr.
                  </p>
                </div>
                <p className="col-span-2 text-[11px] text-gray-400 dark:text-white/40">
                  {t.estimateBasis}
                </p>
              </div>
            )}

            <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto pb-2">
              {!loading && chart.points.length === 0 && (
                <p className="self-center text-sm text-gray-500 dark:text-white/60">
                  {t.noRegistrationsInPeriod}
                </p>
              )}

              {chart.points.map((point, pointIndex) => (
                <button
                  type="button"
                  key={point.label}
                  onClick={() => {
                    setSelectedPoint({ chart: chart.title, point })
                    setExpandedChart(chart.title)
                  }}
                  aria-label={`${point.label}: ${formatAmount(point.total, lang)}`}
                  className={`group flex h-full min-w-12 flex-col items-center justify-end gap-2 rounded-xl px-1 transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-nordic/30 dark:hover:bg-white/5 ${
                    selectedPoint?.chart === chart.title &&
                    selectedPoint.point.label === point.label
                      ? 'bg-black/5 dark:bg-white/5'
                      : ''
                  }`}
                >
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    {formatAmount(point.total, lang)}
                  </span>
                  <motion.div
                    className={`w-8 rounded-t-xl ${chart.barClass}`}
                    initial={{ height: 0, opacity: 0.4 }}
                    animate={{
                      height:
                        point.total > 0
                          ? Math.max((point.total / chart.maxValue) * 130, 8)
                          : 0,
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.45,
                      delay: Math.min(pointIndex * 0.05, 0.4),
                      ease: 'easeOut',
                    }}
                    whileHover={{ scaleX: 1.15 }}
                  />
                  <span className="text-xs text-gray-500 dark:text-white/60">
                    {point.label}
                  </span>
                </button>
              ))}
            </div>

          </div>
        ))}
      </section>

      <AnimatePresence>
        {expandedChart && (() => {
          const chart = chartConfigs.find((candidate) => candidate.title === expandedChart)
          if (!chart) return null

          const activePoint =
            selectedPoint?.chart === chart.title
              ? selectedPoint.point
              : chart.points[chart.points.length - 1]
          const breakdown = activePoint
            ? getPointBreakdown(activePoint, chart.kind)
            : []
          const largest = breakdown[0]
          const chartAverage =
            chart.points.reduce((sum, point) => sum + point.total, 0) /
            Math.max(chart.points.length, 1)
          const difference = activePoint && chartAverage > 0
            ? ((activePoint.total - chartAverage) / chartAverage) * 100
            : 0

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/60 p-3 sm:p-6 dark:bg-[#031f1f]/95"
              onClick={() => setExpandedChart(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                onClick={(event) => event.stopPropagation()}
                className="mx-auto flex max-h-full w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#162338]"
              >
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/10 sm:px-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-nordic/70">
                      {lang === 'sv' ? 'Detaljerad graf' : 'Detaljeret graf'}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{chart.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedChart(null)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                    aria-label={lang === 'sv' ? 'Stäng' : 'Luk'}
                  >
                    <X size={21} />
                  </button>
                </div>

                <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,.9fr)]">
                  <div className="border-b border-black/5 p-5 dark:border-white/10 lg:border-b-0 lg:border-r sm:p-7">
                    <div className="flex h-[360px] items-end gap-3 overflow-x-auto pb-3">
                      {chart.points.map((point, pointIndex) => (
                        <button
                          type="button"
                          key={point.label}
                          onClick={() => setSelectedPoint({ chart: chart.title, point })}
                          className={`group flex h-full min-w-16 flex-1 flex-col items-center justify-end gap-3 rounded-2xl px-2 transition hover:bg-black/5 dark:hover:bg-white/5 ${
                            activePoint?.label === point.label
                              ? 'bg-nordic-soft ring-2 ring-nordic/25 dark:bg-white/10'
                              : ''
                          }`}
                        >
                          <span className="text-sm font-semibold text-gray-600 dark:text-white/70">
                            {formatAmount(point.total, lang)}
                          </span>
                          <motion.div
                            className={`w-12 rounded-t-2xl ${chart.barClass}`}
                            initial={{ height: 0 }}
                            animate={{
                              height: point.total > 0
                                ? Math.max((point.total / chart.maxValue) * 250, 10)
                                : 0,
                            }}
                            transition={{ duration: 0.45, delay: Math.min(pointIndex * 0.04, 0.3) }}
                          />
                          <span className="pb-2 text-sm text-gray-500 dark:text-white/60">
                            {point.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <aside className="p-5 sm:p-7">
                    {activePoint ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-nordic/70">
                              {lang === 'sv' ? 'Fördelning' : 'Fordeling'}
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-nordic">
                              {activePoint.label}
                            </h3>
                          </div>
                          <span className="rounded-full bg-nordic-soft px-3 py-1.5 text-sm font-semibold text-nordic">
                            {Math.abs(difference).toLocaleString(
                              lang === 'sv' ? 'sv-SE' : 'da-DK',
                              { maximumFractionDigits: 0 }
                            )}% {difference >= 0
                              ? lang === 'sv' ? 'över snittet' : 'over gennemsnittet'
                              : lang === 'sv' ? 'under snittet' : 'under gennemsnittet'}
                          </span>
                        </div>

                        <div className="mt-6 space-y-5">
                          {breakdown.map((location) => {
                            const percentage = activePoint.total > 0
                              ? (location.total / activePoint.total) * 100
                              : 0

                            return (
                              <div key={location.name}>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="font-semibold">{location.name}</p>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-white/55">
                                      {lang === 'sv' ? 'Registrerat kl.' : 'Registreret kl.'}{' '}
                                      {location.times.join(', ')}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-lg font-semibold text-nordic">
                                      {formatAmount(location.total, lang)}
                                    </p>
                                    <p className="text-sm font-medium text-gray-500 dark:text-white/55">
                                      {formatNumber(Math.round(percentage), lang)}%
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className="h-full rounded-full bg-nordic"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {largest && (
                          <p className="mt-7 rounded-2xl bg-nordic-soft p-4 text-sm leading-relaxed text-gray-700 dark:text-white/70">
                            {lang === 'sv' ? 'Största bidraget kom från' : 'Det største bidrag kom fra'}{' '}
                            <strong>{largest.name}</strong>. {breakdown.length}{' '}
                            {lang === 'sv' ? 'stationer hade registreringar.' : 'stationer havde registreringer.'}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 dark:text-white/60">{t.noRegistrationsInPeriod}</p>
                    )}
                  </aside>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      <section className="hidden items-stretch gap-6 lg:grid lg:grid-cols-2">
        <div className="h-full rounded-2xl border border-amber-500/15 bg-amber-50/60 p-4 shadow-sm dark:bg-amber-400/5">
          <h2 className="text-lg font-semibold">{t.buffetByLocation}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            {t.buffetWasteExplanation}
          </p>
          <LocationList locations={stats.buffet.locations} lang={lang} perDay={t.perDay} />
        </div>

        <div className="h-full rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#162338]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t.productionByLocation}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                {t.productionWasteExplanation}
              </p>
            </div>
            <p className="text-sm font-semibold text-nordic">
              {formatAmount(stats.grinder.averagePerDay, lang)} {t.perDay}
            </p>
          </div>
          <LocationList
            locations={grinderLocations}
            lang={lang}
            perDay={t.perDay}
          />
        </div>
      </section>

      <section className="grid gap-3 lg:hidden">
        {[
          {
            title: t.buffetByLocation,
            explanation: t.buffetWasteExplanation,
            locations: stats.buffet.locations,
            className: 'border-amber-500/15 bg-amber-50/60 dark:bg-amber-400/5',
          },
          {
            title: t.productionByLocation,
            explanation: t.productionWasteExplanation,
            locations: grinderLocations,
            className: 'border-black/5 bg-white dark:border-white/10 dark:bg-[#162338]',
          },
        ].map((overview) => (
          <details
            key={overview.title}
            className={`group rounded-2xl border shadow-sm ${overview.className}`}
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
              {overview.title}
              <ChevronDown
                size={19}
                className="shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="border-t border-black/5 px-4 pb-4 pt-3 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-white/60">
                {overview.explanation}
              </p>
              <LocationList
                locations={overview.locations}
                lang={lang}
                perDay={t.perDay}
              />
            </div>
          </details>
        ))}
      </section>

      <aside className="fixed bottom-24 right-4 z-40 hidden lg:block xl:right-6">
        <div
          className={`overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl transition-[width] duration-300 dark:border-white/10 dark:bg-[#162338] ${
            guestPanelOpen ? 'w-72' : 'w-44'
          }`}
        >
          <button
            type="button"
            onClick={() => setGuestPanelOpen((current) => !current)}
            aria-expanded={guestPanelOpen}
            className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <Users size={18} className="text-nordic" />
              {t.writeGuests}
            </span>
            <ChevronDown
              size={17}
              className={`transition-transform ${guestPanelOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ${
              guestPanelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid gap-3 border-t border-black/5 p-4 dark:border-white/10">
                <input
                  type="date"
                  value={guestDate}
                  onChange={(event) => setGuestDate(event.target.value)}
                  className="h-12 w-full rounded-xl border border-black/5 bg-gray-100 px-4 dark:border-white/10 dark:bg-[#0f1b2d]"
                />
                <input
                  inputMode="numeric"
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                  className="h-14 w-full rounded-xl border border-black/5 bg-gray-100 px-4 text-2xl font-semibold dark:border-white/10 dark:bg-[#0f1b2d]"
                  placeholder={t.guestCountPlaceholder}
                />
                <button
                  onClick={saveGuestCount}
                  disabled={savingGuests}
                  className="min-h-12 rounded-xl bg-black px-5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {savingGuests ? t.saving : t.saveGuests}
                </button>

                {guestMessage && (
                  <p className="rounded-xl bg-nordic-soft px-4 py-3 text-sm text-nordic">
                    {guestMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.latestRegistrations}</h2>

        {entries.slice(0, 3).map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{entry.location_name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {formatDate(entry.waste_date, lang)} · kl.{' '}
                  {formatTime(entry.created_at, lang)}
                </p>
              </div>
              <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white dark:bg-white dark:text-black">
                {formatAmount(getEntryAmount(entry), lang)}
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="flex justify-center pt-2">
        <button
          onClick={() => void exportOverview()}
          disabled={loading || exporting}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black sm:w-auto"
        >
          <Download size={18} />
          {exporting ? t.exporting : t.exportExcel}
        </button>
      </div>
    </main>
  )
}





