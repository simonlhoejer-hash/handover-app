'use client'

import { useRouter } from 'next/navigation'
import HandoverHistoryItem from '@/components/HandoverHistoryItem'
import HandoverForm from '@/components/HandoverForm'
import { useTranslation } from '@/lib/LanguageContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
      loadNotes()
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-10">
      <header className="relative flex items-center mb-2">
        <button
          onClick={() => router.back()}
          className="absolute left-0 text-4xl font-bold text-gray-700 dark:text-gray-300 px-3"
        >
          ←
        </button>

        <div className="w-full text-center">
          <h1 className="text-3xl font-bold">{itemName}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.handoversFor} {itemName}
          </p>
        </div>
      </header>

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
        parti={itemName}
      />

      <section>
        <h2 className="text-xl font-semibold mb-4">
          {t.history}
        </h2>

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
