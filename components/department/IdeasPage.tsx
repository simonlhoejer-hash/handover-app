'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import HandoverEditor from '@/components/handover/HandoverEditor'

export default function IdeasPage({ department }: { department: 'shop' | 'galley' }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchIdeas() {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('department', department)
      .order('created_at', { ascending: false })

    if (data) setIdeas(data)
  }

  useEffect(() => {
    fetchIdeas()
  }, [department])

  async function handleSave() {
    if (!title || !author) return

    setLoading(true)

    await supabase.from('ideas').insert({
      department,
      title,
      description: content,
      author,
      status: 'parked',
    })

    setTitle('')
    setAuthor('')
    setContent('')
    setLoading(false)

    await fetchIdeas()
  }

  return (
    <main className="px-4 py-8 max-w-4xl mx-auto space-y-10">

      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Idé parkering
      </h1>

      {/* Opret idé */}
      <div
        className="
          w-full
          rounded-3xl
          p-6 sm:p-8
          transition-all duration-300

          bg-white
          border border-black/5
          shadow-[0_20px_40px_rgba(0,0,0,0.06)]

          dark:bg-[#162338]
          dark:border-white/10
          dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]

          space-y-5
        "
      >

        <input
          placeholder="Titel på idé"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          placeholder="Dit navn"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
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

        <HandoverEditor
          value={content}
          onChange={setContent}
          placeholder={`Beskriv din idé 👇

Hvad går idéen ud på?
Hvad vil det forbedre?
Er det drift, arbejdsgang eller kundeoplevelse?`}
        />

        <button
          onClick={handleSave}
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
          {loading ? 'Gemmer...' : 'Gem idé'}
        </button>

      </div>

      {/* Liste */}
      <div className="space-y-5">

        {ideas.length === 0 && (
          <p className="text-gray-500 dark:text-white/50">
            Ingen idéer endnu
          </p>
        )}

        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="
              rounded-3xl
              p-6
              transition-all duration-300

              bg-white
              border border-black/5
              shadow-[0_15px_40px_rgba(0,0,0,0.05)]

              dark:bg-[#162338]
              dark:border-white/10
              dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]
            "
          >
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              {idea.title}
            </h2>

            <div
              className="
                prose
                dark:prose-invert
                max-w-none
                text-gray-700
                dark:text-white/90
                mt-3
              "
              dangerouslySetInnerHTML={{ __html: idea.description }}
            />

            <div className="mt-4 text-xs text-gray-500 dark:text-white/50">
              Af {idea.author} · {new Date(idea.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}

      </div>

    </main>
  )
}