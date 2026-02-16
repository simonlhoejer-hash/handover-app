'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import HandoverComments from './HandoverComments'
import HandoverEditor from './HandoverEditor'

type Props = {
  item: any
  reload: () => void
}

export default function HandoverHistoryItem({ item, reload }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [note, setNote] = useState(item.note)
  const [readName, setReadName] = useState('')
  const [loading, setLoading] = useState(false)

  async function saveEdit() {
  if (item.read_by) {
    alert('Overleveringen er allerede læst og kan ikke redigeres')
    return
  }

  setLoading(true)

  const { error } = await supabase
    .from('handover_notes')
    .update({ note })
    .eq('id', item.id)

  setLoading(false)

  if (error) {
    alert(error.message)
  } else {
    setIsEditing(false)
    reload()
  }
}

  async function markAsRead() {
    if (!readName) {
      alert('Skriv dit fornavn for at kvittere')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('handover_notes')
      .update({
        read_by: readName,
        read_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      setReadName('')
      reload()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow">

      {/* HEADER + REDIGER */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-gray-400 tracking-wide">
          {new Date(item.shift_date).toLocaleDateString('da-DK')} ·{' '}
          {item.author_name} → {item.receiver_name}
        </div>

{!isEditing && !item.read_by && (
  <button
    onClick={() => setIsEditing(true)}
    className="text-blue-500 text-xs font-medium hover:underline"
  >
    ✏️ Rediger
  </button>
)}

      </div>

      {/* CONTENT */}
      {isEditing ? (
        <>
          <HandoverEditor value={note} onChange={setNote} />

          <div className="flex gap-3 mt-3">
            <button
              onClick={saveEdit}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
            >
              Gem
            </button>

            <button
              onClick={() => {
                setNote(item.note)
                setIsEditing(false)
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg text-sm"
            >
              Annuller
            </button>
          </div>
        </>
      ) : (
        <div className="whitespace-pre-line text-base leading-relaxed">
          {item.note}
        </div>
      )}

      {/* SEPARATOR */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">

        {/* KVITTERING */}
        {!item.read_by ? (
          <div className="flex gap-2">
            <input
              className="w-full rounded p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm"
              placeholder="Dit fornavn"
              value={readName}
              onChange={(e) => setReadName(e.target.value)}
            />

            <button
              onClick={markAsRead}
              disabled={loading}
              className="h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition whitespace-nowrap"
            >
              ✓ Markér som læst
            </button>
          </div>
        ) : (
          <p className="text-green-600 text-sm">
            ✔️ Læst af {item.read_by}
          </p>
        )}

      </div>

      {/* KOMMENTARER */}
      <div className="mt-4">
        <HandoverComments handoverId={item.id} />
      </div>

    </div>
  )
}
