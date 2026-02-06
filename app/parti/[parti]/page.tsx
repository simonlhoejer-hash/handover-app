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
`

const dateInputClass = `
  w-full rounded mb-3
  px-2 py-2
  h-[42px]
  bg-gray-100 text-gray-900
  dark:bg-gray-700 dark:text-gray-100
  border border-gray-300 dark:border-gray-600
`

export default function PartiPage() {
  const params = useParams()
  const router = useRouter()
  const parti = decodeURIComponent(params.parti as string)

  const [name, setName] = useState('')
  const [fromTeam, setFromTeam] = useState('Hold 1')
  const [toTeam, setToTeam] = useState('Hold 2')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

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

  async function uploadImage(file: File) {
    setUploading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const filePath = `${parti}/${fileName}`

    const { error } = await supabase.storage
      .from('handover-images')
      .upload(filePath, file)

    if (error) {
      alert('Fejl ved upload af billede')
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('handover-images')
      .getPublicUrl(filePath)

    setImages((prev) => [...prev, data.publicUrl])
    setUploading(false)
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
        images,
      })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      setNote('')
      setImages([])
      loadNotes()
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-10">
      {/* HEADER */}
      <header className="relative flex items-center mb-2">
        <button
          onClick={() => router.back()}
          className="absolute left-0 text-4xl font-bold text-gray-700 dark:text-gray-300 px-3"
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
        <h2 className="text-xl font-semibold mb-4">Ny overlevering</h2>

        <input
          className={inputClass}
          placeholder="Dit navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex gap-3 mb-3">
          <select className={inputClass} value={fromTeam} onChange={(e) => setFromTeam(e.target.value)}>
            {teams.map((team) => (
              <option key={team}>{team}</option>
            ))}
          </select>

          <select className={inputClass} value={toTeam} onChange={(e) => setToTeam(e.target.value)}>
            {teams.map((team) => (
              <option key={team}>{team}</option>
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

        {/* BILLEDER */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Billeder</label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && uploadImage(e.target.files[0])}
          />

          {uploading && (
            <p className="text-sm mt-1 text-gray-500">Uploader billede…</p>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((url) => (
                <img
                  key={url}
                  src={url}
                  className="h-24 w-full object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={saveNote}
          disabled={loading}
          className="w-full py-3 rounded font-semibold bg-black text-white dark:bg-white dark:text-black"
        >
          {loading ? 'Gemmer...' : 'Gem overlevering'}
        </button>
      </section>

      {/* HISTORIK */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Historik</h2>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className={`${cardClass} p-4`}>
              <div className="text-sm text-gray-500 mb-1">
                {new Date(item.shift_date).toLocaleDateString('da-DK')} · {item.author_name}
              </div>

              <div className="text-sm text-gray-400 mb-2">
                {item.from_team} → {item.to_team}
              </div>

              <div>{item.note}</div>

              {item.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {item.images.map((url: string) => (
                    <a key={url} href={url} target="_blank">
                      <img
                        src={url}
                        className="h-24 wounded object-cover rounded"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
