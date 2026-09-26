'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, List, Underline as UnderlineIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  toolbarExtra?: ReactNode
}

export default function StructuredSectionEditor({ label, value, onChange, toolbarExtra }: Props) {
  const onChangeRef = useRef(onChange)
  const containerRef = useRef<HTMLDivElement>(null)
  const [toolbarOpen, setToolbarOpen] = useState(false)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Skriv kort og konkret…',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => onChangeRef.current(currentEditor.getHTML()),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setToolbarOpen(false)
    }
    document.addEventListener('pointerdown', closeWhenClickingOutside)
    return () => document.removeEventListener('pointerdown', closeWhenClickingOutside)
  }, [])

  if (!editor) return <div className="min-h-36" />

  const toolClass = (active: boolean) => `
    inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold
    transition active:scale-95
    ${active
      ? 'bg-teal-800 text-white dark:bg-white dark:text-[#083b3a]'
      : 'text-gray-600 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10'}
  `

  return (
    <div ref={containerRef} onFocusCapture={() => setToolbarOpen(true)} className="rounded-xl border border-black/[0.06] bg-white/60 transition-colors focus-within:border-teal-700/25 dark:border-white/10 dark:bg-black/10">
      <EditorContent
        editor={editor}
        aria-label={label}
        className="min-h-28 overflow-visible px-4 py-3 text-[16px] leading-relaxed text-gray-900 outline-none dark:text-white [&_.ProseMirror]:h-auto [&_.ProseMirror]:min-h-24 [&_.ProseMirror]:overflow-visible [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] dark:[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-white/30 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1"
      />
      <div className={`flex flex-wrap gap-1 overflow-hidden px-2 transition-all duration-200 ${toolbarOpen ? 'max-h-14 border-t border-black/[0.06] py-2 opacity-100 pointer-events-auto dark:border-white/10' : 'max-h-0 border-t border-transparent py-0 opacity-0 pointer-events-none'}`}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={toolClass(editor.isActive('bold'))} aria-label={`Fed tekst i ${label}`}>
          <Bold className="h-4 w-4" />
          <span className="hidden sm:inline">Fed</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolClass(editor.isActive('underline'))} aria-label={`Understreg tekst i ${label}`}>
          <UnderlineIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Understreg</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolClass(editor.isActive('bulletList'))} aria-label={`Punktliste i ${label}`}>
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Punkter</span>
        </button>
        {toolbarExtra}
      </div>
    </div>
  )
}
