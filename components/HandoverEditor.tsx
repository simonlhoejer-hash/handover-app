'use client'

import { useLayoutEffect, useRef } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
}

const TEMPLATE = `
Nye tiltag:
• 

Udfordringer:
• 

Vigtigt:
• 

Rengøring:
• 
`

export default function HandoverEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // 📝 Indsæt skabelon hvis tom
  useLayoutEffect(() => {
    if (!value || value.trim() === '') {
      onChange(TEMPLATE)
    }
  }, [])

  // 🔁 Auto-grow textarea (mobil-safe)
  useLayoutEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height =
      textareaRef.current.scrollHeight + 'px'
  }, [value])

  function insertBullet() {
    if (!textareaRef.current) return

    const newValue =
      value.trim() === ''
        ? '• '
        : value + '\n• '

    onChange(newValue)

    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current!.selectionStart =
        textareaRef.current!.selectionEnd =
          newValue.length
    })
  }

  return (
    <div>
      {/* TOOLBAR */}
      <div className="mb-2">
        <button
          type="button"
          onClick={insertBullet}
          className="
            flex items-center gap-2
            px-4 py-2
            rounded-full
            text-sm font-semibold
            bg-white/90 dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            border border-gray-300 dark:border-gray-600
            shadow-sm
            hover:bg-gray-100 dark:hover:bg-gray-700
            active:scale-[0.97]
            transition
          "
        >
          <span className="text-lg leading-none">•</span>
          Punkt
        </button>
      </div>

      {/* OVERLEVERING */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          box-border
          min-h-[220px]
          rounded
          p-3
          mb-3
          bg-gray-100 text-gray-900
          dark:bg-gray-700 dark:text-gray-100
          border border-gray-300 dark:border-gray-600
          focus:outline-none
          focus:ring-2 focus:ring-blue-500/40
          resize-none
        "
      />
    </div>
  )
}
