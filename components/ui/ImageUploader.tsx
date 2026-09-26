'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { secureFetch, type AccessShip } from '@/lib/secureApi'
import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  parti: string
  onUploadComplete: (url: string) => void
  compact?: boolean
}

const MAX_SIZE_MB = 5
const MAX_DIMENSION = 2400
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

export default function ImageUploader({
  parti,
  onUploadComplete,
  compact = false,
}: Props) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const ship: AccessShip = pathname.startsWith('/pearl') ? 'pearl' : 'crown'

  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  async function prepareImage(file: File) {
    if (!file.type.startsWith('image/')) {
      alert(t.onlyPngJpg)
      return null
    }

    try {
      const bitmap = await createImageBitmap(file)
      if (file.size <= MAX_BYTES && bitmap.width <= MAX_DIMENSION && bitmap.height <= MAX_DIMENSION && ['image/png', 'image/jpeg'].includes(file.type)) {
        bitmap.close()
        return file
      }

      const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas unavailable')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()

      let quality = 0.86
      let blob = await canvasBlob(canvas, quality)
      while (blob && blob.size > MAX_BYTES && quality > 0.5) {
        quality -= 0.08
        blob = await canvasBlob(canvas, quality)
      }
      if (!blob || blob.size > MAX_BYTES) throw new Error('Image remains too large')
      return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'billede'}.jpg`, { type: 'image/jpeg' })
    } catch {
      alert(t.couldNotReadImage)
      return null
    }
  }

  async function uploadImage(file: File) {
    setUploading(true)
    const preparedFile = await prepareImage(file)
    if (!preparedFile) {
      setUploading(false)
      setPreviewUrl(null)
      return
    }

    const form = new FormData()
    form.set('ship', ship)
    form.set('parti', parti)
    form.set('file', preparedFile)

    let uploadUrl = ''
    try {
      const result = await secureFetch<{ url: string }>('/api/handover-images', {
        method: 'POST',
        body: form,
      })
      uploadUrl = result.url
    } catch (error) {
      alert(error instanceof Error ? error.message : t.couldNotGetUrl)
      setUploading(false)
      setPreviewUrl(null)
      return
    }

    if (!uploadUrl) {
      alert(t.couldNotGetUrl)
      setUploading(false)
      setPreviewUrl(null)
      return
    }

    if (!cancelled) {
      onUploadComplete(uploadUrl)
    }

    setUploading(false)
    setPreviewUrl(null)
    setCancelled(false)
  }

  return (
    <div className={compact ? '' : 'space-y-4'}>

      <div className="flex items-center gap-4 flex-wrap">

        {/* Upload button */}
        <label
          className={compact ? `
            inline-flex min-h-9 cursor-pointer items-center rounded-lg px-3
            text-xs font-semibold text-gray-600 transition
            hover:bg-black/5 active:scale-95
            dark:text-white/70 dark:hover:bg-white/10
          ` : `
            px-5 py-2.5
            rounded-2xl
            text-sm font-semibold
            cursor-pointer
            transition-all duration-200
            active:scale-95

            bg-black
            text-white
            shadow-md

            dark:bg-white
            dark:text-black
            dark:shadow-lg

            hover:opacity-90
          `}
        >
          {compact ? 'Tilføj billede' : t.chooseFile}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return

              setCancelled(false)

              const objectUrl = URL.createObjectURL(file)
              setPreviewUrl(objectUrl)

              uploadImage(file)
              e.target.value = ''
            }}
          />
        </label>

        {uploading && (
          <span className="text-sm text-gray-500 dark:text-white/60">
            {t.uploading}
          </span>
        )}

        {/* Preview */}
        {previewUrl && !compact && (
          <div className="relative w-24 h-24">

            <img
              src={previewUrl}
              alt={t.preview}
              className="
                w-24 h-24
                object-cover
                rounded-2xl

                border border-black/5
                shadow-[0_10px_25px_rgba(0,0,0,0.08)]

                dark:border-white/10
              "
            />

            {!uploading && (
              <button
                type="button"
                onClick={() => {
                  setCancelled(true)
                  setPreviewUrl(null)
                }}
                className="
                  absolute -top-2 -right-2
                  w-7 h-7
                  rounded-full
                  flex items-center justify-center
                  text-xs font-bold
                  transition-all duration-200
                  active:scale-90

                  bg-black
                  text-white
                  shadow-md

                  dark:bg-white
                  dark:text-black
                "
              >
                âœ•
              </button>
            )}

            {uploading && (
              <div
                className="
                  absolute inset-0
                  rounded-2xl
                  bg-black/60
                  flex items-center justify-center
                  text-white text-xs font-medium
                "
              >
                ...
              </div>
            )}

          </div>
        )}

      </div>

      {!compact && <p className="text-xs text-gray-500 dark:text-white/50">{t.imageHelp}</p>}

    </div>
  )
}


