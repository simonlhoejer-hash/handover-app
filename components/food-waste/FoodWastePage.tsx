'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FOOD_WASTE_LOCATIONS } from '@/lib/foodWasteLocations'
import {
  cacheFoodWasteEntries,
  readCachedFoodWasteEntries,
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

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatAmount(value: number, lang: string) {
  return `${value.toLocaleString(lang === 'sv' ? 'sv-SE' : 'da-DK', {
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
    title: 'Skagerak & Commodore',
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
      'produktion-kold-galley',
      'produktion-bageri',
      'produktion-slagteri',
      'produktion-proviant-daek-1',
    ],
  },
]

export default function FoodWastePage({
  vessel = 'crown',
  basePath = '/galley',
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

      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .eq('vessel', vessel)
        .gte('waste_date', today.slice(0, 7) + '-01')
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (!isCurrent) return

      if (loadError) {
        setError(t.offlineShowingCached)
      } else {
        setError('')
        const nextEntries = data ?? []
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
    <main className="px-4 pt-4 pb-8 max-w-5xl mx-auto">
      <header className="mb-6 flex flex-col items-center text-center">
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

      <div className="space-y-9">
        {LOCATION_GROUPS.map((group) => (
          <section key={group.title}>
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-l from-gray-300/80 to-transparent dark:from-white/20" />
              <h2 className="shrink-0 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-white/55">
                {group.title}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-300/80 to-transparent dark:from-white/20" />
            </div>

            <div
              className="
                -mx-4 flex snap-x snap-mandatory gap-4
                overflow-x-auto px-4 pb-3
                [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5
                sm:overflow-visible sm:px-0 sm:pb-0
                lg:grid-cols-3
              "
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
                      p-5
                      h-[110px]
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
                      dark:bg-[#162338]
                      dark:border-white/10
                      dark:text-white
                      sm:min-w-0
                    "
                  >
                    <div className="flex flex-col items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight">
                        {location.name}
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
