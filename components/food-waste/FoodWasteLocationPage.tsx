'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number
  comment: string | null
}

type Props = {
  locationName: string
}

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

export default function FoodWasteLocationPage({ locationName }: Props) {
  const [entries, setEntries] = useState<FoodWasteEntry[]>([])
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
        .eq('location_name', locationName)
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      if (!isCurrent) return

      if (loadError) {
        setError('Kunne ikke hente food waste.')
        setEntries([])
      } else {
        setError('')
        setEntries(data ?? [])
      }

      setLoading(false)
      window.setTimeout(() => kgInputRef.current?.focus(), 120)
    }

    void loadEntries()

    return () => {
      isCurrent = false
    }
  }, [locationName])

  const todayTotal = useMemo(() => {
    return entries.reduce((total, entry) => {
      if (entry.waste_date !== today) return total
      return total + entry.quantity_kg
    }, 0)
  }, [entries, today])

  async function saveEntry() {
    const quantity = Number(quantityKg.replace(',', '.'))

    if (!quantity || quantity <= 0) {
      setError('Skriv kg.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      waste_date: today,
      location_name: locationName,
      quantity_kg: quantity,
      comment: comment.trim() || null,
    }

    const { data, error: saveError } = await supabase
      .from('food_waste_entries')
      .insert(payload)
      .select('*')
      .single()

    if (saveError) {
      setError('Kunne ikke gemme registreringen.')
    } else if (data) {
      setEntries((current) => [data, ...current])
      setQuantityKg('')
      setComment('')
      kgInputRef.current?.focus()
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
    <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6">
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
            {locationName}
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-white/60">
            Food waste
          </p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-white/60">
              I dag
            </p>
            <div className="mt-1 text-2xl font-semibold">
              {formatAmount(todayTotal)}
            </div>
          </div>
          <span className="rounded-full bg-nordic-soft px-3 py-1 text-sm font-medium text-nordic">
            {formatDate(today)}
          </span>
        </div>

        <div className="mt-5 relative">
          <input
            ref={kgInputRef}
            inputMode="decimal"
            className="w-full rounded-2xl bg-gray-100 px-4 py-5 pr-16 text-4xl font-semibold text-gray-900 border border-black/5 dark:bg-[#0f1b2d] dark:text-white dark:border-white/10"
            placeholder="0,0"
            value={quantityKg}
            onChange={(event) => setQuantityKg(event.target.value)}
          />
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-base font-medium text-gray-500 dark:text-white/60">
            kg
          </span>
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

        <button
          onClick={saveEntry}
          disabled={saving}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black px-7 font-semibold text-white shadow-md transition active:scale-[0.98] hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          <Plus size={18} />
          {saving ? 'Gemmer...' : 'Gem'}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Seneste for stedet
        </h2>

        {loading && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#162338] dark:border-white/10 dark:text-white/60">
            Indlæser...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 border border-black/5 dark:bg-[#162338] dark:border-white/10 dark:text-white/60">
            Ingen registreringer endnu.
          </div>
        )}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">
                  {formatDate(entry.waste_date)}
                </h3>
                {entry.comment && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                    {entry.comment}
                  </p>
                )}
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
          </article>
        ))}
      </section>
    </main>
  )
}
