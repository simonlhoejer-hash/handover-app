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
  w-full rounded p-2 mb-3
  bg-gray-100 text-gray-900
  dark:bg-gray-700 dark:text-gray-100
  border border-gray-300 dark:border-gray-600
`

const dateInputClass = `
  w-full rounded mb-3
  px-2 py-2
  h-[42px]
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

  // 🔑 navn på den kok, der LÆSER overleveringen
  const [readName, setReadName] = useState('')

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

    const { error } = await supabase
      .from('handover_notes')
      .insert({
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

  // ✅ MODTAGER KVITTERER
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

      {/* NY OVERLEVERING */}
      <section className={`${cardClass} p-6`}>
        <h2 className="text-xl font-semibold mb-4">Ny overlevering</h2>

        <input className={inputClass} placeholder="Dit navn (afsender)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Modtager (hvem skal læse)" value={receiver} onChange={(e) => setReceiver(e.target.value)} />

        <textarea
          className={`${inputClass} h-32`}
          placeholder="Skriv overlevering..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button onClick={saveNote} disabled={loading} className="w-full py-3 rounded font-semibold bg-black text-white">
          Gem overlevering
        </button>
      </section>

      {/* HISTORIK */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Historik</h2>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className={`${cardClass} p-4`}>
              <div className="text-sm text-gray-500 mb-1">
                {item.author_name} → {item.receiver_name}
              </div>

              <div>{item.note}</div>

              {/* LÆST / IKKE LÆST */}
              {item.read_by ? (
                <p className="mt-2 text-green-600 text-sm">
                  ✔️ Læst af {item.read_by} kl.{' '}
                  {new Date(item.read_at).toLocaleTimeString('da-DK', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="Dit fornavn"
                    value={readName}
                    onChange={(e) => setReadName(e.target.value)}
                  />
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="px-4 py-2 rounded bg-green-600 text-white"
                  >
                    Markér som læst
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {activeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center" onClick={() => setActiveImage(null)}>
          <img src={activeImage} className="max-h-[90vh] max-w-[90vw] rounded" />
        </div>
      )}
    </main>
  )
}
