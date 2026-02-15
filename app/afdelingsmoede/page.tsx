'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Moede = {
  id: string
  dato: string
  hold: string
  fil_url: string
}

export default function AfdelingsmoedePage() {
  const [date, setDate] = useState('')
  const [hold, setHold] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [moeder, setMoeder] = useState<Moede[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMoeder()
  }, [])

  async function fetchMoeder() {
    const { data, error } = await supabase
      .from('afdelingsmoeder')
      .select('*')
      .order('dato', { ascending: false })

    if (error) {
      console.error('Fetch error:', error.message)
      return
    }

    if (data) setMoeder(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!date || !hold || !file) {
      alert('Udfyld alle felter')
      return
    }

    setLoading(true)

    try {
      // 🔥 Rens filnavn (fjerner æøå og specialtegn)
      const safeFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_')

      const fileName = `${Date.now()}-${safeFileName}`

      // 1️⃣ Upload til Storage
      const { error: uploadError } = await supabase.storage
        .from('afdelingsmoeder')
        .upload(fileName, file)

      if (uploadError) {
        console.error(uploadError)
        alert(uploadError.message)
        setLoading(false)
        return
      }

      // 2️⃣ Hent public URL
      const { data: publicUrlData } = supabase.storage
        .from('afdelingsmoeder')
        .getPublicUrl(fileName)

      if (!publicUrlData) {
        alert('Kunne ikke hente public URL')
        setLoading(false)
        return
      }

      // 3️⃣ Gem i database
      const { error: insertError } = await supabase
        .from('afdelingsmoeder')
        .insert({
          dato: date,
          hold: hold,
          fil_url: publicUrlData.publicUrl
        })

      if (insertError) {
        console.error(insertError)
        alert(insertError.message)
        setLoading(false)
        return
      }

      alert('Referat gemt ✅')

      setDate('')
      setHold('')
      setFile(null)

      fetchMoeder()
    } catch (err) {
      console.error(err)
      alert('Noget gik galt')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-10">

      {/* Upload */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold mb-6">
          Nyt afdelingsmøde
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800"
          />

          <input
            type="text"
            placeholder="Hold"
            value={hold}
            onChange={(e) => setHold(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800"
          />

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) =>
              e.target.files && setFile(e.target.files[0])
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
          >
            {loading ? 'Uploader...' : 'Upload referat'}
          </button>

        </form>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-6">
          Tidligere referater
        </h3>

        <div className="space-y-4">
          {moeder.length === 0 && (
            <p className="text-gray-500">Ingen referater endnu</p>
          )}

          {moeder.map((m) => (
            <div
              key={m.id}
              className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
            >
              <div>
                <div className="font-medium">
                  Hold {m.hold}
                </div>
                <div className="text-sm text-gray-500">
                  {m.dato}
                </div>
              </div>

              <a
                href={m.fil_url}
                target="_blank"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:opacity-90"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
