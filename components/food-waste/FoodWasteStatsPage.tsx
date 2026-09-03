'use client'

import { ChevronDown, Download, Maximize2, Printer, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Row, Worksheet } from 'exceljs'
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
  breakfast_guests?: number | null
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

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getWeekRange(dateString: string) {
  const monday = parseLocalDate(dateString)
  const daysSinceMonday = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - daysSinceMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    from: formatLocalDate(monday),
    to: formatLocalDate(sunday),
  }
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
  breakfastGuests: number
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
    const legacyBreakfast = (Number(value.skagerakMorning) || 0) + (Number(value.commodoreMorning) || 0)
    return {
      type: 'guest_breakdown',
      breakfastGuests: value.breakfastGuests == null
        ? legacyBreakfast
        : Number(value.breakfastGuests) || 0,
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
    guest.breakfast_guests != null ||
    guest.skagerak_morning != null ||
    guest.commodore_morning != null ||
    guest.skagerak_evening != null ||
    guest.mess_guests != null
  ) {
    return {
      type: 'guest_breakdown',
      breakfastGuests: guest.breakfast_guests == null
        ? (Number(guest.skagerak_morning) || 0) + (Number(guest.commodore_morning) || 0)
        : Number(guest.breakfast_guests) || 0,
      skagerakMorning: Number(guest.skagerak_morning) || 0,
      commodoreMorning: Number(guest.commodore_morning) || 0,
      skagerakEvening: Number(guest.skagerak_evening) || 0,
      messGuests: Number(guest.mess_guests) || 160,
    }
  }
  return parseGuestBreakdown(guest.comment)
}

type BuffetView = 'all' | 'morning' | 'evening' | 'mess'
type MessView = 'all' | 'morning' | 'lunch' | 'evening'
type GrinderView = 'all' | 'buffet' | 'production' | 'deck'

function isBuffetLocationForView(name: string, view: BuffetView) {
  if (view === 'morning') return name === 'Skagerak morgen' || name === 'Commodore morgen'
  if (view === 'evening') return name === 'Skagerak aften'
  if (view === 'mess') return name.startsWith('Messen ')
  return !name.startsWith('Produktion ')
}

function getMonthComparisonRange(dateString: string) {
  const currentDate = parseLocalDate(dateString)
  const currentFrom = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const previousFrom = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
  const previousTo = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)

  return {
    currentFrom: formatLocalDate(currentFrom),
    currentTo: dateString,
    previousFrom: formatLocalDate(previousFrom),
    previousTo: formatLocalDate(previousTo),
  }
}

function isMessLocationForView(name: string, view: MessView) {
  if (view === 'morning') return name === 'Messen morgen'
  if (view === 'lunch') return name === 'Messen frokost'
  if (view === 'evening') return name === 'Messen aften'
  return name.startsWith('Messen ')
}

function isGrinderLocationForView(name: string, view: GrinderView) {
  if (view === 'buffet') return !name.startsWith('Produktion ')
  if (view === 'production') {
    return name === 'Produktion Varm Galley' || name === 'Produktion Main Galley' || name === 'Produktion Skagerak Galley'
  }
  if (view === 'deck') {
    return name === 'Produktion Slagteri' || name === 'Produktion Proviant'
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

function getDatesInRange(fromDate: string, toDate: string) {
  const dates: string[] = []
  const current = parseLocalDate(fromDate)
  const last = parseLocalDate(toDate)

  while (current <= last) {
    dates.push(formatLocalDate(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function getEntryAmount(entry: FoodWasteEntry) {
  return Number(entry.quantity_kg) || 0
}

function isEntryVisibleForVessel(entry: FoodWasteEntry, vessel: 'crown' | 'pearl') {
  return vessel === 'crown' || !entry.location_name.startsWith('Produktion ')
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
  const initialWeek = getWeekRange(today)

  const [fromDate, setFromDate] = useState(initialWeek.from)
  const [toDate, setToDate] = useState(initialWeek.to)
  const automaticWeekRef = useRef(true)
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [comparisonEntries, setComparisonEntries] = useState<FoodWasteEntry[]>([])
  const [comparisonLoaded, setComparisonLoaded] = useState(false)
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([])
  const [guestDate, setGuestDate] = useState(today)
  const [breakfastGuests, setBreakfastGuests] = useState('')
  const [skagerakEveningGuests, setSkagerakEveningGuests] = useState('')
  const [messGuests, setMessGuests] = useState('160')
  const [buffetView, setBuffetView] = useState<BuffetView>('all')
  const [messView, setMessView] = useState<MessView>('all')
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
    function refreshAutomaticWeek() {
      if (!automaticWeekRef.current) return

      const week = getWeekRange(getToday())
      setFromDate(week.from)
      setToDate(week.to)
    }

    const interval = window.setInterval(refreshAutomaticWeek, 60_000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshAutomaticWeek()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

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
            (entry) =>
              entry.waste_date >= fromDate &&
              entry.waste_date <= toDate &&
              isEntryVisibleForVessel(entry, vessel)
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
            (entry) =>
              entry.waste_date >= fromDate &&
              entry.waste_date <= toDate &&
              isEntryVisibleForVessel(entry, vessel)
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
    let isCurrent = true
    const range = getMonthComparisonRange(today)
    const cached = readCachedFoodWasteEntries(vessel).filter(
      (entry) =>
        entry.waste_date >= range.previousFrom &&
        entry.waste_date <= range.currentTo &&
        isEntryVisibleForVessel(entry, vessel)
    )
    setComparisonEntries(cached)
    setComparisonLoaded(cached.length > 0)

    secureFetch<{ data: FoodWasteEntry[] }>(
      `/api/food-waste/entries?${queryString({
        ship: vessel,
        from: range.previousFrom,
        to: range.currentTo,
        limit: 2000,
      })}`
    )
      .then((result) => {
        if (!isCurrent) return
        cacheFoodWasteEntries(result.data, vessel)
        setComparisonEntries(result.data.filter((entry) => isEntryVisibleForVessel(entry, vessel)))
        setComparisonLoaded(true)
      })
      .catch(() => {
        if (isCurrent) setComparisonLoaded(true)
      })

    return () => {
      isCurrent = false
    }
  }, [today, vessel])

  useEffect(() => {
    const clearPrintTarget = () => {
      if (document.documentElement.dataset.printFoodWaste === 'true') {
        delete document.documentElement.dataset.printFoodWaste
      }
      document.getElementById('food-waste-print-root')?.remove()
    }

    window.addEventListener('afterprint', clearPrintTarget)
    return () => {
      window.removeEventListener('afterprint', clearPrintTarget)
      clearPrintTarget()
    }
  }, [])

  useEffect(() => {
    const saved = guestCounts.find((guest) => guest.service_date === guestDate)
    const breakdown = getGuestBreakdown(saved)
    setBreakfastGuests(breakdown ? String(breakdown.breakfastGuests || '') : '')
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
    const messViews: Record<MessView, WasteCategoryStats> = {
      all: buffetViews.mess,
      morning: buildCategoryStats(
        entries.filter((entry) => isMessLocationForView(entry.location_name, 'morning')),
        buffetNames.filter((name) => isMessLocationForView(name, 'morning'))
      ),
      lunch: buildCategoryStats(
        entries.filter((entry) => isMessLocationForView(entry.location_name, 'lunch')),
        buffetNames.filter((name) => isMessLocationForView(name, 'lunch'))
      ),
      evening: buildCategoryStats(
        entries.filter((entry) => isMessLocationForView(entry.location_name, 'evening')),
        buffetNames.filter((name) => isMessLocationForView(name, 'evening'))
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
      messViews,
      production,
      grinder,
      grinderViews,
      guestsTotal,
      kgPerGuest: guestsTotal > 0 ? buffet.totalKg / guestsTotal : 0,
    }
  }, [entries, fromDate, guestCounts, lang, t.week, toDate])

  function getGuestsForDates(dates: string[], view: BuffetView, activeMessView = messView) {
    const selectedDates = new Set(dates)

    if (view === 'mess') {
      const servicesByDate = new Map<string, Set<string>>()
      for (const entry of entries) {
        if (
          !selectedDates.has(entry.waste_date) ||
          !isMessLocationForView(entry.location_name, activeMessView)
        ) continue
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
          ? breakdown.breakfastGuests
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
      breakfastGuests: Number(breakfastGuests) || 0,
      skagerakMorning: Number(breakfastGuests) || 0,
      commodoreMorning: 0,
      skagerakEvening: Number(skagerakEveningGuests) || 0,
      messGuests: Number(messGuests) || 0,
    }
    const morningTotal = breakdown.breakfastGuests
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
          breakfast_guests: breakdown.breakfastGuests,
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
    setError('')

    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'HandoverPro'
      workbook.created = new Date()
      workbook.subject = `${vessel === 'crown' ? 'Nordic Crown' : 'Nordic Pearl'} food waste`

      const darkGreen = '064E4C'
      const teal = '3B8A84'
      const paleTeal = 'E7F1EF'
      const amber = 'F59E0B'
      const paleAmber = 'FFF7E6'
      const white = 'FFFFFF'
      const slate = '334155'
      const lightBorder = 'DCE5E3'
      const shipName = vessel === 'crown' ? 'Nordic Crown' : 'Nordic Pearl'
      const allDates = getDatesInRange(fromDate, toDate)
      const allLocations = FOOD_WASTE_LOCATIONS.filter(
        (location) => vessel === 'crown' || !location.name.startsWith('Produktion ')
      )
      const entriesForDate = (date: string) => entries.filter((entry) => entry.waste_date === date)
      const locationTotal = (dateEntries: FoodWasteEntry[], name: string) =>
        dateEntries.reduce(
          (total, entry) => total + (entry.location_name === name ? getEntryAmount(entry) : 0),
          0
        )

      const dailyRows = allDates.map((date) => {
        const dayEntries = entriesForDate(date)
        const guest = guestCounts.find((count) => count.service_date === date)
        const guestBreakdown = getGuestBreakdown(guest)
        const buffetKg = dayEntries.reduce(
          (total, entry) => total + (entry.location_name.startsWith('Produktion ') ? 0 : getEntryAmount(entry)),
          0
        )
        const grinderKg = dayEntries.reduce((total, entry) => total + getEntryAmount(entry), 0)
        const guestTotal = guest?.guest_count ?? 0
        const messGuestsForMeal = guestBreakdown?.messGuests ?? 160

        return [
          parseLocalDate(date),
          buffetKg,
          vessel === 'crown' ? grinderKg : null,
          guestTotal || null,
          guestTotal > 0 ? (buffetKg * 1000) / guestTotal : null,
          guestBreakdown?.breakfastGuests ?? null,
          guestBreakdown?.skagerakEvening ?? null,
          messGuestsForMeal,
          ...allLocations.map((location) => locationTotal(dayEntries, location.name)),
          ...['Messen morgen', 'Messen frokost', 'Messen aften'].map((name) => {
            const kg = locationTotal(dayEntries, name)
            return messGuestsForMeal > 0 ? (kg * 1000) / messGuestsForMeal : null
          }),
        ]
      })

      const styleTitle = (sheet: Worksheet, range: string, text: string) => {
        sheet.mergeCells(range)
        const cell = sheet.getCell(range.split(':')[0])
        cell.value = text
        cell.font = { name: 'Aptos Display', size: 22, bold: true, color: { argb: white } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkGreen } }
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
      const styleHeader = (row: Row, fill = darkGreen) => {
        row.height = 28
        row.eachCell((cell) => {
          cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: white } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
          cell.border = { bottom: { style: 'thin', color: { argb: lightBorder } } }
        })
      }
      const addTableStyle = (sheet: Worksheet, headerRow: number, lastRow: number, lastColumn: number) => {
        styleHeader(sheet.getRow(headerRow))
        for (let rowNumber = headerRow + 1; rowNumber <= lastRow; rowNumber += 1) {
          const row = sheet.getRow(rowNumber)
          row.height = 22
          if ((rowNumber - headerRow) % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F8F7' } }
            })
          }
          for (let column = 1; column <= lastColumn; column += 1) {
            row.getCell(column).border = { bottom: { style: 'hair', color: { argb: lightBorder } } }
          }
        }
      }

      const dashboard = workbook.addWorksheet(lang === 'en' ? 'Presentation' : lang === 'sv' ? 'Presentation' : 'Præsentation', {
        views: [{ showGridLines: false }],
        properties: { defaultRowHeight: 20 },
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
      })
      dashboard.columns = Array.from({ length: 16 }, () => ({ width: 11 }))
      styleTitle(dashboard, 'A1:P2', `${shipName} · ${t.foodWasteOverview}`)
      dashboard.getRow(1).height = 34
      dashboard.getRow(2).height = 18
      dashboard.mergeCells('A3:P3')
      dashboard.getCell('A3').value = `${t.periodFrom}: ${formatDate(fromDate, lang)}  ·  ${t.periodTo}: ${formatDate(toDate, lang)}`
      dashboard.getCell('A3').font = { italic: true, color: { argb: '64748B' } }
      dashboard.getCell('A3').alignment = { horizontal: 'left' }

      const cards = [
        { range: 'A5:D7', label: t.buffetWaste, value: formatAmount(stats.buffet.totalKg, lang), fill: paleAmber, color: amber },
        { range: 'E5:H7', label: t.guests, value: formatNumber(stats.guestsTotal, lang), fill: paleAmber, color: amber },
        { range: 'I5:L7', label: t.buffetKgPerGuest, value: formatPerGuestAmount(stats.kgPerGuest, lang), fill: paleTeal, color: darkGreen },
        { range: 'M5:P7', label: vessel === 'crown' ? t.productionWaste : t.averageKgPerDay, value: vessel === 'crown' ? formatAmount(stats.grinder.totalKg, lang) : formatAmount(stats.buffet.averagePerDay, lang), fill: paleTeal, color: darkGreen },
      ]
      cards.forEach((card) => {
        dashboard.mergeCells(card.range)
        const cell = dashboard.getCell(card.range.split(':')[0])
        cell.value = `${card.label}\n${card.value}`
        cell.font = { name: 'Aptos', size: 16, bold: true, color: { argb: card.color } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.fill } }
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
        cell.border = {
          top: { style: 'thin', color: { argb: lightBorder } },
          bottom: { style: 'thin', color: { argb: lightBorder } },
          left: { style: 'thin', color: { argb: lightBorder } },
          right: { style: 'thin', color: { argb: lightBorder } },
        }
      })

      const addDashboardBars = (
        startColumn: number,
        title: string,
        points: Array<{ label: string; total: number }>,
        color: string
      ) => {
        const endColumn = startColumn + 7
        dashboard.mergeCells(9, startColumn, 9, endColumn)
        const titleCell = dashboard.getCell(9, startColumn)
        titleCell.value = title
        titleCell.font = { name: 'Aptos Display', size: 14, bold: true, color: { argb: darkGreen } }
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

        const visiblePoints = points.slice(-14)
        const maxValue = Math.max(...visiblePoints.map((point) => point.total), 1)
        visiblePoints.forEach((point, index) => {
          const rowNumber = 10 + index
          dashboard.mergeCells(rowNumber, startColumn, rowNumber, startColumn + 1)
          dashboard.getCell(rowNumber, startColumn).value = point.label
          dashboard.getCell(rowNumber, startColumn).font = { name: 'Aptos', size: 9, color: { argb: slate } }

          const filledCells = point.total > 0 ? Math.max(1, Math.round((point.total / maxValue) * 4)) : 0
          for (let barIndex = 0; barIndex < 4; barIndex += 1) {
            const barCell = dashboard.getCell(rowNumber, startColumn + 2 + barIndex)
            barCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: barIndex < filledCells ? color : 'EDF2F1' },
            }
          }

          dashboard.mergeCells(rowNumber, startColumn + 6, rowNumber, endColumn)
          const valueCell = dashboard.getCell(rowNumber, startColumn + 6)
          valueCell.value = point.total
          valueCell.numFmt = '#,##0.0 "kg"'
          valueCell.font = { name: 'Aptos', size: 9, bold: true, color: { argb: darkGreen } }
          valueCell.alignment = { horizontal: 'right' }
        })
      }

      addDashboardBars(1, t.buffetDevelopment, stats.buffet.chartPoints, amber)
      const secondChartPoints = vessel === 'crown'
        ? stats.grinder.chartPoints
        : stats.buffet.locations.map((location) => ({ label: displayFoodWasteLocation(location.name, lang), total: location.total }))
      const secondChartTitle = vessel === 'crown' ? t.productionDevelopment : t.sheetPerLocation
      addDashboardBars(9, secondChartTitle, secondChartPoints, teal)
      dashboard.mergeCells('A25:P26')
      dashboard.getCell('A25').value = lang === 'en'
        ? 'Generated by HandoverPro. Use the “Day by day” sheet for the complete daily figures.'
        : lang === 'sv'
          ? 'Skapad av HandoverPro. Se fliken ”Dag för dag” för alla dagliga siffror.'
          : 'Genereret af HandoverPro. Se fanen “Dag for dag” for alle daglige tal.'
      dashboard.getCell('A25').font = { size: 10, italic: true, color: { argb: '64748B' } }
      dashboard.getCell('A25').alignment = { vertical: 'middle', wrapText: true }

      const daily = workbook.addWorksheet(lang === 'en' ? 'Day by day' : lang === 'sv' ? 'Dag för dag' : 'Dag for dag', {
        views: [{ state: 'frozen', ySplit: 4, xSplit: 1, showGridLines: false }],
      })
      const dailyHeaders = [
        t.date,
        t.buffetWaste,
        vessel === 'crown' ? t.productionWaste : null,
        t.guests,
        t.buffetKgPerGuest,
        guestFieldText.breakfastTotal,
        'Skagerak aften',
        guestFieldText.messPerMeal,
        ...allLocations.map((location) => displayFoodWasteLocation(location.name, lang)),
        'Messen morgen · g pr. gæst',
        'Messen frokost · g pr. gæst',
        'Messen aften · g pr. gæst',
      ].filter((header): header is string => Boolean(header))
      const normalizedDailyRows = dailyRows.map((row) => vessel === 'crown' ? row : row.filter((_, index) => index !== 2))
      styleTitle(daily, `A1:${daily.getColumn(dailyHeaders.length).letter}2`, `${shipName} · ${lang === 'en' ? 'Daily overview' : lang === 'sv' ? 'Daglig översikt' : 'Daglig oversigt'}`)
      daily.getRow(3).values = dailyHeaders
      normalizedDailyRows.forEach((row) => daily.addRow(row))
      addTableStyle(daily, 3, daily.rowCount, dailyHeaders.length)
      daily.autoFilter = { from: { row: 3, column: 1 }, to: { row: daily.rowCount, column: dailyHeaders.length } }
      daily.getColumn(1).numFmt = 'dd-mmm-yyyy'
      daily.getColumn(1).width = 15
      for (let column = 2; column <= dailyHeaders.length; column += 1) {
        daily.getColumn(column).width = column <= 8 ? 16 : 20
        daily.getColumn(column).numFmt = column === 4 || column === 6 || column === 7 || column === 8 ? '#,##0' : '#,##0.0'
      }

      const locationsSheet = workbook.addWorksheet(t.sheetPerLocation, {
        views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
      })
      styleTitle(locationsSheet, 'A1:D2', `${shipName} · ${t.sheetPerLocation}`)
      locationsSheet.getRow(3).values = [t.category, t.location, t.kgInPeriod, t.averageKgPerDay]
      const locationRows = [
        ...stats.buffet.locations.map((location) => [t.buffetWaste, displayFoodWasteLocation(location.name, lang), location.total, location.averagePerDay]),
        ...(vessel === 'crown'
          ? stats.production.locations.map((location) => [t.productionAndDeckOne, displayFoodWasteLocation(location.name, lang), location.total, location.averagePerDay])
          : []),
      ]
      locationRows.forEach((row) => locationsSheet.addRow(row))
      addTableStyle(locationsSheet, 3, locationsSheet.rowCount, 4)
      locationsSheet.autoFilter = `A3:D${locationsSheet.rowCount}`
      locationsSheet.columns = [{ width: 24 }, { width: 32 }, { width: 18 }, { width: 22 }]
      locationsSheet.getColumn(3).numFmt = '#,##0.0'
      locationsSheet.getColumn(4).numFmt = '#,##0.0'

      const registrations = workbook.addWorksheet(t.sheetRegistrations, {
        views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
      })
      styleTitle(registrations, 'A1:F2', `${shipName} · ${t.sheetRegistrations}`)
      registrations.getRow(3).values = [t.date, t.location, t.category, t.kg, t.comment, t.created]
      entries
        .slice()
        .sort((a, b) => `${a.waste_date}${a.created_at}`.localeCompare(`${b.waste_date}${b.created_at}`))
        .forEach((entry) => registrations.addRow([
          parseLocalDate(entry.waste_date),
          displayFoodWasteLocation(entry.location_name, lang),
          entry.location_name.startsWith('Produktion ') ? t.productionAndDeckOne : t.buffetWaste,
          getEntryAmount(entry),
          entry.comment ?? '',
          new Date(entry.created_at),
        ]))
      addTableStyle(registrations, 3, registrations.rowCount, 6)
      registrations.autoFilter = `A3:F${registrations.rowCount}`
      registrations.columns = [{ width: 15 }, { width: 30 }, { width: 24 }, { width: 12 }, { width: 45 }, { width: 21 }]
      registrations.getColumn(1).numFmt = 'dd-mmm-yyyy'
      registrations.getColumn(4).numFmt = '#,##0.0'
      registrations.getColumn(6).numFmt = 'dd-mmm-yyyy hh:mm'
      registrations.getColumn(5).alignment = { wrapText: true, vertical: 'top' }

      const guestsSheet = workbook.addWorksheet(t.sheetGuests, {
        views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
      })
      styleTitle(guestsSheet, 'A1:F2', `${shipName} · ${t.sheetGuests}`)
      guestsSheet.getRow(3).values = [t.date, guestFieldText.breakfastTotal, 'Skagerak aften', guestFieldText.messPerMeal, t.guests, t.comment]
      guestCounts
        .slice()
        .sort((a, b) => a.service_date.localeCompare(b.service_date))
        .forEach((guest) => {
          const breakdown = getGuestBreakdown(guest)
          guestsSheet.addRow([
            parseLocalDate(guest.service_date),
            breakdown?.breakfastGuests ?? null,
            breakdown?.skagerakEvening ?? null,
            breakdown?.messGuests ?? null,
            guest.guest_count,
            '',
          ])
        })
      addTableStyle(guestsSheet, 3, guestsSheet.rowCount, 6)
      guestsSheet.autoFilter = `A3:F${guestsSheet.rowCount}`
      guestsSheet.columns = [{ width: 15 }, { width: 24 }, { width: 20 }, { width: 22 }, { width: 15 }, { width: 35 }]
      guestsSheet.getColumn(1).numFmt = 'dd-mmm-yyyy'
      for (let column = 2; column <= 5; column += 1) guestsSheet.getColumn(column).numFmt = '#,##0'

      workbook.worksheets.forEach((sheet) => {
        sheet.eachRow((row) => {
          row.eachCell((cell) => {
            if (!cell.font) cell.font = { name: 'Aptos', size: 10, color: { argb: slate } }
          })
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `HandoverPro-${vessel}-${fromDate}-til-${toDate}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      console.error(exportError)
      setError(lang === 'en' ? 'The Excel file could not be created.' : lang === 'sv' ? 'Excel-filen kunde inte skapas.' : 'Excel-filen kunne ikke oprettes.')
    } finally {
      setExporting(false)
    }
  }

  const activeBuffetStats = buffetView === 'mess'
    ? stats.messViews[messView]
    : stats.buffetViews[buffetView]
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
    ...(vessel === 'crown' ? [{
      title: t.productionDevelopment,
      kind: 'grinder' as const,
      points: activeGrinderStats.chartPoints,
      maxValue: maxProductionChartValue,
      averageValue: activeGrinderStats.chartPoints.reduce((sum, point) => sum + point.total, 0) / Math.max(activeGrinderStats.chartPoints.length, 1),
      barClass: 'bg-nordic',
      showGuestData: false,
      showEstimate: true,
    }] : []),
  ]

  const buffetViewLabels: Record<BuffetView, string> = lang === 'en'
    ? { all: 'Total', morning: 'Morning', evening: 'Evening', mess: 'Crew mess' }
    : lang === 'sv'
      ? { all: 'Totalt', morning: 'Morgon', evening: 'Kväll', mess: 'Mässen' }
      : { all: 'Samlet', morning: 'Morgen', evening: 'Aften', mess: 'Messen' }
  const messViewLabels: Record<MessView, string> = lang === 'en'
    ? { all: 'Total', morning: 'Breakfast', lunch: 'Lunch', evening: 'Dinner' }
    : lang === 'sv'
      ? { all: 'Totalt', morning: 'Frukost', lunch: 'Lunch', evening: 'Middag' }
      : { all: 'Samlet', morning: 'Morgen', lunch: 'Frokost', evening: 'Aften' }
  const activeBuffetLabel = buffetView === 'mess'
    ? `${buffetViewLabels.mess} · ${messViewLabels[messView]}`
    : buffetViewLabels[buffetView]
  const comparisonRange = getMonthComparisonRange(today)
  const comparableBuffetEntries = comparisonEntries.filter((entry) => {
    if (entry.location_name.startsWith('Produktion ')) return false
    if (!isBuffetLocationForView(entry.location_name, buffetView)) return false
    if (buffetView === 'mess' && !isMessLocationForView(entry.location_name, messView)) {
      return false
    }
    return true
  })
  const currentMonthTotal = comparableBuffetEntries
    .filter((entry) => entry.waste_date >= comparisonRange.currentFrom)
    .reduce((total, entry) => total + getEntryAmount(entry), 0)
  const previousMonthTotal = comparableBuffetEntries
    .filter(
      (entry) =>
        entry.waste_date >= comparisonRange.previousFrom &&
        entry.waste_date <= comparisonRange.previousTo
    )
    .reduce((total, entry) => total + getEntryAmount(entry), 0)
  const currentMonthAverage = currentMonthTotal / getDateRangeDays(
    comparisonRange.currentFrom,
    comparisonRange.currentTo
  )
  const previousMonthAverage = previousMonthTotal / getDateRangeDays(
    comparisonRange.previousFrom,
    comparisonRange.previousTo
  )
  const monthDifferencePercent = previousMonthAverage > 0
    ? ((currentMonthAverage - previousMonthAverage) / previousMonthAverage) * 100
    : null
  const grinderViewLabels: Record<GrinderView, string> = lang === 'en'
    ? { all: 'Total', buffet: 'Buffet', production: 'Production', deck: 'Deck 1' }
    : lang === 'sv'
      ? { all: 'Totalt', buffet: 'Buffé', production: 'Produktion', deck: 'Däck 1' }
      : { all: 'Samlet', buffet: 'Buffet', production: 'Produktion', deck: 'Dæk 1' }
  const guestFieldText = lang === 'en'
    ? { morning: 'Breakfast', breakfastTotal: 'Breakfast guests in total', evening: 'Evening', messPerMeal: 'Crew mess per meal', estimated: 'Estimated', morningTotal: 'Breakfast total', eveningTotal: 'Evening total' }
    : lang === 'sv'
      ? { morning: 'Frukost', breakfastTotal: 'Frukostgäster totalt', evening: 'Kväll', messPerMeal: 'Mässen per måltid', estimated: 'Uppskattat', morningTotal: 'Frukost totalt', eveningTotal: 'Kväll totalt' }
      : { morning: 'Morgenmad', breakfastTotal: 'Morgengæster i alt', evening: 'Aften', messPerMeal: 'Messen pr. måltid', estimated: 'Anslået', morningTotal: 'Morgen i alt', eveningTotal: 'Aften i alt' }
  const averageLabel = lang === 'en' ? 'Average' : lang === 'sv' ? 'Genomsnitt' : 'Gennemsnit'

  function getPointBreakdown(point: ChartPoint, kind: 'buffet' | 'grinder') {
    const selectedDates = new Set(point.dates)
    const totals = new Map<string, { total: number; times: Set<string>; comments: Set<string> }>()

    for (const entry of entries) {
      if (!selectedDates.has(entry.waste_date)) continue
      if (kind === 'buffet' && entry.location_name.startsWith('Produktion ')) {
        continue
      }
      if (kind === 'buffet' && !isBuffetLocationForView(entry.location_name, buffetView)) {
        continue
      }
      if (
        kind === 'buffet' &&
        buffetView === 'mess' &&
        !isMessLocationForView(entry.location_name, messView)
      ) {
        continue
      }
      if (kind === 'grinder' && !isGrinderLocationForView(entry.location_name, grinderView)) {
        continue
      }

      const current = totals.get(entry.location_name) ?? {
        total: 0,
        times: new Set<string>(),
        comments: new Set<string>(),
      }
      current.total += getEntryAmount(entry)
      current.times.add(formatTime(entry.created_at, lang))
      if (entry.comment?.trim()) current.comments.add(entry.comment.trim())
      totals.set(entry.location_name, current)
    }

    return Array.from(totals.entries())
      .map(([name, details]) => ({
        name,
        total: details.total,
        times: Array.from(details.times).sort(),
        comments: Array.from(details.comments),
      }))
      .filter((location) => location.total > 0)
      .sort((a, b) => b.total - a.total)
  }

  function getChartComments(points: ChartPoint[], kind: 'buffet' | 'grinder') {
    const selectedDates = new Set(points.flatMap((point) => point.dates))

    return entries
      .filter((entry) => {
        if (!entry.comment?.trim() || !selectedDates.has(entry.waste_date)) return false
        if (kind === 'buffet' && entry.location_name.startsWith('Produktion ')) return false
        if (kind === 'buffet' && !isBuffetLocationForView(entry.location_name, buffetView)) return false
        if (
          kind === 'buffet' &&
          buffetView === 'mess' &&
          !isMessLocationForView(entry.location_name, messView)
        ) return false
        if (kind === 'grinder' && !isGrinderLocationForView(entry.location_name, grinderView)) return false
        return true
      })
      .sort((a, b) =>
        `${b.waste_date}${b.created_at}`.localeCompare(`${a.waste_date}${a.created_at}`)
      )
  }

  function printCharts() {
    const charts = document.querySelectorAll<HTMLElement>('[data-food-waste-chart]')
    if (charts.length === 0) return

    document.getElementById('food-waste-print-root')?.remove()
    const printRoot = document.createElement('div')
    printRoot.id = 'food-waste-print-root'

    const heading = document.createElement('header')
    heading.className = 'food-waste-print-heading'
    const title = document.createElement('h1')
    title.textContent = t.foodWasteOverview
    const period = document.createElement('p')
    period.textContent = `${t.period}: ${formatDate(fromDate, lang)} – ${formatDate(toDate, lang)}`
    heading.append(title, period)
    printRoot.appendChild(heading)

    const grid = document.createElement('div')
    grid.className = 'food-waste-print-grid'
    charts.forEach((chart) => {
      const copy = chart.cloneNode(true) as HTMLElement
      copy.querySelectorAll('.food-waste-print-hidden').forEach((element) => element.remove())
      grid.appendChild(copy)
    })
    printRoot.appendChild(grid)
    document.body.appendChild(printRoot)

    document.documentElement.dataset.printFoodWaste = 'true'
    window.print()
  }

  return (
    <main className={`${vessel === 'pearl' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 pt-4 pb-24 space-y-6`}>
      {comparisonLoaded && (
        <aside className={`fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 min-[1800px]:left-6 min-[1800px]:w-64 ${
          vessel === 'pearl'
            ? 'w-64 min-[1800px]:block'
            : 'w-52 min-[1450px]:block min-[1800px]:w-64'
        }`}>
          <div className="overflow-hidden rounded-[28px] border border-amber-500/20 bg-white/95 p-4 shadow-[0_18px_45px_rgba(54,38,8,0.14)] backdrop-blur dark:border-amber-300/15 dark:bg-[#0d3b3a]/95 min-[1800px]:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
              {lang === 'en' ? 'Compared with last month' : lang === 'sv' ? 'Jämfört med förra månaden' : 'Sammenlignet med sidste måned'}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{activeBuffetLabel}</h2>

            <div className="mt-4 grid gap-3 min-[1800px]:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-3 dark:from-amber-400/15 dark:to-orange-400/5">
                <p className="text-xs text-gray-500 dark:text-white/55">
                  {lang === 'en' ? 'This month' : lang === 'sv' ? 'Denna månad' : 'Denne måned'}
                </p>
                <p className="mt-1 whitespace-nowrap text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-300">
                  {formatAmount(currentMonthAverage, lang)}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/55">
                  {lang === 'en' ? 'average per day' : lang === 'sv' ? 'genomsnitt per dag' : 'gennemsnit pr. dag'}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/70 px-3 py-3 text-left dark:border-white/10 dark:bg-white/5 min-[1800px]:text-right">
                <p className="text-xs text-gray-500 dark:text-white/55">
                  {lang === 'en' ? 'Last month' : lang === 'sv' ? 'Förra månaden' : 'Sidste måned'}
                </p>
                <p className="mt-1 whitespace-nowrap text-xl font-semibold text-gray-800 dark:text-white/85">
                  {previousMonthAverage > 0 ? formatAmount(previousMonthAverage, lang) : '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/55">
                  {lang === 'en' ? 'average per day' : lang === 'sv' ? 'genomsnitt per dag' : 'gennemsnit pr. dag'}
                </p>
              </div>
            </div>

            <div className={`mt-4 rounded-2xl px-3 py-3 ${
              monthDifferencePercent == null
                ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/65'
                : monthDifferencePercent <= 0
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'
                  : 'bg-orange-50 text-orange-800 dark:bg-orange-400/15 dark:text-orange-200'
            }`}>
              {monthDifferencePercent == null ? (
                <p className="text-xs font-medium leading-relaxed">
                  {lang === 'en' ? 'We are collecting data for the first comparison.' : lang === 'sv' ? 'Vi samlar data till den första jämförelsen.' : 'Vi samler data til den første sammenligning.'}
                </p>
              ) : (
                <>
                  <p className="text-2xl font-semibold">
                    {formatNumber(Math.abs(Math.round(monthDifferencePercent)), lang)}%
                  </p>
                  <p className="text-xs font-medium leading-relaxed">
                    {monthDifferencePercent <= 0
                      ? lang === 'en' ? 'less waste than last month' : lang === 'sv' ? 'mindre svinn än förra månaden' : 'mindre madspild end sidste måned'
                      : lang === 'en' ? 'more waste than last month' : lang === 'sv' ? 'mer svinn än förra månaden' : 'mere madspild end sidste måned'}
                  </p>
                </>
              )}
            </div>
          </div>
        </aside>
      )}
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t.foodWasteOverview}
        </h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-white/60">
          {vessel === 'pearl'
            ? lang === 'en'
              ? 'Compare buffet waste by service and period.'
              : lang === 'sv'
                ? 'Jämför buffésvinn per måltid och period.'
                : 'Sammenlign buffetspild pr. måltid og periode.'
            : t.foodWasteOverviewSubtitle}
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
            onChange={(event) => {
              automaticWeekRef.current = false
              setFromDate(event.target.value)
            }}
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
            onChange={(event) => {
              automaticWeekRef.current = false
              setToDate(event.target.value)
            }}
            className="h-12 w-full rounded-2xl bg-white px-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10"
          />
        </label>
      </section>

      <section className={`grid gap-3 ${vessel === 'crown' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-white/60">{t.buffetWaste}</p>
          <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.buffet.totalKg, lang)}</div>
        </div>

        {vessel === 'crown' && (
          <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#0d3b3a] dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-white/60">{t.productionWaste}</p>
            <div className="mt-2 text-2xl font-semibold">{formatAmount(stats.grinder.totalKg, lang)}</div>
          </div>
        )}
      </section>

      <section className={`grid gap-6 ${vessel === 'crown' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {chartConfigs.map((chart) => (
          <div
            key={chart.title}
            data-food-waste-chart
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
                  className="food-waste-print-hidden flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-gray-600 transition hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
                  aria-label={lang === 'sv' ? 'Förstora graf' : lang === 'en' ? 'Enlarge chart' : 'Forstør graf'}
                >
                  <Maximize2 size={17} />
                </button>
              </div>
            </div>

            {chart.kind === 'buffet' && (
              <div className="food-waste-print-hidden mt-4 grid grid-cols-4 gap-1 rounded-xl bg-black/5 p-1 dark:bg-black/20">
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

            {chart.kind === 'buffet' && buffetView === 'mess' && (
              <div className="food-waste-print-hidden mt-2 grid grid-cols-4 gap-1 rounded-xl border border-amber-500/15 bg-amber-50/70 p-1 dark:bg-amber-400/10">
                {(Object.keys(messViewLabels) as MessView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => {
                      setMessView(view)
                      setSelectedPoint(null)
                    }}
                    className={`min-w-0 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                      messView === view
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-amber-900/65 hover:text-amber-950 dark:text-amber-100/60 dark:hover:text-amber-100'
                    }`}
                  >
                    {messViewLabels[view]}
                  </button>
                ))}
              </div>
            )}

            {chart.kind === 'grinder' && (
              <div className="food-waste-print-hidden mt-4 grid grid-cols-4 gap-1 rounded-xl bg-black/5 p-1 dark:bg-black/20">
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
                <div className="rounded-xl border border-teal-500/10 bg-teal-50 px-3 py-2 dark:border-teal-300/10 dark:bg-teal-300/10">
                  <p className="text-[11px] text-gray-500 dark:text-white/60">
                    {t.estimatedContainerEquivalent}
                  </p>
                  <p className="mt-1 font-semibold text-teal-800 dark:text-teal-200">
                    {formatDecimal(estimatedContainers, lang)} {t.containerShort}
                  </p>
                </div>
                <div className="rounded-xl border border-teal-500/10 bg-teal-50 px-3 py-2 dark:border-teal-300/10 dark:bg-teal-300/10">
                  <p className="text-[11px] text-gray-500 dark:text-white/60">
                    {t.estimatedRenovationSavings}
                  </p>
                  <p className="mt-1 font-semibold text-teal-800 dark:text-teal-200">
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
                                  {location.comments.map((comment) => (
                                    <p
                                      key={comment}
                                      className="mt-1.5 rounded-lg bg-white/70 px-2 py-1.5 text-[11px] italic text-amber-950/75 dark:bg-black/15 dark:text-amber-100/75"
                                    >
                                      “{comment}”
                                    </p>
                                  ))}
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

            <div className="relative mt-5 h-48">
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
              <div className="food-waste-print-bars flex h-full items-end gap-2 overflow-x-auto pb-2">
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
                  className={`group flex h-full min-w-16 flex-col items-center justify-end gap-2 rounded-xl px-1 transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-nordic/30 dark:hover:bg-white/5 ${
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
                  <span className="h-4 whitespace-nowrap text-xs leading-4 text-gray-500 dark:text-white/60">
                    {point.label}
                  </span>
                </button>
              ))}
              </div>
            </div>

            {getChartComments(chart.points, chart.kind).length > 0 && (
              <div className="food-waste-print-hidden mt-4 border-t border-black/5 pt-4 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-white/55">
                  {lang === 'en' ? 'Comments by day' : lang === 'sv' ? 'Kommentarer per dag' : 'Kommentarer under dagene'}
                </p>
                <div className="mt-3 space-y-2">
                  {getChartComments(chart.points, chart.kind).map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-amber-500/15 bg-amber-50 px-3 py-2.5 text-sm dark:bg-amber-400/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-amber-950 dark:text-amber-100">
                          {parseLocalDate(entry.waste_date).toLocaleDateString(localeFor(lang), {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-xs text-amber-900/60 dark:text-amber-100/60">
                          {displayFoodWasteLocation(entry.location_name, lang)}
                        </span>
                      </div>
                      <p className="mt-1 text-amber-950/80 dark:text-amber-100/80">
                        {entry.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

                {chart.kind === 'buffet' && buffetView === 'mess' && (
                  <div className="grid grid-cols-4 gap-1 border-b border-amber-500/15 bg-amber-50/70 p-2 dark:bg-amber-400/10 sm:px-7">
                    {(Object.keys(messViewLabels) as MessView[]).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => {
                          setMessView(view)
                          setSelectedPoint(null)
                        }}
                        className={`rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                          messView === view
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-amber-900/65 dark:text-amber-100/60'
                        }`}
                      >
                        {messViewLabels[view]}
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
                    <div className="relative h-[360px]">
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
                      <div className="flex h-full items-end gap-3 overflow-x-auto pb-3">
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
                          <span className="h-7 whitespace-nowrap pb-2 text-sm leading-5 text-gray-500 dark:text-white/60">
                            {point.label}
                          </span>
                        </button>
                      ))}
                      </div>
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
                                {location.comments.map((comment) => (
                                  <div
                                    key={comment}
                                    className="mt-3 rounded-xl border border-amber-500/15 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-400/10 dark:text-amber-100"
                                  >
                                    <span className="mr-1 font-semibold">
                                      {lang === 'en' ? 'Reason:' : lang === 'sv' ? 'Orsak:' : 'Årsag:'}
                                    </span>
                                    {comment}
                                  </div>
                                ))}
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
                  <label className="grid grid-cols-[1fr_6rem] items-center gap-3">
                    <span className="text-sm font-medium">{guestFieldText.breakfastTotal}</span>
                    <input
                      inputMode="numeric"
                      value={breakfastGuests}
                      onChange={(event) => setBreakfastGuests(event.target.value)}
                      className="h-10 rounded-lg border border-black/5 bg-white px-3 text-right text-lg font-semibold dark:border-white/10 dark:bg-[#0d3b3a]"
                      placeholder="0"
                    />
                  </label>
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
                    <strong className="text-lg text-nordic">{formatNumber(Number(breakfastGuests) || 0, lang)}</strong>
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

      <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={printCharts}
          disabled={loading || chartConfigs.every((chart) => chart.points.length === 0)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-6 font-semibold text-gray-800 shadow-sm transition active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white sm:w-auto"
        >
          <Printer size={18} />
          {lang === 'en' ? 'Print charts' : lang === 'sv' ? 'Skriv ut grafer' : 'Print grafer'}
        </button>
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





