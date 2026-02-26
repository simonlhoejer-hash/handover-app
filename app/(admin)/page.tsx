'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PARTIS } from '@/lib/partis'

export default function Page() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  const [department, setDepartment] = useState('galley')
  const [parti, setParti] = useState(PARTIS.galley[0])
  const [type, setType] = useState<'ret' | 'menukort' | 'opskrift'>('ret')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // 🔐 Husk login
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin-auth')
    if (savedAuth === 'true') {
      setAuthenticated(true)
    }
  }, [])

  // Skift parti automatisk når afdeling ændres
  useEffect(() => {
    setParti(PARTIS[department][0])
  }, [department])

  const handleLogin = () => {
    if (password === 'Handover') {
      setAuthenticated(true)
      localStorage.setItem('admin-auth', 'true')
    } else {
      alert('Forkert kode')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('admin-auth')
  }

const handleUpload = async () => {
  if (!file || !parti || !title) {
    alert('Udfyld alle felter')
    return
  }

  setUploading(true)

  // 🔥 Rens filnavn
  const cleanFileName = file.name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/\s+/g, '-')          // mellemrum → -
    .replace(/[^a-z0-9.-]/g, '')   // fjern alt andet

  const filePath = `${department}/${parti}/${Date.now()}-${cleanFileName}`

  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, file)

  if (uploadError) {
    alert(uploadError.message)
    setUploading(false)
    return
  }

  const { data: publicUrlData } = supabase.storage
    .from('materials')
    .getPublicUrl(filePath)

  const publicUrl = publicUrlData.publicUrl

  await supabase.from('materials').insert({
    department,
    parti,
    type,
    title,
    file_url: type !== 'ret' ? publicUrl : null,
    image_url: type === 'ret' ? publicUrl : null,
  })

  alert('Uploadet!')
  setTitle('')
  setFile(null)
  setUploading(false)
}

  // 🔐 LOGIN VIEW
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <section className="w-full max-w-md rounded-3xl p-8 space-y-6 bg-white border border-black/5 shadow-xl dark:bg-[#162338] dark:border-white/10">
          <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
            Admin Login
          </h1>

          <input
            type="password"
            placeholder="Indtast kode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 bg-gray-100 dark:bg-[#1d2e46]"
          />

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black"
          >
            Log ind
          </button>
        </section>
      </main>
    )
  }

  // 🔥 ADMIN VIEW
  return (
    <main className="min-h-screen px-4 pt-10 pb-24 space-y-10">

      {/* HEADER */}
      <section className="rounded-3xl p-6 flex justify-between items-center bg-white border border-black/5 shadow-md dark:bg-[#162338] dark:border-white/10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          HandoverPro Admin
        </h1>

        <button
          onClick={handleLogout}
          className="px-5 py-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black"
        >
          Log ud
        </button>
      </section>

      {/* UPLOAD */}
      <section className="rounded-3xl p-8 space-y-6 bg-white border border-black/5 shadow-md dark:bg-[#162338] dark:border-white/10">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Upload materiale
        </h2>

        <div className="space-y-4">

          {/* Department */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
          >
            <option value="galley">Galley</option>
            <option value="shop">Shop</option>
          </select>

          {/* Parti */}
          <select
            value={parti}
            onChange={(e) => setParti(e.target.value)}
            className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
          >
            {PARTIS[department].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Type */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
          >
            <option value="ret">Billede (Galleri)</option>
            <option value="menukort">Menukort (PDF)</option>
            <option value="opskrift">Opskrift (PDF)</option>
          </select>

          {/* Title */}
          <input
            placeholder="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
          />

          {/* File */}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black"
          >
            {uploading ? 'Uploader...' : 'Upload'}
          </button>

        </div>
      </section>

    </main>
  )
}