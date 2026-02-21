'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown } from 'lucide-react'

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
  const [open, setOpen] = useState(false)

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
      setOpen(false)
      await fetchMoeder()

    } catch {
      alert('Noget gik galt')
    }

    setLoading(false)
  }

  return (
    <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-10">

      {/* HEADER */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Afdelingsmøder
        </h1>
        <p className="text-sm text-gray-500 dark:text-white/50">
          {department === 'galley' ? 'Galley' : 'Shop'}
        </p>
      </div>

      {/* 🔥 TOGGLE BJÆLKE */}
      <section className="space-y-4">

        <button
          onClick={() => setOpen(!open)}
          className="
            group
            w-full
            flex items-center justify-between
            px-6 py-4
            rounded-3xl
            text-lg font-semibold
            transition-all duration-300
            active:scale-[0.98]

            bg-white
            border border-black/5
            shadow-[0_10px_30px_rgba(0,0,0,0.06)]

            dark:bg-[#162338]
            dark:border-white/10
            dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]
          "
        >
          <span className="tracking-tight text-gray-900 dark:text-white">
            Nyt referat
          </span>

          <ChevronDown
            className={`
              text-gray-500 dark:text-white/70
              transition-all duration-300
              ${open ? 'rotate-180 scale-110' : ''}
              group-hover:scale-110
            `}
          />
        </button>

        <div
          className={`
            overflow-hidden
            transition-all duration-500 ease-in-out
            ${open ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
          `}
        >
          <div
            className="
              rounded-3xl
              p-6 sm:p-8
              space-y-6

              bg-white
              border border-black/5
              shadow-[0_20px_40px_rgba(0,0,0,0.06)]

              dark:bg-[#162338]
              dark:border-white/10
              dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
            "
          >

            <form onSubmit={handleSubmit} className="space-y-5">

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="
                  w-full
                  rounded-2xl
                  px-4 py-3
                  transition

                  bg-gray-100
                  text-gray-900
                  border border-black/5

                  dark:bg-[#1d2e46]
                  dark:text-white
                  dark:border-white/10

                  focus:outline-none
                  focus:ring-2
                  focus:ring-black/10
                  dark:focus:ring-white/20
                "
              />

              <input
                type="text"
                placeholder="Hold"
                value={hold}
                onChange={(e) => setHold(e.target.value)}
                className="
                  w-full
                  rounded-2xl
                  px-4 py-3
                  transition

                  bg-gray-100
                  text-gray-900
                  border border-black/5

                  dark:bg-[#1d2e46]
                  dark:text-white
                  dark:border-white/10

                  focus:outline-none
                  focus:ring-2
                  focus:ring-black/10
                  dark:focus:ring-white/20
                "
              />

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  e.target.files && setFile(e.target.files[0])
                }
                className="text-sm dark:text-white/70"
              />

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  py-3
                  rounded-2xl
                  font-semibold
                  transition-all duration-200
                  active:scale-[0.98]

                  bg-black
                  text-white
                  shadow-md

                  dark:bg-white
                  dark:text-black
                  dark:shadow-lg

                  hover:opacity-90
                  disabled:opacity-50
                "
              >
                {loading ? 'Uploader...' : 'Upload referat'}
              </button>

            </form>

          </div>
        </div>

      </section>

      {/* REFERAT LISTE */}
      <section
        className="
          rounded-3xl
          p-6 sm:p-8
          space-y-6

          bg-white
          border border-black/5
          shadow-[0_20px_40px_rgba(0,0,0,0.06)]

          dark:bg-[#162338]
          dark:border-white/10
          dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
        "
      >

        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-white/50">
          Tidligere referater
        </div>

        <div className="space-y-4">

          {moeder.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-white/50">
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
                p-5
                rounded-3xl

                bg-gray-50
                border border-black/5

                dark:bg-[#1d2e46]
                dark:border-white/10
              "
            >
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Hold {m.hold}
                </div>
                <div className="text-sm text-gray-500 dark:text-white/60">
                  {m.dato}
                </div>
              </div>

              <a
                href={m.fil_url}
                target="_blank"
                className="
                  px-4 py-2
                  rounded-2xl
                  text-sm font-medium
                  transition-all duration-200
                  active:scale-95

                  bg-black
                  text-white

                  dark:bg-white
                  dark:text-black

                  hover:opacity-90
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