'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type HandoverComment = {
  id: string
  author_name: string
  comment: string
  created_at: string
}

export default function HandoverComments({
  handoverId,
}: {
  handoverId: string
}) {
  const [comments, setComments] = useState<HandoverComment[]>([])
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔁 ÉN sandhed: hent ALT fra DB
  const fetchAll = async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from('handover_comments')
        .select('*')
        .eq('handover_id', handoverId)
        .order('created_at', { ascending: true }),

      supabase
        .from('handover_comments')
        .select('*', { count: 'exact', head: true })
        .eq('handover_id', handoverId),
    ])

    setComments(data || [])
    setCount(count || 0)
  }

  // 🔄 Når overlevering skifter (eller side reloades)
  useEffect(() => {
    fetchAll()
    setOpen(false)
  }, [handoverId])

  // ➕ Tilføj kommentar
  const addComment = async () => {
    if (!author || !text) return

    setLoading(true)

    const { error } = await supabase.from('handover_comments').insert({
      handover_id: handoverId,
      author_name: author,
      comment: text,
    })

    setLoading(false)

    if (error) {
      alert('Kunne ikke gemme kommentar')
      return
    }

    setAuthor('')
    setText('')

    // 🔄 ALT genhentes – ingen gæt
    await fetchAll()
  }

  return (
    <div className="mt-4 text-sm">
      <button
        onClick={async () => {
          const next = !open
          setOpen(next)
          if (next) await fetchAll()
        }}
        className="text-gray-600 dark:text-gray-400 underline"
      >
        💬 Kommentarer ({count})
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-gray-500 text-sm">
              Ingen kommentarer endnu
            </p>
          )}

          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded bg-gray-100 dark:bg-gray-700 p-2"
            >
              <div className="font-semibold">{c.author_name}</div>
              <div className="whitespace-pre-line">{c.comment}</div>
            </div>
          ))}

          <div className="space-y-2">
            <input
              className="
                w-full rounded p-2
                bg-gray-100 text-gray-900
                dark:bg-gray-700 dark:text-gray-100
                border border-gray-300 dark:border-gray-600
              "
              placeholder="Dit navn"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />

            <textarea
              className="
                w-full rounded p-2
                bg-gray-100 text-gray-900
                dark:bg-gray-700 dark:text-gray-100
                border border-gray-300 dark:border-gray-600
              "
              placeholder="Skriv kommentar..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <button
              onClick={addComment}
              disabled={loading}
              className="
                w-full
                py-3
                rounded
                font-semibold
                transition
                bg-black text-white
                dark:bg-white dark:text-black
                hover:opacity-90
                disabled:opacity-50
              "
            >
              {loading ? 'Gemmer...' : 'Tilføj kommentar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
