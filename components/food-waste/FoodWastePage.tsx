'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Plus, Scale, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number
  comment: string | null
}

const locations = [
  'Skagerak morgen',
  'Skagerak aften',
  'Messen morgen',
  'Messen frokost & aften',
  'Commodore morgen',
  'Produktion Main Galley',
  'Produktion Skagerak Galley',
  'Produktion Kold Galley',
  'Produktion Bageri',
  'Produktion Slagteri',
  'Produktion Proviant dæk 1',
]

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

function formatAmount(value: number) {
  return `${value.toLocaleString('da-DK', {
    maximumFractionDigits: 2,
  })} kg`
}

export default function FoodWastePage() {
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
  const [selectedLocation, setSelectedLocation] = useState(locations[0])
  const [quantityKg, setQuantityKg] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const kgInputRef = useRef<HTMLInputElement>(null)

  const today = getToday()

  useEffect(() => {
    let isCurrent = true

    async function loadEntries() {
      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60)

      if (!isCurrent) return

      if (loadError) {
        setError(
          'Food waste-tabellen mangler muligvis i Supabase. Opret tabellen og prøv igen.'
        )
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
  }, [])

  const totals = useMemo(() => {
    const month = today.slice(0, 7)

    return entries.reduce(
      (acc, entry) => {
        if (entry.waste_date === today) {
          acc.today += entry.quantity_kg
          acc.byLocation[entry.location_name] =
            (acc.byLocation[entry.location_name] ?? 0) + entry.quantity_kg
        }

        if (entry.waste_date.startsWith(month)) {
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

  function chooseLocation(location: string) {
    setSelectedLocation(location)
    setError('')
    window.setTimeout(() => kgInputRef.current?.focus(), 80)
  }

  async function saveEntry() {
    const quantity = Number(quantityKg.replace(',', '.'))

    if (!selectedLocation || !quantity || quantity <= 0) {
      setError('Vælg sted og skriv kg.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      waste_date: today,
      location_name: selectedLocation,
      quantity_kg: quantity,
      comment: comment.trim() || null,
    }

    const { data, error: saveError } = await supabase
      .from('food_waste_entries')
      .insert(payload)
      .select('*')
      .single()

    if (saveError) {
      setError('Kunne ikke gemme registreringen. Tjek Supabase-tabellen.')
    } else if (data) {
      setEntries((current) => [data, ...current])
      setQuantityKg('')
      setComment('')
    }

    setSaving(false)
  }

  async function deleteEntry(id: string) {
    const { error: deleteError } = await supabase
      .from('food_waste_entries')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError('Kunne ikke slette registreringen.')
      return
    }

    setEntries((current) => current.filter((entry) => entry.id !== id))
  }

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
              Tryk på sted, skriv kg og gem.
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => {
          const isSelected = selectedLocation === location
          const todayAmount = totals.byLocation[location] ?? 0

          return (
            <button
              key={location}
              onClick={() => chooseLocation(location)}
              className={`
                rounded-xl
                p-5
                h-[118px]
                flex items-center justify-center
                border
                text-center
                shadow-sm
                transition-all duration-200
                active:scale-[0.98]
                ${
                  isSelected
                    ? `
                      bg-nordic-soft
                      border-[var(--nordic-green)]
                      text-nordic
                      shadow-md
                    `
                    : `
                      bg-white
                      border-gray-200/70
                      text-gray-900
                      hover:shadow-md
                      hover:-translate-y-[1px]
                      dark:bg-[#162338]
                      dark:border-white/10
                      dark:text-white
                    `
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">
                  {location}
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
                  {todayAmount > 0 ? formatAmount(todayAmount) : '0 kg i dag'}
                </span>
              </div>
            </button>
          )
        })}
      </section>

      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Valgt sted
            </p>
            <h2 className="text-xl font-semibold">
              {selectedLocation}
            </h2>
          </div>
          <span className="rounded-full bg-nordic-soft px-3 py-1 text-sm font-medium text-nordic">
            {formatDate(today)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <input
              ref={kgInputRef}
              inputMode="decimal"
              className="w-full rounded-2xl bg-gray-100 px-4 py-4 pr-14 text-2xl font-semibold text-gray-900 border border-black/5 dark:bg-[#0f1b2d] dark:text-white dark:border-white/10"
              placeholder="0,0"
              value={quantityKg}
              onChange={(event) => setQuantityKg(event.target.value)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-white/60">
              kg
            </span>
          </div>

          <button
            onClick={saveEntry}
            disabled={saving}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-black px-7 font-semibold text-white shadow-md transition active:scale-[0.98] hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            <Plus size={18} />
            {saving ? 'Gemmer...' : 'Gem'}
          </button>
        </div>

        <textarea
          className="mt-3 min-h-16 w-full rounded-2xl bg-gray-100 px-4 py-3 text-gray-900 border border-black/5 dark:bg-[#0f1b2d] dark:text-white dark:border-white/10"
          placeholder="Kommentar"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />

        {error && (
          <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Seneste registreringer
        </h2>

        {loading && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#162338] dark:border-white/10 dark:text-white/60">
            Indlæser...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#162338] dark:border-white/10 dark:text-white/60">
            Ingen food waste registreret endnu.
          </div>
        )}

        {entries.slice(0, 12).map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">
                  {entry.location_name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {formatDate(entry.waste_date)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  {formatAmount(entry.quantity_kg)}
                </span>
                <button
                  onClick={() => void deleteEntry(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Slet registrering"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {entry.comment && (
              <p className="mt-3 text-sm text-gray-600 dark:text-white/70">
                {entry.comment}
              </p>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}
