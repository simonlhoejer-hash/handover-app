'use client'

import { useRouter } from 'next/navigation'
import HandoverHistoryItem from '@/components/handover/HandoverHistoryItem'
import HandoverForm from '@/components/handover/HandoverForm'
import { useTranslation } from '@/lib/LanguageContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown } from 'lucide-react'
import { ChevronLeft } from 'lucide-react'

type Props = {
  department: 'shop' | 'galley'
  itemName: string
}

export default function HandoverPage({ department, itemName }: Props) {
  const router = useRouter()
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [receiver, setReceiver] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [itemName, department])

  async function loadNotes() {
    const { data } = await supabase
      .from('handover_notes')
      .select('*')
      .eq('department', department)
      .eq('parti', itemName)
      .order('created_at', { ascending: false })

    setItems(data || [])
  }

  async function saveNote() {
    if (!name || !receiver || !note) {
      alert(t.requiredFields)
      return
    }

    setLoading(true)

    let error

    if (editingId) {
      const result = await supabase
        .from('handover_notes')
        .update({
          author_name: name,
          receiver_name: receiver,
          shift_date: date,
          note,
          images,
        })
        .eq('id', editingId)

      error = result.error
    } else {
      const result = await supabase
        .from('handover_notes')
        .insert({
          department,
          author_name: name,
          receiver_name: receiver,
          parti: itemName,
          shift_date: date,
          note,
          images,
        })

      error = result.error
    }

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      setNote('')
      setImages([])
      setReceiver('')
      setEditingId(null)
      await loadNotes()
      setOpen(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-8">

      {/* HEADER */}
      <header className="relative flex items-center justify-center">

<button
  onClick={() => router.back()}
  className="
    absolute left-0
    flex items-center justify-center
    w-10 h-10
    rounded-full
    transition-all duration-200
    active:scale-95

    bg-white
    border border-black/5
    shadow-sm

    dark:bg-white/5
    dark:border-white/10
    dark:shadow-[0_5px_20px_rgba(0,0,0,0.6)]
  "
>
  <span className="text-lg text-gray-700 dark:text-white/80">
    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-white/80" />
  </span>
</button>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {itemName}
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.handoversFor} {itemName}
          </p>
        </div>

      </header>

      {/* 🔥 TOGGLE BJÆLKE ØVERST */}
      <section className="space-y-4">

<button
  onClick={() => setOpen(!open)}
className="
  group
  w-full
  flex items-center justify-between
  px-6 py-4
  rounded-3xl
  text-lg font-semibold
  transition-all duration-300
  active:scale-[0.98]

  bg-white
  border border-black/5
  shadow-[0_10px_30px_rgba(0,0,0,0.06)]

  dark:bg-white/5
  dark:border-white/10
  dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)]
"
>
  <span className="tracking-tight text-gray-900 dark:text-white">
    Ny overlevering
  </span>

  <ChevronDown
    className={`
      text-gray-500 dark:text-gray-300
      transition-all duration-300
      ${open ? 'rotate-180 scale-110' : ''}
      group-hover:scale-110
    `}
  />
</button> 

        <div
          className={`
            overflow-hidden
            transition-all
            duration-500
            ease-in-out
            will-change-[max-height,opacity]
            ${open ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
            <HandoverForm
              name={name}
              setName={setName}
              receiver={receiver}
              setReceiver={setReceiver}
              date={date}
              setDate={setDate}
              note={note}
              setNote={setNote}
              images={images}
              setImages={setImages}
              loading={loading}
              onSave={saveNote}
              parti={department}
            />
          </div>
        </div>

      </section>

      {/* HISTORY SECTION */}
      <section className="space-y-4">

        <div className="
          text-xs
          uppercase
          tracking-wider
          text-gray-500 dark:text-gray-400
        ">
          {t.history}
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <HandoverHistoryItem
              key={item.id}
              item={item}
              reload={loadNotes}
            />
          ))}
        </div>

      </section>

    </main>
  )
}