'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { displayFoodWasteLocation, FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'
import {
  cacheFoodWasteEntries,
  readCachedFoodWasteEntries,
  readPendingFoodWasteEntries,
} from '@/lib/foodWasteOffline'
import { useTranslation } from '@/lib/LanguageContext'
import { queryString, secureFetch } from '@/lib/secureApi'
import { formatFoodWasteAmount } from '@/lib/formatFoodWasteAmount'

type FoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number | string
  comment: string | null
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatAmount(value: number, lang: string) {
  return formatFoodWasteAmount(value, lang)
}

function getEntryAmount(entry: FoodWasteEntry) {
  return Number(entry.quantity_kg) || 0
}

type Props = {
  vessel?: 'crown' | 'pearl'
  basePath?: string
}

type WasteArea = 'morning-buffet' | 'evening-buffet' | 'mess' | 'production'

const LOCATION_GROUPS = [
  {
    title: 'Morgenbuffet',
    slugs: [
      'skagerak-morgen-varmt',
      'skagerak-morgen-koldt',
      'commodore-morgen-varmt',
      'commodore-morgen-koldt',
    ],
  },
  {
    title: 'Aftenbuffet',
    slugs: [
      'skagerak-aften-boernebuffet',
      'skagerak-aften-koldt',
      'skagerak-aften-varmt',
      'skagerak-aften-oerne',
    ],
  },
  {
    title: 'Messen',
    slugs: [
      'messen-morgen-buffetspild',
      'messen-morgen-tallerkenspild',
      'messen-frokost-buffetspild',
      'messen-frokost-tallerkenspild',
      'messen-aften-buffetspild',
      'messen-aften-tallerkenspild',
    ],
  },
  {
    title: 'Produktion',
    slugs: [
      'produktion-main-galley',
      'produktion-skagerak-galley',
    ],
  },
  {
    title: 'Dæk 1',
    slugs: [
      'produktion-slagteri',
      'produktion-proviant-daek-1',
    ],
  },
]

function isLocationVisibleForVessel(locationName: string, vessel: 'crown' | 'pearl') {
  return vessel === 'crown' || !locationName.startsWith('Produktion ')
}

export default function FoodWastePage({
  vessel = 'crown',
  basePath = '/crown',
}: Props) {
  const { t, lang } = useTranslation()
  const router = useRouter()
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeArea, setActiveArea] = useState<WasteArea>('morning-buffet')
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)

  const today = getToday()

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`food-waste-area:${vessel}`)
      if (saved === 'morning-buffet' || saved === 'evening-buffet' || saved === 'mess' || saved === 'production') {
        setActiveArea(saved)
      } else if (saved === 'buffet') {
        setActiveArea('morning-buffet')
      }
    } catch {
      // Buffet remains the safe default if local storage is unavailable.
    }
  }, [vessel])

  function selectArea(area: WasteArea) {
    setActiveArea(area)
    try {
      window.localStorage.setItem(`food-waste-area:${vessel}`, area)
    } catch {
      // The selected tab still works for the current visit.
    }
  }

  const areaOrder: WasteArea[] = vessel === 'crown'
    ? ['morning-buffet', 'evening-buffet', 'mess', 'production']
    : ['morning-buffet', 'evening-buffet', 'mess']

  function finishAreaSwipe(clientX: number, clientY: number) {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start) return

    const deltaX = clientX - start.x
    const deltaY = clientY - start.y
    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return

    const currentIndex = areaOrder.indexOf(activeArea)
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
    if (nextIndex >= 0 && nextIndex < areaOrder.length) selectArea(areaOrder[nextIndex])
  }

  useEffect(() => {
    if (!navigator.onLine) return

    for (const group of LOCATION_GROUPS) {
      if (vessel !== 'crown' && group.title !== 'Morgenbuffet' && group.title !== 'Aftenbuffet' && group.title !== 'Messen') {
        continue
      }
      for (const slug of group.slugs) {
        router.prefetch(`${basePath}/food-waste/${slug}`)
      }
    }
    router.prefetch(`${basePath}/food-waste/overblik`)
  }, [basePath, router, vessel])

  useEffect(() => {
    let isCurrent = true

    async function loadEntries() {
      const cachedEntries = readCachedFoodWasteEntries(vessel)
      const pendingEntries = readPendingFoodWasteEntries(vessel)

      if (cachedEntries.length > 0 || pendingEntries.length > 0) {
        setEntries(
          [...pendingEntries, ...cachedEntries].filter((entry) =>
            isLocationVisibleForVessel(entry.location_name, vessel)
          )
        )
        setLoading(false)
      }

      let data: FoodWasteEntry[] = []
      let loadError: unknown = null
      try {
        const result = await secureFetch<{ data: FoodWasteEntry[] }>(
          `/api/food-waste/entries?${queryString({
            ship: vessel,
            from: today.slice(0, 7) + '-01',
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
        const nextEntries = data
        cacheFoodWasteEntries(nextEntries, vessel)
        setEntries(
          [...readPendingFoodWasteEntries(vessel), ...nextEntries].filter((entry) =>
            isLocationVisibleForVessel(entry.location_name, vessel)
          )
        )
      }

      setLoading(false)
    }

    void loadEntries()

    return () => {
      isCurrent = false
    }
  }, [today, vessel])

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        if (entry.waste_date === today) {
          acc.byLocation[entry.location_name] =
            (acc.byLocation[entry.location_name] ?? 0) + getEntryAmount(entry)
        }

        return acc
      },
      {
        byLocation: {} as Record<string, number>,
      }
    )
  }, [entries, today])

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8 pt-4 lg:max-w-7xl lg:pb-24 lg:pt-3">
      <header className="mb-6 flex flex-col items-center text-center lg:mb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t.foodWaste}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
            {t.foodWasteSubtitle}
          </p>
        </div>
      </header>

      {error && (
        <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <div className={`mx-auto mb-7 grid w-full max-w-2xl ${vessel === 'crown' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-1 rounded-2xl border border-black/5 bg-black/5 p-1.5 dark:border-white/10 dark:bg-black/20`}>
        {([
          { value: 'morning-buffet' as const, label: lang === 'en' ? 'Morning buffet' : lang === 'sv' ? 'Morgonbuffé' : 'Morgenbuffet' },
          { value: 'evening-buffet' as const, label: lang === 'en' ? 'Evening buffet' : lang === 'sv' ? 'Kvällsbuffé' : 'Aftenbuffet' },
          { value: 'mess' as const, label: lang === 'en' ? 'Crew mess' : lang === 'sv' ? 'Mässen' : 'Messen' },
          ...(vessel === 'crown'
            ? [{ value: 'production' as const, label: lang === 'en' ? 'Production' : 'Produktion' }]
            : []),
        ]).map((area) => (
          <button
            key={area.value}
            type="button"
            onClick={() => selectArea(area.value)}
            className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition active:scale-[0.98] ${
              activeArea === area.value
                ? 'bg-white text-[#064e4c] shadow-sm dark:bg-white/15 dark:text-white'
                : 'text-gray-500 hover:text-gray-800 dark:text-white/55 dark:hover:text-white'
            }`}
          >
            {area.label}
          </button>
        ))}
      </div>

      <div
        className="touch-pan-y space-y-9 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0"
        onTouchStart={(event) => {
          const touch = event.touches[0]
          swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0]
          if (touch) finishAreaSwipe(touch.clientX, touch.clientY)
        }}
      >
        {LOCATION_GROUPS
          .filter((group) => vessel === 'crown' || group.title === 'Morgenbuffet' || group.title === 'Aftenbuffet' || group.title === 'Messen')
          .filter((group) =>
            activeArea === 'morning-buffet'
              ? group.title === 'Morgenbuffet'
              : activeArea === 'evening-buffet'
                ? group.title === 'Aftenbuffet'
              : activeArea === 'mess'
                ? group.title === 'Messen'
                : group.title === 'Produktion' || group.title.startsWith('D')
          )
          .map((group) => (
          <section
            key={group.title}
            className={`${group.title === 'Morgenbuffet' || group.title === 'Aftenbuffet' || group.title === 'Messen' ? 'lg:col-span-2' : ''} lg:min-w-0 lg:rounded-3xl lg:border lg:border-black/5 lg:bg-white/65 lg:p-5 lg:shadow-sm lg:backdrop-blur-sm dark:lg:border-white/[0.12] dark:lg:bg-white/[0.045] dark:lg:shadow-[0_18px_45px_rgba(0,0,0,0.16)]`}
          >
            {(group.title === 'Produktion' || group.title.startsWith('D')) && (
            <div className="mb-4 flex items-center justify-center gap-4 lg:mb-4 lg:gap-3">
              <div className="h-px flex-1 bg-gradient-to-l from-gray-300/80 to-transparent dark:from-white/30" />
              <h2 className="shrink-0 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-white/70">
                {group.title === 'Produktion'
                  ? lang === 'en' ? 'Production' : lang === 'sv' ? 'Produktion' : 'Produktion'
                  : group.title === 'Messen'
                    ? lang === 'en' ? 'Crew mess' : lang === 'sv' ? 'Mässen' : 'Messen'
                    : group.title === 'DÃ¦k 1'
                      ? lang === 'en' ? 'Deck 1' : lang === 'sv' ? 'DÃ¤ck 1' : group.title
                      : group.title}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-300/80 to-transparent dark:from-white/30" />
            </div>
            )}

            {group.title === 'Morgenbuffet' || group.title === 'Aftenbuffet' ? (
              <div className={`grid gap-5 ${group.title === 'Morgenbuffet' ? 'lg:grid-cols-2' : ''}`}>
                {(group.title === 'Morgenbuffet'
                  ? [
                      { title: 'Skagerak', slugs: group.slugs.slice(0, 2) },
                      { title: 'Commodore', slugs: group.slugs.slice(2, 4) },
                    ]
                  : [{ title: lang === 'en' ? 'Evening' : lang === 'sv' ? 'Kväll' : 'Aften', slugs: group.slugs }]
                ).map((buffetGroup) => (
                  <div key={buffetGroup.title} className="rounded-2xl border border-black/5 bg-black/[0.025] p-3 dark:border-white/10 dark:bg-black/10">
                    <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-white/60">
                      {buffetGroup.title}
                    </h3>
                    <div className={`grid grid-cols-2 gap-3 ${group.title === 'Aftenbuffet' ? 'sm:grid-cols-4' : ''}`}>
                      {buffetGroup.slugs.map((slug) => {
                        const location = FOOD_WASTE_LOCATIONS.find((candidate) => candidate.slug === slug)
                        if (!location) return null
                        const todayAmount = totals.byLocation[location.name] ?? 0
                        const displayName = displayFoodWasteLocation(location.name, lang)
                        const label = displayName.split('·').pop()?.trim() || displayName.split(' ').pop() || displayName

                        return (
                          <Link
                            key={slug}
                            href={`${basePath}/food-waste/${slug}`}
                            className="flex h-[104px] min-w-0 items-center justify-center rounded-xl border border-gray-200/70 bg-white p-3 text-center text-gray-900 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] dark:border-white/[0.12] dark:bg-white/[0.055] dark:text-white"
                          >
                            <div className="flex h-full min-w-0 flex-col items-center justify-center gap-2">
                              <span className="text-[15px] font-semibold leading-tight">{label}</span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${todayAmount > 0 ? 'bg-emerald-400/20 text-emerald-600' : 'bg-gray-500/10 text-gray-500 dark:text-white/60'}`}>
                                {loading ? t.loadingShort : todayAmount > 0 ? formatAmount(todayAmount, lang) : t.zeroKgToday}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : group.title === 'Messen' ? (
              <div className="grid gap-5 lg:grid-cols-3">
                {[
                  { title: lang === 'en' ? 'Morning' : lang === 'sv' ? 'Morgon' : 'Morgen', slugs: group.slugs.slice(0, 2) },
                  { title: lang === 'en' ? 'Lunch' : lang === 'sv' ? 'Lunch' : 'Frokost', slugs: group.slugs.slice(2, 4) },
                  { title: lang === 'en' ? 'Evening' : lang === 'sv' ? 'Kväll' : 'Aften', slugs: group.slugs.slice(4, 6) },
                ].map((meal) => (
                  <div key={meal.title} className="rounded-2xl border border-black/5 bg-black/[0.025] p-3 dark:border-white/10 dark:bg-black/10">
                    <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-white/60">
                      {meal.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {meal.slugs.map((slug) => {
                        const location = FOOD_WASTE_LOCATIONS.find((candidate) => candidate.slug === slug)
                        if (!location) return null
                        const todayAmount = totals.byLocation[location.name] ?? 0
                        const isPlateWaste = location.name.endsWith('tallerkenspild')

                        return (
                          <Link
                            key={slug}
                            href={`${basePath}/food-waste/${slug}`}
                            className="flex h-[104px] min-w-0 items-center justify-center rounded-xl border border-gray-200/70 bg-white p-3 text-center text-gray-900 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] dark:border-white/[0.12] dark:bg-white/[0.055] dark:text-white"
                          >
                            <div className="flex h-full min-w-0 flex-col items-center justify-center gap-2">
                              <span className="text-[15px] font-semibold leading-tight">
                                {isPlateWaste
                                  ? lang === 'en' ? 'Plate waste' : lang === 'sv' ? 'Tallrikssvinn' : 'Tallerkenspild'
                                  : lang === 'en' ? 'Buffet waste' : lang === 'sv' ? 'Buffésvinn' : 'Buffetspild'}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${todayAmount > 0 ? 'bg-emerald-400/20 text-emerald-600' : 'bg-gray-500/10 text-gray-500 dark:text-white/60'}`}>
                                {loading ? t.loadingShort : todayAmount > 0 ? formatAmount(todayAmount, lang) : t.zeroKgToday}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div
              className={`
                -mx-4 flex snap-x snap-mandatory gap-4
                overflow-x-auto px-4 pb-3
                [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5
                sm:overflow-visible sm:px-0 sm:pb-0
                ${group.slugs.length === 2 ? 'lg:grid-cols-2' : group.slugs.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}
                lg:gap-4
              `}
            >
              {group.slugs.map((slug) => {
                const location = FOOD_WASTE_LOCATIONS.find(
                  (candidate) => candidate.slug === slug
                )

                if (!location) return null

                const todayAmount = totals.byLocation[location.name] ?? 0
                const displayName = displayFoodWasteLocation(location.name, lang)
                const mealNameParts = displayName.split(' ')
                const mealName = mealNameParts.pop() ?? ''
                const stationName = mealNameParts.join(' ')

                return (
                  <Link
                    key={location.slug}
                    href={`${basePath}/food-waste/${location.slug}`}
                    className="
                      rounded-xl
                      p-4
                      h-[112px]
                      min-w-[85%]
                      snap-start
                      flex items-center justify-center
                      bg-white
                      border border-gray-200/70
                      text-center
                      text-gray-900
                      shadow-sm
                      transition-all duration-200
                      hover:shadow-md
                      hover:-translate-y-[1px]
                      active:scale-[0.98]
                      dark:bg-white/[0.055]
                      dark:border-white/[0.12]
                      dark:text-white
                      dark:shadow-[0_8px_24px_rgba(0,0,0,0.12)]
                      sm:min-w-0
                      lg:h-[112px]
                      lg:p-4
                    "
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <h3 className="flex min-h-10 flex-col items-center justify-center text-lg font-semibold leading-tight tracking-tight lg:text-[17px]">
                        {group.title === 'Produktion' ? (
                          <>
                            <span className="block">Produktion</span>
                            <span className="block">
                              {displayName.replace(/^(Produktion|Production)\s+/, '')}
                            </span>
                          </>
                        ) : group.title === 'Morgenbuffet' || group.title === 'Aftenbuffet' ? (
                          <>
                            <span className="block">{stationName}</span>
                            <span className="block">{mealName}</span>
                          </>
                        ) : (
                          displayName
                        )}
                      </h3>
                      <span
                        className={`
                          px-3 py-1
                          text-xs font-medium
                          rounded-full
                          ${
                            todayAmount > 0
                              ? 'bg-emerald-400/20 text-emerald-600'
                              : 'bg-gray-500/10 text-gray-500 dark:text-white/60'
                          }
                        `}
                      >
                        {loading
                          ? t.loadingShort
                          : todayAmount > 0
                            ? formatAmount(todayAmount, lang)
                            : t.zeroKgToday}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>}
          </section>
          ))}
      </div>
    </main>
  )
}
