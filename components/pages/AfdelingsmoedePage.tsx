'use client'

import { usePathname } from 'next/navigation'
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

  const pathname = usePathname()
  const department = pathname.startsWith('/galley') ? 'galley' : 'shop'

  useEffect(() => {
    fetchMoeder()
  }, [department])

  async function fetchMoeder() {
    const { data, error } = await supabase
      .from('afdelingsmoeder')
      .select('*')
      .eq('department', department)
      .order('dato', { ascending: false })

    if (!error && data) {
      setMoeder(data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!date || !hold || !file) {
      alert('Udfyld alle felter')
      return
    }

    setLoading(true)

    try {
      const safeFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_')

      const fileName = `${Date.now()}-${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('afdelingsmoeder')
        .upload(fileName, file)

      if (uploadError) {
        alert(uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('afdelingsmoeder')
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase
        .from('afdelingsmoeder')
        .insert({
          dato: date,
          hold: hold,
          fil_url: publicUrlData.publicUrl,
          department: department
        })

      if (insertError) {
        alert(insertError.message)
        setLoading(false)
        return
      }

      setDate('')
      setHold('')
      setFile(null)
      fetchMoeder()

    } catch {
      alert('Noget gik galt')
    }

    setLoading(false)
  }

  return (
    <main className="
      max-w-xl
      mx-auto
      px-4
      pt-6
      pb-24
      space-y-12
    ">

      {/* HEADER */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Afdelingsmøder
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {department === 'galley' ? 'Galley' : 'Shop'}
        </p>
      </div>

      {/* UPLOAD CARD */}
      <section className="
        bg-white dark:bg-gray-900
        p-6
        rounded-2xl
        shadow-sm
        border border-gray-200 dark:border-gray-800
        space-y-6
      ">

        <div className="
          text-xs
          uppercase
          tracking-wider
          text-gray-500 dark:text-gray-400
        ">
          Nyt referat
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Dato
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="
                w-full h-11 px-4
                rounded-xl
                border border-gray-200
                bg-gray-50
                dark:bg-gray-800 dark:border-gray-700
                appearance-none
              "
            />
          </div>

          <input
            type="text"
            placeholder="Hold"
            value={hold}
            onChange={(e) => setHold(e.target.value)}
            className="
              w-full h-11 px-4
              rounded-xl
              border border-gray-200
              bg-gray-50
              dark:bg-gray-800 dark:border-gray-700
            "
          />

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) =>
              e.target.files && setFile(e.target.files[0])
            }
            className="text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              h-11
              rounded-xl
              font-medium
              transition
              bg-black text-white
              dark:bg-white dark:text-black
              hover:opacity-90
              disabled:opacity-50
            "
          >
            {loading ? 'Uploader...' : 'Upload referat'}
          </button>

        </form>
      </section>

      {/* LIST CARD */}
      <section className="
        bg-white dark:bg-gray-900
        p-6
        rounded-2xl
        shadow-sm
        border border-gray-200 dark:border-gray-800
        space-y-6
      ">

        <div className="
          text-xs
          uppercase
          tracking-wider
          text-gray-500 dark:text-gray-400
        ">
          Tidligere referater
        </div>

        <div className="space-y-4">

          {moeder.length === 0 && (
            <p className="text-sm text-gray-500">
              Ingen referater endnu
            </p>
          )}

          {moeder.map((m) => (
            <div
              key={m.id}
              className="
                flex flex-col sm:flex-row
                sm:justify-between sm:items-center
                gap-3
                p-4
                rounded-xl
                bg-gray-50 dark:bg-gray-800
              "
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
                className="
                  px-4 py-2
                  rounded-lg
                  text-sm font-medium
                  bg-black text-white
                  dark:bg-white dark:text-black
                  hover:opacity-90
                  transition
                "
              >
                Download
              </a>
            </div>
          ))}

        </div>
      </section>

    </main>
  )
}
