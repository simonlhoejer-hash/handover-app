'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { displayFoodWasteLocation, FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'
import {
  cacheFoodWasteEntries,
  readCachedFoodWasteEntries,
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

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatAmount(value: number, lang: string) {
  return `${value.toLocaleString(localeFor(lang), {
    maximumFractionDigits: 2,
  })} kg`
}

function getEntryAmount(entry: FoodWasteEntry) {
  return Number(entry.quantity_kg) || 0
}

type Props = {
  vessel?: 'crown' | 'pearl'
  basePath?: string
}

const LOCATION_GROUPS = [
  {
    title: 'Buffet',
    slugs: ['skagerak-morgen', 'commodore-morgen', 'skagerak-aften'],
  },
  {
    title: 'Messen',
    slugs: ['messen-morgen', 'messen-frokost', 'messen-aften'],
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
      'produktion-bageri',
      'produktion-slagteri',
      'produktion-proviant-daek-1',
    ],
  },
]

export default function FoodWastePage({
  vessel = 'crown',
  basePath = '/crown',
}: Props) {
  const { t, lang } = useTranslation()
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = getToday()

  useEffect(() => {
    let isCurrent = true

    async function loadEntries() {
      const cachedEntries = readCachedFoodWasteEntries(vessel)
      const pendingEntries = readPendingFoodWasteEntries(vessel)

      if (cachedEntries.length > 0 || pendingEntries.length > 0) {
        setEntries([...pendingEntries, ...cachedEntries])
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
        setError(t.offlineShowingCached)
      } else {
        setError('')
        const nextEntries = data
        cacheFoodWasteEntries(nextEntries, vessel)
        setEntries([...readPendingFoodWasteEntries(vessel), ...nextEntries])
      }

      setLoading(false)
    }

    void loadEntries()

    return () => {
      isCurrent = false
    }
  }, [t.offlineShowingCached, today, vessel])

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

      <div className="space-y-9 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
        {LOCATION_GROUPS.map((group) => (
          <section
            key={group.title}
            className="lg:min-w-0 lg:rounded-3xl lg:border lg:border-black/5 lg:bg-white/65 lg:p-5 lg:shadow-sm lg:backdrop-blur-sm dark:lg:border-white/[0.12] dark:lg:bg-white/[0.045] dark:lg:shadow-[0_18px_45px_rgba(0,0,0,0.16)]"
          >
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

            <div
              className={`
                -mx-4 flex snap-x snap-mandatory gap-4
                overflow-x-auto px-4 pb-3
                [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5
                sm:overflow-visible sm:px-0 sm:pb-0
                ${group.slugs.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}
                lg:gap-4
              `}
            >
              {group.slugs.map((slug) => {
                const location = FOOD_WASTE_LOCATIONS.find(
                  (candidate) => candidate.slug === slug
                )

                if (!location) return null

                const todayAmount = totals.byLocation[location.name] ?? 0

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
                      <h3 className="flex min-h-10 items-center justify-center text-lg font-semibold leading-tight tracking-tight lg:text-[17px]">
                        {group.title === 'Produktion' ? (
                          <>
                            <span className="block">Produktion</span>
                            <span className="block">
                              {displayFoodWasteLocation(location.name, lang).replace(/^(Produktion|Production)\s+/, '')}
                            </span>
                          </>
                        ) : (
                          displayFoodWasteLocation(location.name, lang)
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
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
