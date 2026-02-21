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
    <div className="mt-8">

      {/* TOGGLE BUTTON */}
      <div className="flex justify-center">
        <button
          onClick={async () => {
            const next = !open
            setOpen(next)
            if (next) await fetchAll()
          }}
          className="
            px-4 py-2
            text-xs font-medium
            rounded-full
            transition-all duration-200
            active:scale-95

            bg-black/5 text-gray-700
            dark:bg-white/10 dark:text-white/80
            hover:opacity-80
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
          ${open ? 'max-h-[3000px] opacity-100 mt-8' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="space-y-6">

          {comments.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-white/50">
              Ingen kommentarer endnu
            </p>
          )}

          {/* COMMENTS */}
          {comments.map((c) => (
            <div
              key={c.id}
              className="
                w-full
                rounded-3xl
                p-5
                transition-all duration-300

                bg-white
                border border-black/5
                shadow-[0_10px_30px_rgba(0,0,0,0.04)]

                dark:bg-[#162338]
                dark:border-white/10
dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]              "
            >
              <div className="flex justify-between items-center mb-3">

                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {c.author_name}
                </div>

                <div className="text-xs text-gray-500 dark:text-white/50">
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

              <div className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-line leading-relaxed">
                {c.comment}
              </div>
            </div>
          ))}

          {/* FORM */}
          <div className="pt-6 border-t border-black/5 dark:border-white/10 space-y-4">

            <input
              className="
                w-full
                rounded-2xl
                px-4 py-3
                transition

                bg-gray-100
                border border-black/5
                text-gray-900

                dark:bg-[#162338]
                dark:border-white/10
                dark:text-white

                focus:outline-none
                focus:ring-2
                focus:ring-black/10
                dark:focus:ring-white/20
              "
              placeholder="Dit navn"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />

            <textarea
              className="
                w-full
                rounded-2xl
                px-4 py-3
                transition
                resize-none

                bg-gray-100
                border border-black/5
                text-gray-900

                dark:bg-[#162338]
                dark:border-white/10
                dark:text-white

                focus:outline-none
                focus:ring-2
                focus:ring-black/10
                dark:focus:ring-white/20
              "
              placeholder="Skriv kommentar..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />

            <button
              onClick={addComment}
              disabled={loading}
              className="
                w-full
                py-3
                rounded-2xl
                font-semibold
                transition-all duration-200
                active:scale-[0.97]

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
              {loading ? 'Gemmer...' : 'Tilføj kommentar'}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}