'use client'

import { ChevronDown, Download, Maximize2, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { displayFoodWasteLocation, FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'
import {
  cacheFoodWasteEntries,
  cacheFoodWasteGuestCounts,
  readCachedFoodWasteEntries,
  readCachedFoodWasteGuestCounts,
  replaceCachedFoodWasteGuestCounts,
  readPendingFoodWasteEntries,
} from '@/lib/foodWasteOffline'
import { localeFor, useTranslation } from '@/lib/LanguageContext'
import { queryString, secureFetch } from '@/lib/secureApi'

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
  skagerak_morning?: number | null
  commodore_morning?: number | null
  skagerak_evening?: number | null
  mess_guests?: number | null
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
  return `${value.toLocaleString(localeFor(lang), {
    maximumFractionDigits: decimals,
  })} kg`
}

type GuestBreakdown = {
  type: 'guest_breakdown'
  skagerakMorning: number
  commodoreMorning: number
  skagerakEvening: number
  messGuests: number
}

function parseGuestBreakdown(comment: string | null): GuestBreakdown | null {
  if (!comment) return null
  try {
    const value = JSON.parse(comment) as Partial<GuestBreakdown>
    if (value.type !== 'guest_breakdown') return null
    return {
      type: 'guest_breakdown',
      skagerakMorning: Number(value.skagerakMorning) || 0,
      commodoreMorning: Number(value.commodoreMorning) || 0,
      skagerakEvening: Number(value.skagerakEvening) || 0,
      messGuests: Number(value.messGuests) || 160,
    }
  } catch {
    return null
  }
}

function getGuestBreakdown(guest: GuestCount | undefined): GuestBreakdown | null {
  if (!guest) return null
  if (
    guest.skagerak_morning != null ||
    guest.commodore_morning != null ||
    guest.skagerak_evening != null ||
    guest.mess_guests != null
  ) {
    return {
      type: 'guest_breakdown',
      skagerakMorning: Number(guest.skagerak_morning) || 0,
      commodoreMorning: Number(guest.commodore_morning) || 0,
      skagerakEvening: Number(guest.skagerak_evening) || 0,
      messGuests: Number(guest.mess_guests) || 160,
    }
  }
  return parseGuestBreakdown(guest.comment)
}

type BuffetView = 'all' | 'morning' | 'evening' | 'mess'
type GrinderView = 'all' | 'buffet' | 'production' | 'deck'

function isBuffetLocationForView(name: string, view: BuffetView) {
  if (view === 'morning') return name === 'Skagerak morgen' || name === 'Commodore morgen'
  if (view === 'evening') return name === 'Skagerak aften'
  if (view === 'mess') return name.startsWith('Messen ')
  return !name.startsWith('Produktion ')
}

function isGrinderLocationForView(name: string, view: GrinderView) {
  if (view === 'buffet') return !name.startsWith('Produktion ')
  if (view === 'production') {
    return name === 'Produktion Varm Galley' || name === 'Produktion Main Galley' || name === 'Produktion Skagerak Galley'
  }
  if (view === 'deck') {
    return name === 'Produktion Bageri' || name === 'Produktion Slagteri' || name === 'Produktion Proviant'
  }
  return true
}

function formatPerGuestAmount(value: number, lang: string) {
  if (value < 1) {
    return `${(value * 1000).toLocaleString(localeFor(lang), {
      maximumFractionDigits: 0,
    })} g`
  }

  return formatAmount(value, lang, 2)
}

function formatNumber(value: number, lang: string) {
  return value.toLocaleString(localeFor(lang))
}

function formatDecimal(value: number, lang: string, decimals = 2) {
  return value.toLocaleString(localeFor(lang), {
    maximumFractionDigits: decimals,
  })
}

function formatCurrency(value: number, lang: string) {
  return value.toLocaleString(localeFor(lang), {
    maximumFractionDigits: 0,
  })
}

function formatDate(value: string, lang: string) {
  return parseLocalDate(value).toLocaleDateString(localeFor(lang), {
    day: 'numeric',
    month: 'short',
  })
}

function getEntryAmount(entry: FoodWasteEntry) {
  return Number(entry.quantity_kg) || 0
}

function formatTime(value: string, lang: string) {
  return new Date(value).toLocaleTimeString(
    localeFor(lang),
    {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Copenhagen',
    }
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
  const [skagerakMorningGuests, setSkagerakMorningGuests] = useState('')
  const [commodoreMorningGuests, setCommodoreMorningGuests] = useState('')
  const [skagerakEveningGuests, setSkagerakEveningGuests] = useState('')
  const [messGuests, setMessGuests] = useState('160')
  const [buffetView, setBuffetView] = useState<BuffetView>('all')
  const [grinderView, setGrinderView] = useState<GrinderView>('all')
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

      let data: FoodWasteEntry[] = []
      let guests: GuestCount[] = []
      let loadError: unknown = null
      let guestsError: unknown = null

      try {
        const result = await secureFetch<{ data: FoodWasteEntry[] }>(
          `/api/food-waste/entries?${queryString({
            ship: vessel,
            from: fromDate,
            to: toDate,
            limit: 2000,
          })}`
        )
        data = result.data
      } catch (error) {
        loadError = error
      }

      try {
        const result = await secureFetch<{ data: GuestCount[] }>(
          `/api/food-waste/guests?${queryString({
            ship: vessel,
            from: fromDate,
            to: toDate,
          })}`
        )
        guests = result.data
      } catch (error) {
        guestsError = error
      }

      if (!isCurrent) return

      if (loadError) {
        setError(t.offlineShowingCached)
      } else {
        setError('')
        const nextEntries = data
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
        const nextGuests = Array.from(
          new Map(guests.map((guest) => [guest.service_date, guest])).values()
        )
        // A full server response is authoritative. Replacing the cache here
        // also removes dates that were deleted directly in Supabase.
        replaceCachedFoodWasteGuestCounts(nextGuests, vessel)
        setGuestCounts(nextGuests)
      }

      setLoading(false)
    }

    void loadOverview()

    return () => {
      isCurrent = false
    }
  }, [fromDate, t.offlineShowingCached, toDate, vessel])

  useEffect(() => {
    const saved = guestCounts.find((guest) => guest.service_date === guestDate)
    const breakdown = getGuestBreakdown(saved)
    setSkagerakMorningGuests(breakdown ? String(breakdown.skagerakMorning || '') : '')
    setCommodoreMorningGuests(breakdown ? String(breakdown.commodoreMorning || '') : '')
    setSkagerakEveningGuests(breakdown ? String(breakdown.skagerakEvening || '') : '')
    setMessGuests(String(breakdown?.messGuests ?? 160))
  }, [guestCounts, guestDate])

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
    const buffetViews: Record<BuffetView, WasteCategoryStats> = {
      all: buffet,
      morning: buildCategoryStats(
        entries.filter((entry) => isBuffetLocationForView(entry.location_name, 'morning')),
        buffetNames.filter((name) => isBuffetLocationForView(name, 'morning'))
      ),
      evening: buildCategoryStats(
        entries.filter((entry) => isBuffetLocationForView(entry.location_name, 'evening')),
        buffetNames.filter((name) => isBuffetLocationForView(name, 'evening'))
      ),
      mess: buildCategoryStats(
        entries.filter((entry) => isBuffetLocationForView(entry.location_name, 'mess')),
        buffetNames.filter((name) => isBuffetLocationForView(name, 'mess'))
      ),
    }
    const production = buildCategoryStats(
      entries.filter((entry) => productionNameSet.has(entry.location_name)),
      productionNames
    )
    const grinder = buildCategoryStats(
      entries,
      FOOD_WASTE_LOCATIONS.map((location) => location.name)
    )
    const allLocationNames = FOOD_WASTE_LOCATIONS.map((location) => location.name)
    const grinderViews: Record<GrinderView, WasteCategoryStats> = {
      all: grinder,
      buffet: buildCategoryStats(
        entries.filter((entry) => isGrinderLocationForView(entry.location_name, 'buffet')),
        allLocationNames.filter((name) => isGrinderLocationForView(name, 'buffet'))
      ),
      production: buildCategoryStats(
        entries.filter((entry) => isGrinderLocationForView(entry.location_name, 'production')),
        allLocationNames.filter((name) => isGrinderLocationForView(name, 'production'))
      ),
      deck: buildCategoryStats(
        entries.filter((entry) => isGrinderLocationForView(entry.location_name, 'deck')),
        allLocationNames.filter((name) => isGrinderLocationForView(name, 'deck'))
      ),
    }

    const guestsTotal = guestCounts.reduce(
      (total, count) => total + count.guest_count,
      0
    )

    return {
      buffet,
      buffetViews,
      production,
      grinder,
      grinderViews,
      guestsTotal,
      kgPerGuest: guestsTotal > 0 ? buffet.totalKg / guestsTotal : 0,
    }
  }, [entries, fromDate, guestCounts, lang, t.week, toDate])

  function getGuestsForDates(dates: string[], view: BuffetView) {
    const selectedDates = new Set(dates)

    if (view === 'mess') {
      const servicesByDate = new Map<string, Set<string>>()
      for (const entry of entries) {
        if (!selectedDates.has(entry.waste_date) || !isBuffetLocationForView(entry.location_name, 'mess')) continue
        const services = servicesByDate.get(entry.waste_date) ?? new Set<string>()
        services.add(entry.location_name)
        servicesByDate.set(entry.waste_date, services)
      }

      return Array.from(servicesByDate.entries()).reduce((total, [date, services]) => {
        const guest = guestCounts.find((count) => count.service_date === date)
        const estimatedMessGuests = getGuestBreakdown(guest)?.messGuests ?? 160
        return total + services.size * estimatedMessGuests
      }, 0)
    }

    return guestCounts.reduce((total, guest) => {
      if (!selectedDates.has(guest.service_date)) return total
      const breakdown = getGuestBreakdown(guest)
      if (view === 'morning') {
        return total + (breakdown
          ? breakdown.skagerakMorning + breakdown.commodoreMorning
          : Math.max(guest.guest_count - 160, 0))
      }
      if (view === 'evening') {
        return total + (breakdown?.skagerakEvening ?? Math.max(guest.guest_count - 160, 0))
      }
      return total + guest.guest_count
    }, 0)
  }

  async function saveGuestCount() {
    const breakdown: GuestBreakdown = {
      type: 'guest_breakdown',
      skagerakMorning: Number(skagerakMorningGuests) || 0,
      commodoreMorning: Number(commodoreMorningGuests) || 0,
      skagerakEvening: Number(skagerakEveningGuests) || 0,
      messGuests: Number(messGuests) || 0,
    }
    const morningTotal = breakdown.skagerakMorning + breakdown.commodoreMorning
    const guests = Math.max(morningTotal, breakdown.skagerakEvening) + breakdown.messGuests

    if (
      Object.values(breakdown).some((value) => typeof value === 'number' && (!Number.isFinite(value) || value < 0)) ||
      guests <= 0
    ) {
      setGuestMessage(t.guestCountRequired)
      return
    }

    setSavingGuests(true)
    setGuestMessage('')

    let data: GuestCount | null = null
    let saveError: unknown = null
    try {
      const result = await secureFetch<{ data: GuestCount }>(
        '/api/food-waste/guests',
        {
          method: 'PUT',
          body: JSON.stringify({
          service_date: guestDate,
          guest_count: guests,
          comment: JSON.stringify(breakdown),
          skagerak_morning: breakdown.skagerakMorning,
          commodore_morning: breakdown.commodoreMorning,
          skagerak_evening: breakdown.skagerakEvening,
          mess_guests: breakdown.messGuests,
          vessel,
          }),
        }
      )
      data = result.data
    } catch (error) {
      saveError = error
    }

    if (saveError || !data) {
      setGuestTableError(true)
      setGuestMessage(t.couldNotSaveGuests)
    } else {
      setGuestTableError(false)
      setGuestMessage(t.guestsSaved)
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
        [t.location]: displayFoodWasteLocation(location.name, lang),
        [t.kgInPeriod]: location.total,
        [t.averageKgPerDay]: location.averagePerDay,
      })),
      ...stats.production.locations.map((location) => ({
        [t.category]: t.productionAndDeckOne,
        [t.location]: displayFoodWasteLocation(location.name, lang),
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
      [t.location]: displayFoodWasteLocation(entry.location_name, lang),
      [t.kg]: getEntryAmount(entry),
      [t.comment]: entry.comment ?? '',
      [t.created]: entry.created_at,
    }))

    const guestRows = guestCounts.map((guest) => {
      const breakdown = getGuestBreakdown(guest)
      return {
        [t.date]: guest.service_date,
        'Skagerak morgen': breakdown?.skagerakMorning ?? '',
        'Commodore morgen': breakdown?.commodoreMorning ?? '',
        'Skagerak aften': breakdown?.skagerakEvening ?? '',
        Messen: breakdown?.messGuests ?? '',
        [t.guests]: guest.guest_count,
      }
    })

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

  const activeBuffetStats = stats.buffetViews[buffetView]
  const buffetGuestTotal = getGuestsForDates(
    Array.from(new Set(activeBuffetStats.chartPoints.flatMap((point) => point.dates))),
    buffetView
  )
  const buffetKgPerGuest = buffetGuestTotal > 0
    ? activeBuffetStats.totalKg / buffetGuestTotal
    : 0
  const maxBuffetChartValue = Math.max(
    ...activeBuffetStats.chartPoints.map((point) => point.total),
    1
  )
  const activeGrinderStats = stats.grinderViews[grinderView]
  const maxProductionChartValue = Math.max(
    ...activeGrinderStats.chartPoints.map((point) => point.total),
    1
  )
  const guestDates = new Set(guestCounts.map((guest) => guest.service_date))
  const missingGuestDates = Array.from(
    new Set(
      entries
        .filter((entry) => !entry.location_name.startsWith('Produktion '))
        .map((entry) => entry.waste_date)
    )
  )
    .filter((date) => !guestDates.has(date))
    .sort((dateA, dateB) => dateA.localeCompare(dateB))
  const estimatedContainers = activeGrinderStats.totalKg / 2000
  const estimatedSavings = activeGrinderStats.totalKg * 1.9
  const chartConfigs = [
    {
      title: t.buffetDevelopment,
      kind: 'buffet' as const,
      points: activeBuffetStats.chartPoints,
      maxValue: maxBuffetChartValue,
      averageValue: activeBuffetStats.chartPoints.reduce((sum, point) => sum + point.total, 0) / Math.max(activeBuffetStats.chartPoints.length, 1),
      barClass: 'bg-amber-500',
      showGuestData: true,
      showEstimate: false,
    },
    {
      title: t.productionDevelopment,
      kind: 'grinder' as const,
      points: activeGrinderStats.chartPoints,
      maxValue: maxProductionChartValue,
      averageValue: activeGrinderStats.chartPoints.reduce((sum, point) => sum + point.total, 0) / Math.max(activeGrinderStats.chartPoints.length, 1),
      barClass: 'bg-nordic',
      showGuestData: false,
      showEstimate: true,
    },
  ]

  const buffetViewLabels: Record<BuffetView, string> = lang === 'en'
    ? { all: 'Total', morning: 'Morning', evening: 'Evening', mess: 'Crew mess' }
    : lang === 'sv'
      ? { all: 'Totalt', morning: 'Morgon', evening: 'Kväll', mess: 'Mässen' }
      : { all: 'Samlet', morning: 'Morgen', evening: 'Aften', mess: 'Messen' }
  const grinderViewLabels: Record<GrinderView, string> = lang === 'en'
    ? { all: 'Total', buffet: 'Buffet', production: 'Production', deck: 'Deck 1' }
    : lang === 'sv'
      ? { all: 'Totalt', buffet: 'Buffé', production: 'Produktion', deck: 'Däck 1' }
      : { all: 'Samlet', buffet: 'Buffet', production: 'Produktion', deck: 'Dæk 1' }
  const guestFieldText = lang === 'en'
    ? { morning: 'Morning', evening: 'Evening', messPerMeal: 'Crew mess per meal', estimated: 'Estimated', morningTotal: 'Morning total', eveningTotal: 'Evening total' }
    : lang === 'sv'
      ? { morning: 'Morgon', evening: 'Kväll', messPerMeal: 'Mässen per måltid', estimated: 'Uppskattat', morningTotal: 'Morgon totalt', eveningTotal: 'Kväll totalt' }
      : { morning: 'Morgen', evening: 'Aften', messPerMeal: 'Messen pr. måltid', estimated: 'Anslået', morningTotal: 'Morgen i alt', eveningTotal: 'Aften i alt' }
  const averageLabel = lang === 'en' ? 'Average' : lang === 'sv' ? 'Genomsnitt' : 'Gennemsnit'

  function getPointBreakdown(point: ChartPoint, kind: 'buffet' | 'grinder') {
    const selectedDates = new Set(point.dates)
    const totals = new Map<string, { total: number; times: Set<string> }>()

    for (const entry of entries) {
      if (!selectedDates.has(entry.waste_date)) continue
      if (kind === 'buffet' && entry.location_name.startsWith('Produktion ')) {
        continue
      }
      if (kind === 'buffet' && !isBuffetLocationForView(entry.location_name, buffetView)) {
        continue
      }
      if (kind === 'grinder' && !isGrinderLocationForView(entry.location_name, grinderView)) {
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
            className="h-12 w-full rounded-2xl bg-white px-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10"
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
            className="h-12 w-full rounded-2xl bg-white px-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10"
          />
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.buffetWaste}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.buffet.totalKg, lang)}</div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.productionWaste}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.grinder.totalKg, lang)}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {chartConfigs.map((chart) => (
          <div
            key={chart.title}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10"
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
                  aria-label={lang === 'sv' ? 'Förstora graf' : lang === 'en' ? 'Enlarge chart' : 'Forstør graf'}
                >
                  <Maximize2 size={17} />
                </button>
              </div>
            </div>

            {chart.kind === 'buffet' && (
              <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-black/5 p-1 dark:bg-black/20">
                {(Object.keys(buffetViewLabels) as BuffetView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => {
                      setBuffetView(view)
                      setSelectedPoint(null)
                    }}
                    className={`min-w-0 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                      buffetView === view
                        ? 'bg-white text-nordic shadow-sm dark:bg-white/15 dark:text-white'
                        : 'text-gray-500 hover:text-gray-800 dark:text-white/55 dark:hover:text-white'
                    }`}
                  >
                    {buffetViewLabels[view]}
                  </button>
                ))}
              </div>
            )}

            {chart.kind === 'grinder' && (
              <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-black/5 p-1 dark:bg-black/20">
                {(Object.keys(grinderViewLabels) as GrinderView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => {
                      setGrinderView(view)
                      setSelectedPoint(null)
                    }}
                    className={`min-w-0 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                      grinderView === view
                        ? 'bg-white text-nordic shadow-sm dark:bg-white/15 dark:text-white'
                        : 'text-gray-500 hover:text-gray-800 dark:text-white/55 dark:hover:text-white'
                    }`}
                  >
                    {grinderViewLabels[view]}
                  </button>
                ))}
              </div>
            )}

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

            {chart.showGuestData && (
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-400/10">
                    <p className="text-[11px] text-gray-500 dark:text-white/60">
                      {t.guestsInPeriod}
                    </p>
                    <p className="mt-1 font-semibold text-amber-700 dark:text-amber-300">
                      {buffetView === 'mess' && (lang === 'en' ? 'Est. ' : lang === 'sv' ? 'Ca ' : 'Anslået ')}
                      {formatNumber(buffetGuestTotal, lang)} {t.guests.toLowerCase()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-400/10">
                    <p className="text-[11px] text-gray-500 dark:text-white/60">
                      {t.buffetKgPerGuest}
                    </p>
                    <p className="mt-1 font-semibold text-amber-700 dark:text-amber-300">
                      {buffetGuestTotal > 0 ? formatPerGuestAmount(buffetKgPerGuest, lang) : '—'}
                    </p>
                  </div>
                </div>

                <p
                  aria-hidden="true"
                  className="invisible text-[11px]"
                >
                  {t.estimateBasis}
                </p>

                {expandedChart === chart.title && (() => {
                  const activePoint =
                    selectedPoint?.chart === chart.title
                      ? selectedPoint.point
                      : chart.points[chart.points.length - 1]

                  if (!activePoint) return null

                  const activeDates = new Set(activePoint.dates)
                  const guestsForPoint = getGuestsForDates(Array.from(activeDates), buffetView)
                  const wastePerGuest =
                    guestsForPoint > 0 ? activePoint.total / guestsForPoint : 0
                  const sourceBreakdown = getPointBreakdown(activePoint, chart.kind)

                  return (
                    <div className="rounded-xl border border-amber-500/15 bg-amber-50 p-3 dark:bg-amber-400/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">
                          {activePoint.label}
                        </p>
                        <span className="text-xs text-amber-700/70 dark:text-amber-200/70">
                          {lang === 'sv' ? 'Tryck på en stapel' : lang === 'en' ? 'Tap a bar' : 'Tryk på en søjle'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-white/55">{t.buffetWaste}</p>
                          <p className="mt-1 text-sm font-semibold">{formatAmount(activePoint.total, lang)}</p>
                        </div>
                        <div className="border-x border-amber-500/15 px-1">
                          <p className="text-[10px] text-gray-500 dark:text-white/55">{t.guests}</p>
                          <p className="mt-1 text-sm font-semibold">
                            {buffetView === 'mess' && guestsForPoint > 0
                              ? lang === 'en' ? 'Est. ' : lang === 'sv' ? 'Ca ' : 'Anslået '
                              : ''}
                            {guestsForPoint > 0 ? formatNumber(guestsForPoint, lang) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-white/55">{t.buffetKgPerGuest}</p>
                          <p className="mt-1 text-sm font-semibold">
                            {guestsForPoint > 0 ? formatPerGuestAmount(wastePerGuest, lang) : '—'}
                          </p>
                        </div>
                      </div>
                      {guestsForPoint === 0 && (
                        <p className="mt-2 text-center text-xs text-amber-800/70 dark:text-amber-200/70">
                          {t.noGuestCountsInPeriod}
                        </p>
                      )}
                      {sourceBreakdown.length > 0 && (
                        <div className="mt-3 border-t border-amber-500/15 pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800/65 dark:text-amber-200/65">
                            {lang === 'sv' ? 'Var kom svinnet från?' : lang === 'en' ? 'Where did the waste come from?' : 'Hvor kom spildet fra?'}
                          </p>
                          <div className="mt-2 space-y-2">
                            {sourceBreakdown.map((location) => {
                              const percentage = activePoint.total > 0
                                ? (location.total / activePoint.total) * 100
                                : 0

                              return (
                                <div key={location.name}>
                                  <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="truncate font-medium">
                                      {displayFoodWasteLocation(location.name, lang)}
                                    </span>
                                    <span className="shrink-0 font-semibold">
                                      {formatAmount(location.total, lang)} · {formatDecimal(percentage, lang, 0)}%
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-amber-950/10 dark:bg-white/10">
                                    <div
                                      className="h-full rounded-full bg-amber-500"
                                      style={{ width: `${Math.max(percentage, 2)}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="relative mt-5 flex h-48 items-end gap-2 overflow-x-auto pb-2">
              {chart.points.length > 1 && chart.averageValue > 0 && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-10 border-t border-dashed border-gray-400/70 dark:border-white/40"
                  style={{ bottom: `${30 + (chart.averageValue / chart.maxValue) * 130}px` }}
                >
                  <span className="absolute right-0 -top-5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-[#0d3b3a]/90 dark:text-white/60">
                    {averageLabel} {formatAmount(chart.averageValue, lang)}
                  </span>
                </div>
              )}
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
          const guestsForActivePoint = chart.showGuestData
            ? getGuestsForDates(activePoint?.dates ?? [], buffetView)
            : 0
          const wastePerActiveGuest =
            guestsForActivePoint > 0 && activePoint
              ? activePoint.total / guestsForActivePoint
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
                className="mx-auto flex max-h-full w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#0d3b3a]"
              >
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/10 sm:px-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-nordic/70 dark:text-teal-100/70">
                      {lang === 'sv' ? 'Detaljerad graf' : lang === 'en' ? 'Detailed chart' : 'Detaljeret graf'}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{chart.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedChart(null)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                    aria-label={lang === 'sv' ? 'Stäng' : lang === 'en' ? 'Close' : 'Luk'}
                  >
                    <X size={21} />
                  </button>
                </div>

                {chart.kind === 'buffet' && (
                  <div className="grid grid-cols-4 gap-1 border-b border-black/5 bg-black/[0.02] p-2 dark:border-white/10 dark:bg-black/10 sm:px-7">
                    {(Object.keys(buffetViewLabels) as BuffetView[]).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => {
                          setBuffetView(view)
                          setSelectedPoint(null)
                        }}
                        className={`rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                          buffetView === view
                            ? 'bg-white text-nordic shadow-sm dark:bg-white/15 dark:text-white'
                            : 'text-gray-500 dark:text-white/55'
                        }`}
                      >
                        {buffetViewLabels[view]}
                      </button>
                    ))}
                  </div>
                )}

                {chart.kind === 'grinder' && (
                  <div className="grid grid-cols-4 gap-1 border-b border-black/5 bg-black/[0.02] p-2 dark:border-white/10 dark:bg-black/10 sm:px-7">
                    {(Object.keys(grinderViewLabels) as GrinderView[]).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => {
                          setGrinderView(view)
                          setSelectedPoint(null)
                        }}
                        className={`rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                          grinderView === view
                            ? 'bg-white text-nordic shadow-sm dark:bg-white/15 dark:text-white'
                            : 'text-gray-500 dark:text-white/55'
                        }`}
                      >
                        {grinderViewLabels[view]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,.9fr)]">
                  <div className="border-b border-black/5 p-5 dark:border-white/10 lg:border-b-0 lg:border-r sm:p-7">
                    <div className="relative flex h-[360px] items-end gap-3 overflow-x-auto pb-3">
                      {chart.points.length > 1 && chart.averageValue > 0 && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-dashed border-gray-400/70 dark:border-white/40"
                          style={{ bottom: `${45 + (chart.averageValue / chart.maxValue) * 250}px` }}
                        >
                          <span className="absolute right-0 -top-7 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-gray-600 shadow-sm dark:bg-[#0d3b3a] dark:text-white/70">
                            {averageLabel} {formatAmount(chart.averageValue, lang)}
                          </span>
                        </div>
                      )}
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
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-nordic/70 dark:text-teal-100/70">
                              {lang === 'sv' ? 'Fördelning' : lang === 'en' ? 'Breakdown' : 'Fordeling'}
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-nordic dark:text-white">
                              {activePoint.label}
                            </h3>
                          </div>
                          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                            difference > 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-200'
                              : difference < 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
                                : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/75'
                          }`}>
                            {Math.abs(difference).toLocaleString(
                              localeFor(lang),
                              { maximumFractionDigits: 0 }
                            )}% {difference >= 0
                              ? lang === 'sv' ? 'över snittet' : lang === 'en' ? 'above average' : 'over gennemsnittet'
                              : lang === 'sv' ? 'under snittet' : lang === 'en' ? 'below average' : 'under gennemsnittet'}
                          </span>
                        </div>

                        {chart.showGuestData && (
                          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-amber-500/15 bg-amber-50 p-3 text-center dark:bg-amber-400/10">
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-white/55">{t.buffetWaste}</p>
                              <p className="mt-1 font-semibold">{formatAmount(activePoint.total, lang)}</p>
                            </div>
                            <div className="border-x border-amber-500/15 px-1">
                              <p className="text-[10px] text-gray-500 dark:text-white/55">{t.guests}</p>
                              <p className="mt-1 font-semibold">
                                {buffetView === 'mess' && guestsForActivePoint > 0
                                  ? lang === 'en' ? 'Est. ' : lang === 'sv' ? 'Ca ' : 'Anslået '
                                  : ''}
                                {guestsForActivePoint > 0 ? formatNumber(guestsForActivePoint, lang) : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-white/55">{t.buffetKgPerGuest}</p>
                              <p className="mt-1 font-semibold">
                                {guestsForActivePoint > 0 ? formatPerGuestAmount(wastePerActiveGuest, lang) : '—'}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-6 space-y-5">
                          {breakdown.map((location) => {
                            const percentage = activePoint.total > 0
                              ? (location.total / activePoint.total) * 100
                              : 0

                            return (
                              <div key={location.name}>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="font-semibold">{displayFoodWasteLocation(location.name, lang)}</p>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-white/55">
                                      {lang === 'sv' ? 'Registrerat kl.' : lang === 'en' ? 'Registered at' : 'Registreret kl.'}{' '}
                                      {location.times.join(', ')}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-lg font-semibold text-nordic dark:text-teal-100">
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
                          <p className="mt-7 rounded-2xl bg-[#e7f1ef] p-4 text-sm leading-relaxed text-gray-700 dark:bg-white/10 dark:text-white/80">
                            {lang === 'sv' ? 'Största bidraget kom från' : lang === 'en' ? 'The largest contribution came from' : 'Det største bidrag kom fra'}{' '}
                            <strong>{largest.name}</strong>. {breakdown.length}{' '}
                            {lang === 'sv' ? 'stationer hade registreringar.' : lang === 'en' ? 'stations had entries.' : 'stationer havde registreringer.'}
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

      <aside className="fixed bottom-24 right-4 z-40 hidden lg:block xl:right-6">
        <div
          className={`overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl transition-[width] duration-300 dark:border-white/10 dark:bg-[#0d3b3a] ${
            guestPanelOpen ? 'w-96 max-w-[calc(100vw-2rem)]' : 'w-44'
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
              {missingGuestDates.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                  {missingGuestDates.length}
                </span>
              )}
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
                {missingGuestDates.length > 0 ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-50 p-3 dark:bg-amber-400/10">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                      {t.missingGuestDates}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {missingGuestDates.map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            setGuestDate(date)
                            setGuestMessage('')
                          }}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            guestDate === date
                              ? 'bg-amber-500 text-white'
                              : 'bg-white text-amber-800 hover:bg-amber-100 dark:bg-white/10 dark:text-amber-100 dark:hover:bg-white/15'
                          }`}
                        >
                          {formatDate(date, lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl bg-nordic-soft px-3 py-2 text-xs font-medium text-nordic">
                    {t.allGuestDatesComplete}
                  </p>
                )}
                <input
                  type="date"
                  value={guestDate}
                  onChange={(event) => setGuestDate(event.target.value)}
                  className="h-12 w-full rounded-xl border border-black/5 bg-gray-100 px-4 dark:border-white/10 dark:bg-[#082f2e]"
                />
                <fieldset className="grid gap-2 rounded-xl border border-black/5 bg-gray-50 p-3 dark:border-white/10 dark:bg-[#082f2e]">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-white/55">
                    {guestFieldText.morning}
                  </legend>
                  {[
                    ['Skagerak', skagerakMorningGuests, setSkagerakMorningGuests],
                    ['Commodore', commodoreMorningGuests, setCommodoreMorningGuests],
                  ].map(([label, value, setter]) => (
                    <label key={label as string} className="grid grid-cols-[1fr_6rem] items-center gap-3">
                      <span className="text-sm font-medium">{label as string}</span>
                      <input
                        inputMode="numeric"
                        value={value as string}
                        onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                        className="h-10 rounded-lg border border-black/5 bg-white px-3 text-right text-lg font-semibold dark:border-white/10 dark:bg-[#0d3b3a]"
                        placeholder="0"
                      />
                    </label>
                  ))}
                </fieldset>
                <fieldset className="grid gap-2 rounded-xl border border-black/5 bg-gray-50 p-3 dark:border-white/10 dark:bg-[#082f2e]">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-white/55">
                    {guestFieldText.evening}
                  </legend>
                  <label className="grid grid-cols-[1fr_6rem] items-center gap-3">
                    <span className="text-sm font-medium">Skagerak</span>
                    <input
                      inputMode="numeric"
                      value={skagerakEveningGuests}
                      onChange={(event) => setSkagerakEveningGuests(event.target.value)}
                      className="h-10 rounded-lg border border-black/5 bg-white px-3 text-right text-lg font-semibold dark:border-white/10 dark:bg-[#0d3b3a]"
                      placeholder="0"
                    />
                  </label>
                </fieldset>
                <label className="grid grid-cols-[1fr_6rem] items-center gap-3 rounded-xl border border-black/5 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-[#082f2e]">
                  <span className="text-sm font-medium">{guestFieldText.messPerMeal} <small className="block font-normal text-gray-500 dark:text-white/50">{guestFieldText.estimated}</small></span>
                  <input
                    inputMode="numeric"
                    value={messGuests}
                    onChange={(event) => setMessGuests(event.target.value)}
                    className="h-10 rounded-lg border border-black/5 bg-white px-3 text-right text-lg font-semibold dark:border-white/10 dark:bg-[#0d3b3a]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-nordic-soft px-3 py-2 text-sm">
                    <span className="block text-xs text-gray-500 dark:text-white/55">{guestFieldText.morningTotal}</span>
                    <strong className="text-lg text-nordic">{formatNumber((Number(skagerakMorningGuests) || 0) + (Number(commodoreMorningGuests) || 0), lang)}</strong>
                  </div>
                  <div className="rounded-xl bg-nordic-soft px-3 py-2 text-sm">
                    <span className="block text-xs text-gray-500 dark:text-white/55">{guestFieldText.eveningTotal}</span>
                    <strong className="text-lg text-nordic">{formatNumber(Number(skagerakEveningGuests) || 0, lang)}</strong>
                  </div>
                </div>
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
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{displayFoodWasteLocation(entry.location_name, lang)}</h3>
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





