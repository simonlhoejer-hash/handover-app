'use client'

import HandoverEditor from './HandoverEditor'
import ImageUploader from '../ui/ImageUploader'
import { localeFor, useTranslation } from '@/lib/LanguageContext'

type Props = {
  name: string
  setName: (v: string) => void
  receiver: string
  setReceiver: (v: string) => void
  date: string
  setDate: (v: string) => void
  note: string
  setNote: (v: string) => void
  images: string[]
  setImages: React.Dispatch<React.SetStateAction<string[]>>
  loading: boolean
  onSave: () => void
  parti: string
  draftStatus?: 'idle' | 'saving' | 'saved' | 'error'
  draftSavedAt?: string | null
  draftError?: string
  isOnline?: boolean
}

const cardClass = `
  w-full
  rounded-3xl
  p-6 sm:p-8
  transition-all duration-300

  bg-white
  border border-black/5
  shadow-[0_20px_40px_rgba(0,0,0,0.06)]

  dark:bg-[#0d3b3a]
  dark:border-white/10
  dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
`

const inputClass = `
  w-full
  box-border
  rounded-2xl
  px-4 py-3
  mb-4
  transition

  bg-gray-100
  text-gray-900
  border border-black/5

  dark:bg-[#082f2e]
  dark:text-white
  dark:border-white/10

  focus:outline-none
  focus:ring-2
  focus:ring-black/10
  dark:focus:ring-white/20
`

export default function HandoverForm({
  name,
  setName,
  receiver,
  setReceiver,
  date,
  setDate,
  note,
  setNote,
  images,
  setImages,
  loading,
  onSave,
  parti,
  draftStatus = 'idle',
  draftSavedAt,
  draftError,
  isOnline = true,
}: Props) {
  const { t, lang } = useTranslation()

  const draftStatusText =
    draftStatus === 'saving'
      ? t.draftSaving
      : draftStatus === 'saved'
        ? t.draftSaved
        : draftStatus === 'error'
          ? t.draftSaveFailed
          : ''

  const lastSavedText =
    draftSavedAt && draftStatus === 'saved'
      ? `${t.lastSavedAt} ${new Date(draftSavedAt).toLocaleTimeString(
          localeFor(lang),
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        )}`
      : ''
  const floatingDraftDetail =
    !isOnline
      ? t.offlineDraftNotPublished
      : draftStatus === 'error'
      ? draftError || t.draftSaveFailed
      : lastSavedText || draftStatusText || t.draftNotPublished

  return (
    <>
      <div className="fixed bottom-24 left-4 z-30 pointer-events-none">
        <div
          className={`
            max-w-[calc(100vw-2rem)] sm:max-w-xs
            rounded-2xl
            border
            px-4 py-3
            shadow-lg
            backdrop-blur-xl
            ${
              draftStatus === 'error'
                ? 'border-red-500/20 bg-red-50/95 text-red-700 dark:bg-red-500/15 dark:text-red-200'
                : 'border-amber-500/20 bg-amber-50/95 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200'
            }
          `}
        >
          <div className="text-xs font-semibold">
            {t.draftNotPublished}
          </div>
          <div className="mt-0.5 text-xs opacity-80">
            {floatingDraftDetail}
          </div>
        </div>
      </div>

<section className={cardClass}>
      <input
        className={inputClass}
        placeholder={t.senderName}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className={inputClass}
        placeholder={t.receiverName}
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
      />

<input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  className={`${inputClass} appearance-none`}
  style={{ WebkitAppearance: 'none' }}
/>

      <HandoverEditor value={note} onChange={setNote} />

      {(lastSavedText || draftError) && (
        <p
          className={`
            mt-3 text-xs
            ${
              draftStatus === 'error'
                ? 'text-red-600 dark:text-red-300'
                : 'text-gray-500 dark:text-white/60'
            }
          `}
        >
          {draftStatus === 'error' ? draftError : lastSavedText}
        </p>
      )}

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t.images}
        </label>

        {isOnline ? (
          <ImageUploader
            parti={parti}
            onUploadComplete={(url) =>
              setImages((prev) => [...prev, url])
            }
          />
        ) : (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
            {t.imagesRequireInternet}
          </p>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {images.map((url) => (
              <img
                key={url}
                src={url}
                className="h-24 w-full object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={loading || !isOnline}
className="
  w-full
  py-3
  rounded-2xl
  font-semibold
  transition-all duration-200
  active:scale-[0.98]

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
        {!isOnline ? t.requiresInternet : loading ? t.saving : t.saveHandover}
      </button>
    </section>
    </>
  )
}
