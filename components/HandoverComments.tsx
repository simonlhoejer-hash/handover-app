'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Comment = {
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
  const [comments, setComments] = useState<Comment[]>([])
  const [open, setOpen] = useState(false)
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const fetchComments = async () => {
      const { data } = await supabase
        .from('handover_comments')
        .select('*')
        .eq('handover_id', handoverId)
        .order('created_at', { ascending: true })

      setComments(data || [])
    }

    fetchComments()
  }, [open, handoverId])

  const addComment = async () => {
    if (!author || !text) return

    setLoading(true)

    await supabase.from('handover_comments').insert({
      handover_id: handoverId,
      author_name: author,
      comment: text,
    })

    setAuthor('')
    setText('')
    setLoading(false)

    const { data } = await supabase
      .from('handover_comments')
      .select('*')
      .eq('handover_id', handoverId)
      .order('created_at', { ascending: true })

    setComments(data || [])
  }

  return (
    <div className="mt-4 text-sm">
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-600 dark:text-gray-400 underline"
      >
        💬 Kommentarer ({comments.length})
      </button>

      {open && (
        <div className="mt-3 space-y-3">
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
              className="w-full rounded p-2 text-gray-900"
              placeholder="Dit navn"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />

            <textarea
              className="w-full rounded p-2 text-gray-900"
              placeholder="Skriv kommentar..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <button
              onClick={addComment}
              disabled={loading}
              className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
            >
              {loading ? 'Gemmer...' : 'Tilføj kommentar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
