'use client'

import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, List, Underline as UnderlineIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
}

export default function StructuredSectionEditor({ label, value, onChange }: Props) {
  const onChangeRef = useRef(onChange)
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

  if (!editor) return <div className="min-h-36" />

  const toolClass = (active: boolean) => `
    inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold
    transition active:scale-95
    ${active
      ? 'bg-teal-800 text-white dark:bg-white dark:text-[#083b3a]'
      : 'text-gray-600 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10'}
  `

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white/60 focus-within:border-teal-700/25 dark:border-white/10 dark:bg-black/10">
      <EditorContent
        editor={editor}
        aria-label={label}
        className="min-h-28 px-4 py-3 text-[16px] leading-relaxed text-gray-900 outline-none dark:text-white [&_.ProseMirror]:min-h-24 [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] dark:[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-white/30 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1"
      />
      <div className="flex flex-wrap gap-1 border-t border-black/[0.06] px-2 py-2 dark:border-white/10">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={toolClass(editor.isActive('bold'))} aria-label={`Fed tekst i ${label}`}>
          <Bold className="h-4 w-4" />
          Fed
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolClass(editor.isActive('underline'))} aria-label={`Understreg tekst i ${label}`}>
          <UnderlineIcon className="h-4 w-4" />
          Understreg
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolClass(editor.isActive('bulletList'))} aria-label={`Punktliste i ${label}`}>
          <List className="h-4 w-4" />
          Punkter
        </button>
      </div>
    </div>
  )
}
