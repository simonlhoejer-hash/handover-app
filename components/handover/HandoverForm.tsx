'use client'

import HandoverEditor from './HandoverEditor'
import ImageUploader from '../ui/ImageUploader'
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
  w-full
  rounded-3xl
  p-6 sm:p-8
  transition-all duration-300

  bg-white
  border border-black/5
  shadow-[0_20px_40px_rgba(0,0,0,0.06)]

  dark:bg-[#162338]
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

  dark:bg-[#162338]
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
}: Props) {
  const { t } = useTranslation()

  return (
<section className={cardClass}>      <input
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
        {loading ? t.saving : t.saveHandover}
      </button>
    </section>
  )
}
