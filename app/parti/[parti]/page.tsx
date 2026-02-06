'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const cardClass = `
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  rounded-xl shadow
`

const inputClass = `
  w-full rounded p-2
  bg-gray-100 text-gray-900
  dark:bg-gray-700 dark:text-gray-100
  border border-gray-300 dark:border-gray-600
`

const dateInputClass = `
  w-full rounded p-2 h-[42px]
  appearance-none
  bg-gray-100 text-gray-900
  dark:bg-gray-700 dark:text-gray-100
  border border-gray-300 dark:border-gray-600
`

export default function PartiPage() {
  const params = useParams()
  const router = useRouter()
  const parti = decodeURIComponent(params.parti as string)

  const [name, setName] = useState('')
  const [receiver, setReceiver] = useState('')
  const [fromTeam, setFromTeam] = useState('Hold 1')
  const [toTeam, setToTeam] = useState('Hold 2')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  // 🔑 VIGTIGT: ét read-navn pr. overlevering
  const [readNames, setReadNames] = useState<Record<string, string>>({})

  const teams = ['Hold 1', 'Hold 2', 'Hold 3', 'Hold 4']

  useEffect(() => {
    loadNotes()
  }, [])

  async function loadNotes() {
    const { data } = await supabase
      .from('handover_notes')
      .select('*')
      .eq('parti', parti)
      .order('created_at', { ascending: false })

    setItems(data || [])
  }

  async function uploadImage(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png']
    const maxSize = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      alert('Kun JPG og PNG er tilladt')
      return
    }

    if (file.size > maxSize) {
      alert('Billedet må max være 5 MB')
      return
    }

    setUploading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const filePath = `${parti}/${fileName}`

    const { error } = await supabase.storage
      .from('handover-images')
      .upload(filePath, file)

    if (error) {
      alert('Fejl ved upload af billede')
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('handover-images')
      .getPublicUrl(filePath)

    setImages((prev) => [...prev, data.publicUrl])
    setUploading(false)
  }

  async function saveNote() {
    if (!name || !receiver || !note) {
      alert('Afsender, modtager og overlevering skal udfyldes')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('handover_notes').insert({
      author_name: name,
      receiver_name: receiver,
      parti,
      from_team: fromTeam,
      to_team: toTeam,
      shift_date: date,
      note,
      images,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      setNote('')
      setImages([])
      setReceiver('')
      loadNotes()
    }
  }

  async function markAsRead(id: string) {
    const readBy = readNames[id]

    if (!readBy) {
      alert('Skriv dit fornavn for at kvittere')
      return
    }

    const { error } = await supabase
      .from('handover_notes')
      .update({
        read_by: readBy,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      setReadNames((prev) => ({ ...prev, [id]: '' }))
      loadNotes()
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-10">
      {/* HEADER */}
      <header className="relative text-center">
        <button
          onClick={() => router.back()}
          className="absolute left-0 text-3xl px-3"
        >
          ←
        </button>
        <h1 className="text-3xl font-bold">{parti}</h1>
        <p className="text-gray-500">Overleveringer for {parti}</p>
      </header>

      {/* NY OVERLEVERING */}
      <section className={`${cardClass} p-6 space-y-3`}>
        <h2 className="text-xl font-semibold">Ny overlevering</h2>

        <input className={inputClass} placeholder="Dit navn (afsender)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Modtager (hvem skal læse)" value={receiver} onChange={(e) => setReceiver(e.target.value)} />

        <div className="flex gap-2">
          <select className={inputClass} value={fromTeam} onChange={(e) => setFromTeam(e.target.value)}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className={inputClass} value={toTeam} onChange={(e) => setToTeam(e.target.value)}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <input type="date" className={dateInputClass} value={date} onChange={(e) => setDate(e.target.value)} />

        <textarea className={`${inputClass} h-28`} placeholder="Skriv overlevering..." value={note} onChange={(e) => setNote(e.target.value)} />

        <input type="file" accept="image/*" onChange={(e) => e.target.files && uploadImage(e.target.files[0])} />

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((url) => (
              <img key={url} src={url} onClick={() => setActiveImage(url)} className="h-24 w-full object-cover rounded cursor-pointer" />
            ))}
          </div>
        )}

        <button onClick={saveNote} className="w-full py-3 rounded bg-black text-white">
          Gem overlevering
        </button>
      </section>

      {/* HISTORIK */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Historik</h2>

        {items.map((item) => (
          <div key={item.id} className={`${cardClass} p-4 space-y-2`}>
            <div className="text-sm text-gray-500">
              {new Date(item.shift_date).toLocaleDateString('da-DK')} · {item.author_name} → {item.receiver_name}
            </div>

            <div className="text-sm text-gray-400">
              {item.from_team} → {item.to_team}
            </div>

            <div>{item.note}</div>

            {item.read_by ? (
              <div className="text-green-600 text-sm">
                ✔ Læst af {item.read_by}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Dit fornavn"
                  value={readNames[item.id] || ''}
                  onChange={(e) =>
                    setReadNames((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                />
                <button
                  onClick={() => markAsRead(item.id)}
                  className="bg-green-600 text-white px-4 rounded"
                >
                  Markér som læst
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      {activeImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center" onClick={() => setActiveImage(null)}>
          <img src={activeImage} className="max-h-[90vh] max-w-[90vw] rounded" />
        </div>
      )}
    </main>
  )
}
