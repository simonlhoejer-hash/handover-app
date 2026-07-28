'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ClipboardList, Plus, Scale, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FoodWasteEntry = {
  id: string
  created_at: string
  waste_date: string
  location_name: string
  quantity_kg: number
  comment: string | null
}

type FoodWasteForm = {
  location_name: string
  quantity_kg: string
  comment: string
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

const today = new Date().toISOString().slice(0, 10)

const emptyForm: FoodWasteForm = {
  location_name: locations[0],
  quantity_kg: '',
  comment: '',
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
  const [form, setForm] = useState<FoodWasteForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadEntries() {
      const { data, error: loadError } = await supabase
        .from('food_waste_entries')
        .select('*')
        .order('waste_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(40)

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
        }

        if (entry.waste_date.startsWith(month)) {
          acc.month += entry.quantity_kg
        }

        return acc
      },
      { today: 0, month: 0 }
    )
  }, [entries])

  async function saveEntry() {
    const quantity = Number(form.quantity_kg.replace(',', '.'))

    if (!form.location_name || !quantity || quantity <= 0) {
      setError('Vælg sted og skriv kg.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      waste_date: today,
      location_name: form.location_name,
      quantity_kg: quantity,
      comment: form.comment.trim() || null,
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
      setForm((current) => ({
        location_name: current.location_name,
        quantity_kg: '',
        comment: '',
      }))
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
              Vælg sted, skriv kg og gem. Datoen er automatisk i dag.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nordic-soft text-nordic">
            <Trash2 size={22} strokeWidth={1.8} />
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
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

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
            <ClipboardList size={16} />
            Registreringer
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {entries.length}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-black/5 shadow-sm dark:bg-[#162338] dark:border-white/10">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
          <select
            className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-gray-900 border border-black/5 dark:bg-[#0f1b2d] dark:text-white dark:border-white/10"
            value={form.location_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                location_name: event.target.value,
              }))
            }
          >
            {locations.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </select>

          <div className="relative">
            <input
              inputMode="decimal"
              className="w-full rounded-2xl bg-gray-100 px-4 py-3 pr-12 text-gray-900 border border-black/5 dark:bg-[#0f1b2d] dark:text-white dark:border-white/10"
              placeholder="Kg"
              value={form.quantity_kg}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity_kg: event.target.value,
                }))
              }
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-white/60">
              kg
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-nordic-soft px-4 py-3 text-sm font-medium text-nordic">
          Dato: {formatDate(today)}
        </div>

        <textarea
          className="mt-3 min-h-20 w-full rounded-2xl bg-gray-100 px-4 py-3 text-gray-900 border border-black/5 dark:bg-[#0f1b2d] dark:text-white dark:border-white/10"
          placeholder="Kommentar"
          value={form.comment}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              comment: event.target.value,
            }))
          }
        />

        {error && (
          <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          onClick={saveEntry}
          disabled={saving}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3 font-semibold text-white shadow-md transition active:scale-[0.98] hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          <Plus size={18} />
          {saving ? 'Gemmer...' : 'Gem kg'}
        </button>
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

        {entries.map((entry) => (
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
