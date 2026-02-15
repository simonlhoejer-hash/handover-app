'use client'

import { useDepartment } from '@/lib/DepartmentContext'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HandoverComments from '../../../components/HandoverComments'
import HandoverEditor from '../../../components/HandoverEditor'
import ImageUploader from '../../../components/ImageUploader'

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
  const [activeImage, setActiveImage] = useState<string | null>(null)

  const [readName, setReadName] = useState('')
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

  async function markAsRead(id: string) {
    if (!readName) {
      alert('Skriv dit fornavn for at kvittere')
      return
    }

    const { error } = await supabase
      .from('handover_notes')
      .update({
        read_by: readName,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
    } else {
      setReadName('')
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
          <h1 className="text-3xl font-bold">{parti}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overleveringer for {parti}
          </p>
        </div>
      </header>

      <section className={`${cardClass} p-6`}>
        <h2 className="text-xl font-semibold mb-4">Ny overlevering</h2>

        <input
          className={inputClass}
          placeholder="Dit navn (afsender)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className={inputClass}
          placeholder="Modtager (hvem skal læse)"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
        />

<input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  className={`
    w-full
    box-border
    rounded
    p-2
    pr-2
    mb-3
    bg-gray-100 text-gray-900
    dark:bg-gray-700 dark:text-gray-100
    border border-gray-300 dark:border-gray-600
    appearance-none
  `}
/>


        <HandoverEditor value={note} onChange={setNote} />

        <div className="mb-4">
          <label className="block font-medium mb-1">Billeder</label>
          <p className="text-sm text-gray-500 mb-2">
            JPG eller PNG · max 5 MB pr. billede
          </p>

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
                  onClick={() => setActiveImage(url)}
                  className="h-24 w-full object-cover rounded cursor-pointer hover:opacity-80"
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={saveNote}
          disabled={loading}
          className="
            w-full py-3 rounded font-semibold transition
            bg-black text-white
            dark:bg-white dark:text-black
            hover:opacity-90
            disabled:opacity-50
          "
        >
          {loading ? 'Gemmer...' : 'Gem overlevering'}
        </button>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Historik</h2>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className={`${cardClass} p-4`}>
              <div className="text-sm text-gray-500 mb-1">
                {new Date(item.shift_date).toLocaleDateString('da-DK')} ·{' '}
                {item.author_name} → {item.receiver_name || 'Ukendt'}
              </div>

              <div className="whitespace-pre-line">{item.note}</div>

              {item.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {item.images.map((url: string) => (
                    <img
                      key={url}
                      src={url}
                      onClick={() => setActiveImage(url)}
                      className="h-24 w-full object-cover rounded cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              )}

              {!item.read_by ? (
                <div className="mt-3 flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="Dit fornavn"
                    value={readName}
                    onChange={(e) => setReadName(e.target.value)}
                  />
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="h-[42px] px-4 rounded bg-green-600 text-white font-semibold"
                  >
                    Markér som læst
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-green-600 text-sm">
                  ✔️ Læst af {item.read_by}
                </p>
              )}

              <HandoverComments
                key={item.id}
                handoverId={item.id}
              />
            </div>
          ))}
        </div>
      </section>

      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
          onClick={() => setActiveImage(null)}
        >
          <img
            src={activeImage}
            className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
          />
        </div>
      )}
    </main>
  )
}
