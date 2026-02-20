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

  useEffect(() => {
    fetchAll()
    setOpen(false)
  }, [handoverId])

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
    await fetchAll()
  }

  return (
    <div className="mt-6">

      {/* BADGE BUTTON */}
      <div className="flex justify-center">
<button
  onClick={async () => {
    const next = !open
    setOpen(next)
    if (next) await fetchAll()
  }}
  className="
    px-4 py-1.5
    text-xs font-medium
    rounded-full
    bg-gray-100 text-gray-700
    dark:bg-gray-700 dark:text-gray-300
    hover:bg-gray-200 dark:hover:bg-gray-600
    transition
  "
>
  Kommentarer ({count})
</button>

      </div>

      {/* EXPAND SECTION */}
      <div
  className={`
    overflow-hidden
    transition-all
    duration-300
    ease-in-out
    ${open ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}
  `}
>
  <div className="space-y-4">
            {comments.length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Ingen kommentarer endnu
              </p>
            )}
{comments.map((c) => (
  <div
    key={c.id}
    className="
      bg-gray-50 dark:bg-gray-800/60
      border border-gray-200 dark:border-gray-700
      rounded-xl
      p-4
      shadow-sm
      transition
    "
  >
    {/* Header */}
    <div className="flex justify-between items-center mb-2">
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {c.author_name}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        {new Date(c.created_at).toLocaleDateString('da-DK', {
          day: '2-digit',
          month: '2-digit',
        })}{' '}
        kl.{new Date(c.created_at).toLocaleTimeString('da-DK', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>

    {/* Kommentar */}
    <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
      {c.comment}
    </div>
  </div>
))}


            {/* FORM */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <input
                className="
                  w-full rounded-lg p-2
                  bg-gray-100 text-gray-900
                  dark:bg-gray-700 dark:text-gray-100
                  border border-gray-300 dark:border-gray-600
                  text-sm
                "
                placeholder="Dit navn"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />

              <textarea
                className="
                  w-full rounded-lg p-2
                  bg-gray-100 text-gray-900
                  dark:bg-gray-700 dark:text-gray-100
                  border border-gray-300 dark:border-gray-600
                  text-sm
                "
                placeholder="Skriv kommentar..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <button
                onClick={addComment}
                disabled={loading}
                className="
                  w-full py-3 rounded-lg font-semibold
                  bg-black text-white
                  dark:bg-white dark:text-black
                  hover:opacity-90
                  disabled:opacity-50
                  transition
                "
              >
                {loading ? 'Gemmer...' : 'Tilføj kommentar'}
              </button>
            </div>

          </div>
        </div>
      </div>
  )
}
