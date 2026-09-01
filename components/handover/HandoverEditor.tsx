'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function HandoverEditor({ value, onChange, placeholder }: Props) {
  const { t } = useTranslation()
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: placeholder || t.editorPlaceholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    editable: true,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
  }, [placeholder, t.editorPlaceholder])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  const buttonClass = (active: boolean) => `
    flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5
    rounded-xl px-3 text-sm font-medium
    transition-all duration-200 active:scale-95
    ${
      active
        ? 'bg-black text-white dark:bg-white dark:text-black'
        : 'bg-black/5 text-gray-700 dark:bg-white/10 dark:text-white/80'
    }
  `

  return (
    <div className="handover-editor w-full rounded-3xl border border-black/5 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.05)] transition-all duration-300 dark:border-white/10 dark:bg-[#0d3b3a] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-black/5 px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-white/10">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))} aria-label={t.editorBold} title={t.editorBold}>
          <Bold size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))} aria-label={t.editorItalic} title={t.editorItalic}>
          <Italic size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={buttonClass(editor.isActive('underline'))} aria-label={t.editorUnderline} title={t.editorUnderline}>
          <UnderlineIcon size={18} />
        </button>

        <div className="mx-1 h-7 w-px shrink-0 bg-black/10 dark:bg-white/10" />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive('heading', { level: 2 }))} aria-label={t.editorHeading} title={t.editorHeading}>
          <Heading2 size={19} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive('bulletList'))} aria-label={t.bulletList} title={t.bulletList}>
          <List size={19} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editor.isActive('orderedList'))} aria-label={t.numberedList} title={t.numberedList}>
          <ListOrdered size={19} />
        </button>

        <div className="mx-1 h-7 w-px shrink-0 bg-black/10 dark:bg-white/10" />

        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className={`${buttonClass(false)} disabled:cursor-not-allowed disabled:opacity-35`} aria-label={t.editorUndo} title={t.editorUndo}>
          <Undo2 size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className={`${buttonClass(false)} disabled:cursor-not-allowed disabled:opacity-35`} aria-label={t.editorRedo} title={t.editorRedo}>
          <Redo2 size={18} />
        </button>
      </div>

      <EditorContent
        editor={editor}
        spellCheck
        autoCorrect="on"
        autoComplete="on"
        autoCapitalize="sentences"
        className="w-full min-h-[220px] px-6 py-5 text-gray-900 outline-none dark:text-white [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:w-full [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none"
      />
    </div>
  )
}
