'use client'

import HandoverHistoryItem from '../../../components/HandoverHistoryItem'
import HandoverForm from '../../../components/HandoverForm'
import { useDepartment } from '@/lib/DepartmentContext'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PartiPage() {
  const params = useParams()
  const router = useRouter()
  const parti = decodeURIComponent(params.parti as string)
  const { department } = useDepartment()

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
  }, [department, parti])

  async function loadNotes() {
    const { data } = await supabase
      .from('handover_notes')
      .select('*')
      .eq('department', department)
      .eq('parti', parti)
      .order('created_at', { ascending: false })

    setItems(data || [])
  }

  async function saveNote() {
    if (!name || !receiver || !note) {
      alert('Afsender, modtager og overlevering skal udfyldes')
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
          parti,
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

      {/* HEADER */}
      <header className="relative flex items-center mb-2">
        <button
          onClick={() => router.back()}
          className="absolute left-0 text-4xl font-bold text-gray-700 dark:text-gray-300 px-3"
        >
          ←
        </button>

        <div className="w-full text-center">
          <h1 className="text-3xl font-bold">{parti}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overleveringer for {parti}
          </p>
        </div>
      </header>

      {/* FORM COMPONENT */}
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
        parti={parti}
      />

      {/* HISTORIK */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Historik</h2>

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
