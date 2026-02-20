'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import HandoverEditor from '@/components/handover/HandoverEditor'

export default function IdeasPage({ department }: { department: 'shop' | 'galley' }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

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
  }

  return (
    <main className="px-4 py-6 max-w-4xl mx-auto space-y-6">

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

        <HandoverEditor value={content} onChange={setContent} />

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
        >
          {loading ? 'Gemmer...' : 'Gem idé'}
        </button>

      </div>

    </main>
  )
}