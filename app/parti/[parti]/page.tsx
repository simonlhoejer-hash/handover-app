'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const cardClass = `
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  rounded-xl shadow
`

const inputClass = `
  w-full rounded p-2 mb-3
  bg-gray-100 text-gray-900
  dark:bg-gray-700 dark:text-gray-100
  border border-gray-300 dark:border-gray-600
  placeholder-gray-500 dark:placeholder-gray-400
`

// Fix til date-input (samme højde som de andre)
const dateInputClass = `
  w-full rounded mb-3
  px-2 py-2
  h-[42px]
  bg-gray-100 text-gray-900
  dark:bg-gray-700 dark:text-gray-100
  border border-gray-300 dark:border-gray-600
  appearance-none
`

export default function PartiPage() {
  const params = useParams()
  const router = useRouter()
  const parti = decodeURIComponent(params.parti as string)

  const [name, setName] = useState('')
  const [fromTeam, setFromTeam] = useState('Hold 1')
  const [toTeam, setToTeam] = useState('Hold 2')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [note, setNote] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const teams = ['Hold 1', 'Hold 2', 'Hold 3', 'Hold 4']

  useEffect(() => {
    loadNotes()
  }, [])

  async function loadNotes() {
    const { data } = await supabase
      .from('handover_notes')
      .select('*')
      .eq('parti', parti)
      .order('created_at', { ascending: false })

    setItems(data || [])
  }

  async function saveNote() {
    if (!name || !note) {
      alert('Navn og overlevering skal udfyldes')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('handover_notes')
      .insert({
        author_name: name,
        parti,
        from_team: fromTeam,
        to_team: toTeam,
        shift_date: date,
        note,
      })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      setNote('')
      loadNotes()
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-10">
      {/* HEADER */}
      <header className="relative flex items-center mb-2">
        <button
          onClick={() => router.back()}
          className="
            absolute left-0
            text-4xl font-bold
            text-gray-700 dark:text-gray-300
            hover:text-black dark:hover:text-white
            transition
            px-3
          "
          aria-label="Tilbage"
        >
          ←
        </button>

        <div className="w-full text-center">
          <h1 className="text-3xl font-bold">{parti}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overleveringer for {parti}
          </p>
        </div>
      </header>

      {/* FORM */}
      <section className={`${cardClass} p-6`}>
        <h2 className="text-xl font-semibold mb-4">
          Ny overlevering
        </h2>

        <input
          className={inputClass}
          placeholder="Dit navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex gap-3 mb-3">
          <select
            className={inputClass}
            value={fromTeam}
            onChange={(e) => setFromTeam(e.target.value)}
          >
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <select
            className={inputClass}
            value={toTeam}
            onChange={(e) => setToTeam(e.target.value)}
          >
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <input
          type="date"
          className={dateInputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <textarea
          className={`${inputClass} h-32`}
          placeholder="Skriv overlevering..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          onClick={saveNote}
          disabled={loading}
          className="
            w-full py-3 rounded font-semibold
            bg-black text-white
            dark:bg-white dark:text-black
            transition
          "
        >
          {loading ? 'Gemmer...' : 'Gem overlevering'}
        </button>
      </section>

      {/* HISTORIK */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Historik
        </h2>

        {items.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            Ingen overleveringer endnu
          </p>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`${cardClass} p-4`}
            >
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {new Date(item.shift_date).toLocaleDateString('da-DK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                · {item.author_name || 'Ukendt'}
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {item.from_team} → {item.to_team}
              </div>

              <div>{item.note}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
