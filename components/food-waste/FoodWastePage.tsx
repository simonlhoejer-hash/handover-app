'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Scale, Trash2 } from 'lucide-react'
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

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatAmount(value: number) {
  return `${value.toLocaleString('da-DK', {
    maximumFractionDigits: 2,
  })} kg`
}

export default function FoodWastePage() {
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = getToday()

  useEffect(() => {
    let isCurrent = true

    async function loadEntries() {
      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .gte('waste_date', today.slice(0, 7) + '-01')
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (!isCurrent) return

      if (loadError) {
        setError('Kunne ikke hente food waste.')
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
  }, [today])

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        if (entry.waste_date === today) {
          acc.today += entry.quantity_kg
          acc.byLocation[entry.location_name] =
            (acc.byLocation[entry.location_name] ?? 0) + entry.quantity_kg
        }

        if (entry.waste_date.startsWith(today.slice(0, 7))) {
          acc.month += entry.quantity_kg
        }

        return acc
      },
      {
        today: 0,
        month: 0,
        byLocation: {} as Record<string, number>,
      }
    )
  }, [entries, today])

  return (
    <main className="max-w-5xl mx-auto px-4 pt-2 pb-24 space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-nordic">
          Galley
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Food waste
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
              Vælg sted og registrer vægten på næste side.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nordic-soft text-nordic">
            <Trash2 size={22} strokeWidth={1.8} />
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
            <Scale size={16} />
            I dag
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {formatAmount(totals.today)}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
            <CalendarDays size={16} />
            Denne måned
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {formatAmount(totals.month)}
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FOOD_WASTE_LOCATIONS.map((location) => {
          const todayAmount = totals.byLocation[location.name] ?? 0

          return (
            <Link
              key={location.slug}
              href={`/galley/food-waste/${location.slug}`}
              className="
                rounded-xl
                p-5
                h-[118px]
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
              "
            >
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">
                  {location.name}
                </h2>
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
                  {loading ? 'Henter...' : todayAmount > 0 ? formatAmount(todayAmount) : '0 kg i dag'}
                </span>
              </div>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
