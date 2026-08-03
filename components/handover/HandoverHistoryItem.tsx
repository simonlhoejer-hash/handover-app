'use client'

import { useState } from 'react'
import { secureFetch, type AccessShip } from '@/lib/secureApi'
import { localeFor, useTranslation } from '@/lib/LanguageContext'
import HandoverComments from './HandoverComments'

function isOralHandoverNote(value: string) {
  return value.includes('data-handover-type="oral"')
}

type Props = {
  item: any
  ship: AccessShip
  reload: () => void
}

export default function HandoverHistoryItem({ item, ship, reload }: Props) {
  const { t, lang } = useTranslation()

  const [readName, setReadName] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const isOral = isOralHandoverNote(item.note ?? '')

  async function markAsRead() {
    if (!readName) {
      alert(t.enterFirstName)
      return
    }

    setLoading(true)

    try {
      await secureFetch('/api/handovers', {
        method: 'POST',
        body: JSON.stringify({ action: 'mark-read', ship, id: item.id, readBy: readName }),
      })
      setReadName('')
      reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : t.couldNotSaveComment)
    }
    setLoading(false)
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

        dark:bg-[#0a3534]
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
              localeFor(lang)
            )}
          </span>

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

      {isOral ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-400/10 px-4 py-4 text-sm font-semibold text-amber-800 dark:text-amber-200">
          {t.oralHandover}
        </div>
      ) : (
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
      )}

      {item.images?.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {item.images.map((url: string) => (
            <img
              key={url}
              src={url}
              loading="lazy"
              decoding="async"
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

                dark:bg-[#0d3b3a]
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
        <HandoverComments handoverId={item.id} ship={ship} />
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
