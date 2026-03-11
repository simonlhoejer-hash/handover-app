'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PARTIS } from '@/lib/partis'

export default function UploadMaterials() {
  const [department, setDepartment] = useState('galley')
  const [parti, setParti] = useState(PARTIS.galley[0])
  const [type, setType] = useState<'ret' | 'menukort' | 'opskrift'>('ret')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setParti(PARTIS[department][0])
  }, [department])

  const handleUpload = async () => {
    if (!file || !parti || !title) {
      alert('Udfyld alle felter')
      return
    }

    setUploading(true)

    const cleanFileName = file.name
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'oe')
      .replace(/å/g, 'aa')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.-]/g, '')

    const filePath = `${department}/${parti}/${Date.now()}-${cleanFileName}`

    const { error } = await supabase.storage
      .from('materials')
      .upload(filePath, file)

    if (error) {
      alert(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath)

    await supabase.from('materials').insert({
      department,
      parti,
      type,
      title,
      file_url: type !== 'ret' ? data.publicUrl : null,
      image_url: type === 'ret' ? data.publicUrl : null,
    })

    alert('Uploadet!')
    setTitle('')
    setFile(null)
    setUploading(false)
  }

  return (
    <section className="rounded-3xl p-8 space-y-6 bg-white border border-black/5 shadow-md dark:bg-[#162338] dark:border-white/10">

      <h2 className="text-2xl font-semibold">
        Upload materiale
      </h2>

      <div className="space-y-4">

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
        >
          <option value="galley">Galley</option>
          <option value="shop">Shop</option>
        </select>

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

        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
        >
          <option value="ret">Billede (Galleri)</option>
          <option value="menukort">Menukort (PDF)</option>
          <option value="opskrift">Opskrift (PDF)</option>
        </select>

        <input
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46]"
        />

        {/* PRO FILE UPLOAD */}
        <label className="w-full flex items-center justify-between rounded-xl p-3 bg-gray-100 dark:bg-[#1d2e46] cursor-pointer">

          <span className="text-sm truncate">
            {file ? file.name : 'Vælg fil'}
          </span>

          <span className="px-3 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm">
            Upload
          </span>

          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

        </label>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black"
        >
          {uploading ? 'Uploader...' : 'Upload'}
        </button>

      </div>

    </section>
  )
}