'use client'

import { useEffect, useState } from 'react'
import { Save, Users } from 'lucide-react'
import type { AccessShip } from '@/lib/shipAccess'

type GuestCount = {
  service_date: string
  guest_count: number
  mess_guests?: number | null
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function FoodWasteGuestsAdmin({ ship }: { ship: AccessShip }) {
  const [date, setDate] = useState(today)
  const [guests, setGuests] = useState('160')
  const [savedCounts, setSavedCounts] = useState<GuestCount[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void fetch(`/api/food-waste/guests?ship=${ship}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setSavedCounts(result.data ?? [])
      })
      .catch(() => setMessage('Gæstetallet kunne ikke hentes.'))
  }, [ship])

  useEffect(() => {
    const saved = savedCounts.find((count) => count.service_date === date)
    setGuests(String(saved?.mess_guests ?? saved?.guest_count ?? 160))
    setMessage('')
  }, [date, savedCounts])

  async function save() {
    const value = Number(guests)
    if (!Number.isInteger(value) || value <= 0 || value > 10000 || saving) {
      setMessage('Skriv et gyldigt gæstetal.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/food-waste/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ship,
          service_date: date,
          guest_count: value,
          breakfast_guests: 0,
          skagerak_morning: 0,
          commodore_morning: 0,
          skagerak_evening: 0,
          mess_guests: value,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setSavedCounts((current) => [result.data, ...current.filter((count) => count.service_date !== date)])
      setMessage('Gæstetallet er gemt.')
    } catch {
      setMessage('Gæstetallet kunne ikke gemmes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-7 rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d3b3a] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#347f7a]/10 text-[#216762] dark:text-[#a8d5d1]">
          <Users size={21} />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Gæster i Messen</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">Bruges kun til beregninger i baggrunden og vises ikke på den daglige statistikside.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-1.5 text-sm font-medium">
          Dato
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-12 rounded-xl border border-black/10 bg-gray-50 px-4 dark:border-white/10 dark:bg-white/5" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Gæster pr. måltid
          <input inputMode="numeric" value={guests} onChange={(event) => setGuests(event.target.value)} className="h-12 rounded-xl border border-black/10 bg-gray-50 px-4 text-lg font-semibold dark:border-white/10 dark:bg-white/5" />
        </label>
        <button type="button" onClick={() => void save()} disabled={saving} className="mt-auto flex h-12 items-center justify-center gap-2 rounded-xl bg-[#064e4c] px-5 font-semibold text-white disabled:opacity-50">
          <Save size={18} /> {saving ? 'Gemmer…' : 'Gem'}
        </button>
      </div>
      {message && <p className="mt-3 rounded-xl bg-[#347f7a]/10 px-4 py-3 text-sm font-semibold text-[#216762] dark:text-[#a8d5d1]">{message}</p>}
    </section>
  )
}
