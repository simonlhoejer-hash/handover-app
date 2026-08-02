'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { secureFetch, type AccessShip } from '@/lib/secureApi'
import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  parti: string
  onUploadComplete: (url: string) => void
}

const MAX_SIZE_MB = 5
const MAX_WIDTH = 4000
const MAX_HEIGHT = 4000

export default function ImageUploader({
  parti,
  onUploadComplete,
}: Props) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const ship: AccessShip = pathname.startsWith('/pearl') ? 'pearl' : 'crown'

  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  async function validateImage(file: File) {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert(t.onlyPngJpg)
      return false
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`${t.imageMaxSize} ${MAX_SIZE_MB}MB`)
      return false
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    return new Promise<boolean>((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
          alert(`${t.imageMaxSize} ${MAX_WIDTH}x${MAX_HEIGHT}px`)
          resolve(false)
        } else {
          resolve(true)
        }
      }

      img.onerror = () => {
        alert(t.couldNotReadImage)
        resolve(false)
      }

      img.src = objectUrl
    })
  }

  async function uploadImage(file: File) {
    const isValid = await validateImage(file)
    if (!isValid) {
      setPreviewUrl(null)
      return
    }

    setUploading(true)

    const form = new FormData()
    form.set('ship', ship)
    form.set('parti', parti)
    form.set('file', file)

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
    <div className="space-y-4">

      <div className="flex items-center gap-4 flex-wrap">

        {/* Upload button */}
        <label
          className="
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
          "
        >
          {t.chooseFile}
          <input
            type="file"
            accept="image/png,image/jpeg"
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
        {previewUrl && (
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

      <p className="text-xs text-gray-500 dark:text-white/50">
        {t.imageHelp}
      </p>

    </div>
  )
}


