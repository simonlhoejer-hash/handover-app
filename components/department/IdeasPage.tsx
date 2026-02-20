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

    await fetchIdeas() // 🔥 vigtig
  }

  return (
    <main className="px-4 py-6 max-w-4xl mx-auto space-y-8">

      <h1 className="text-2xl font-semibold">
        Idé parkering
      </h1>

      {/* Opret idé */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow space-y-4">

        <input
          placeholder="Titel på idé"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border dark:bg-gray-900"
        />

        <input
          placeholder="Dit navn"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border dark:bg-gray-900"
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
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
        >
          {loading ? 'Gemmer...' : 'Gem idé'}
        </button>

      </div>

      {/* Liste */}
      <div className="space-y-4">
        {ideas.length === 0 && (
          <p className="text-gray-500">Ingen idéer endnu</p>
        )}

        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow"
          >
            <h2 className="font-semibold text-lg">
              {idea.title}
            </h2>

            <div
              className="text-sm text-gray-600 dark:text-gray-300 mt-2"
              dangerouslySetInnerHTML={{ __html: idea.description }}
            />

            <div className="mt-3 text-xs text-gray-400">
              Af {idea.author} · {new Date(idea.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

    </main>
  )
}