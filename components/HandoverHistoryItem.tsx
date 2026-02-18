'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/LanguageContext'
import HandoverComments from './HandoverComments'
import HandoverEditor from './HandoverEditor'

type Props = {
  item: any
  reload: () => void
}

export default function HandoverHistoryItem({ item, reload }: Props) {
  const { t, lang } = useTranslation()

  const [isEditing, setIsEditing] = useState(false)
  const [note, setNote] = useState(item.note)
  const [readName, setReadName] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  async function saveEdit() {
    if (item.read_by) {
      alert(t.cannotEditRead)
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
      alert(t.enterFirstName)
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">

      {/* ✅ NEW HEADER (mobil-venlig) */}
      <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">

        {/* Top row: Dato + Edit */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 text-xs font-medium rounded-full 
                           bg-gray-100 text-gray-700 
                           dark:bg-gray-700 dark:text-gray-300">
            {new Date(item.shift_date).toLocaleDateString(
              lang === 'sv' ? 'sv-SE' : 'da-DK'
            )}
          </span>

          {!isEditing && !item.read_by && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs font-medium rounded-full 
                         bg-gray-100 text-gray-700 
                         dark:bg-gray-700 dark:text-gray-300
                         hover:opacity-80 transition"
            >
              {t.edit}
            </button>
          )}
        </div>

        {/* Centered names */}
        <div className="text-center text-lg sm:text-xl font-semibold tracking-tight">
          <span className="text-gray-900 dark:text-gray-100">
            {item.author_name}
          </span>

          <span className="mx-3 text-gray-400 font-normal">→</span>

          <span className="text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {item.receiver_name}
          </span>
        </div>

      </div>

      {isEditing ? (
        <>
          <HandoverEditor value={note} onChange={setNote} />

          <div className="flex gap-3 mt-4">
            <button
              onClick={saveEdit}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
            >
              {t.save}
            </button>

            <button
              onClick={() => {
                setNote(item.note)
                setIsEditing(false)
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg text-sm"
            >
              {t.cancel}
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: item.note }}
          />

          {item.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {item.images.map((url: string) => (
                <img
                  key={url}
                  src={url}
                  onClick={() => setSelectedImage(url)}
                  className="h-24 w-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-4">
        {!item.read_by ? (
          <div className="flex gap-3">
            <input
              className="w-full rounded-lg p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm"
              placeholder={t.firstNamePlaceholder}
              value={readName}
              onChange={(e) => setReadName(e.target.value)}
            />

            <button
              onClick={markAsRead}
              disabled={loading}
              className="h-[40px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition whitespace-nowrap"
            >
              {t.markAsRead}
            </button>
          </div>
        ) : (
          <p className="text-green-600 text-sm font-medium">
            {t.readBy} {item.read_by}
          </p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
        <HandoverComments handoverId={item.id} />
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
          />
        </div>
      )}

    </div>
  )
}
