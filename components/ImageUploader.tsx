'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDepartment } from '@/lib/DepartmentContext'

type Props = {
  parti: string
  onUploadComplete: (url: string) => void
}

export default function ImageUploader({
  parti,
  onUploadComplete,
}: Props) {
  const { department } = useDepartment()
  const [uploading, setUploading] = useState(false)

  async function uploadImage(file: File) {
    setUploading(true)

    const ext = file.name.split('.').pop() || 'png'
    const fileName = Date.now() + '.' + ext
const safeParti = parti
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '') // fjerner æ ø å accents
  .replace(/[^a-z0-9-]/g, '-')     // kun sikre tegn

    const filePath = `${department}/${safeParti}/${fileName}`

    const { error } = await supabase.storage
      .from('handover-images')
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.error(error)
      alert(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('handover-images')
      .getPublicUrl(filePath)

    if (!data?.publicUrl) {
      alert('Kunne ikke hente public URL')
      setUploading(false)
      return
    }

    onUploadComplete(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            uploadImage(e.target.files[0])
          }
        }}
      />

      {uploading && <p>Uploader…</p>}
    </div>
  )
}
