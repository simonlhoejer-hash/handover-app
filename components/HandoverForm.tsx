'use client'

import HandoverEditor from './HandoverEditor'
import ImageUploader from './ImageUploader'
import { useTranslation } from '@/lib/LanguageContext'

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
}

const cardClass = `
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  rounded-xl shadow
`

const inputClass = `
  w-full
  box-border
  rounded
  p-2
  mb-3
  bg-gray-100 text-gray-900
  dark:bg-gray-700 dark:text-gray-100
  border border-gray-300 dark:border-gray-600
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
}: Props) {
  const { t } = useTranslation()

  return (
    <section className={`${cardClass} p-6`}>
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

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t.images}
        </label>

        <ImageUploader
          parti={parti}
          onUploadComplete={(url) =>
            setImages((prev) => [...prev, url])
          }
        />

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
        disabled={loading}
        className="
          w-full py-3 rounded font-semibold transition
          bg-black text-white
          dark:bg-white dark:text-black
          hover:opacity-90
          disabled:opacity-50
        "
      >
        {loading ? t.saving : t.saveHandover}
      </button>
    </section>
  )
}
