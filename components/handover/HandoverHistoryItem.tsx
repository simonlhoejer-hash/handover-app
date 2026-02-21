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
    <div
      className="
        w-full
        rounded-3xl
        p-6 sm:p-8
        transition-all duration-300

        bg-white
        border border-black/5
        shadow-[0_20px_40px_rgba(0,0,0,0.06)]

        dark:bg-[#101c2f]
        dark:border-white/10
        dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
      "
    >
      {/* HEADER */}
      <div className="pb-6 mb-6 border-b border-black/5 dark:border-white/10">

        <div className="flex items-center justify-between mb-4">

          <span
            className="
              px-3 py-1
              text-xs font-medium
              rounded-full
              bg-black/5 text-gray-700
              dark:bg-white/10 dark:text-white/80
            "
          >
            {new Date(item.shift_date).toLocaleDateString(
              lang === 'sv' ? 'sv-SE' : 'da-DK'
            )}
          </span>

          {!isEditing && !item.read_by && (
            <button
              onClick={() => setIsEditing(true)}
              className="
                px-3 py-1
                text-xs font-medium
                rounded-full
                bg-black/5 text-gray-700
                dark:bg-white/10 dark:text-white/80
                hover:opacity-80 transition
              "
            >
              {t.edit}
            </button>
          )}
        </div>

        {/* Names */}
        <div className="flex flex-col items-center gap-3 text-center">

          <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {item.author_name}
          </div>

          <div className="text-gray-400 dark:text-white/30">
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path
                d="M12 5v14M12 19l-5-5M12 19l5-5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {item.receiver_name}
          </div>

        </div>
      </div>

      {isEditing ? (
        <>
          <HandoverEditor value={note} onChange={setNote} />

          <div className="flex gap-3 mt-4">
            <button
              onClick={saveEdit}
              disabled={loading}
              className="
                px-4 py-2
                rounded-2xl
                font-medium
                bg-black text-white
                dark:bg-white dark:text-black
                transition active:scale-95
              "
            >
              {t.save}
            </button>

            <button
              onClick={() => {
                setNote(item.note)
                setIsEditing(false)
              }}
              className="
                px-4 py-2
                rounded-2xl
                bg-black/5 text-gray-700
                dark:bg-white/10 dark:text-white/80
              "
            >
              {t.cancel}
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="
              prose
              dark:prose-invert
              max-w-none
              text-gray-800
              dark:text-white/90
              prose-p:leading-relaxed
            "
            dangerouslySetInnerHTML={{ __html: item.note }}
          />

          {item.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {item.images.map((url: string) => (
                <img
                  key={url}
                  src={url}
                  onClick={() => setSelectedImage(url)}
                  className="
                    h-24 w-full object-cover
                    rounded-2xl
                    cursor-pointer
                    hover:opacity-80 transition
                  "
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Mark as read */}
      <div className="border-t border-black/5 dark:border-white/10 mt-6 pt-4">
        {!item.read_by ? (
          <div className="flex gap-3">
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
              placeholder={t.firstNamePlaceholder}
              value={readName}
              onChange={(e) => setReadName(e.target.value)}
            />

            <button
              onClick={markAsRead}
              disabled={loading}
              className="
                h-[44px]
                px-5
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
              "
            >
              {t.markAsRead}
            </button>
          </div>
        ) : (
          <p className="text-emerald-600 text-sm font-medium">
            {t.readBy} {item.read_by}
          </p>
        )}
      </div>

      {/* Comments */}
      <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 flex justify-center">
        <HandoverComments handoverId={item.id} />
      </div>

      {/* Image modal */}
      {selectedImage && (
        <div
          className="
            fixed inset-0
            backdrop-blur-md
            bg-black/70
            flex items-center justify-center
            z-50
            p-6
          "
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="max-h-[90vh] max-w-[90vw] rounded-3xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}