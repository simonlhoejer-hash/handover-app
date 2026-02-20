'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function HandoverEditor({ value, onChange }: Props) {

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: `Hjælp den næste vagt 👇

Hvad er anderledes i dag?
Hvad mangler at blive lavet?
Er der noget kritisk?
Skriv tal og mængder.
Skriv hvor tingene står.`,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    editable: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // 🔥 Word-style auto capitalization
  useEffect(() => {
    if (!editor) return

    const handler = () => {
      const html = editor.getHTML()
      if (!html) return

      const updated = html
        // Første bogstav
        .replace(/^<p>([a-zæøå])/, (_, letter) =>
          `<p>${letter.toUpperCase()}`
        )
        // Efter punktum, ! eller ?
        .replace(/([.!?]\s+)([a-zæøå])/g, (_, punc, letter) =>
          `${punc}${letter.toUpperCase()}`
        )

      if (updated !== html) {
       editor.commands.setContent(updated, {
  emitUpdate: false,
})
      }
    }

    editor.on('update', handler)

    return () => {
      editor.off('update', handler)
    }
  }, [editor])

  // Sync external value
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  const btn = (active: boolean) =>
    `px-2 py-1.5 text-sm rounded-md transition ${
      active
        ? 'bg-emerald-600 text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`

  return (
    <div className="
      w-full
      box-border
      border 
      border-gray-300 dark:border-gray-700 
      rounded-xl 
      bg-white dark:bg-gray-900 
      transition
    ">

      {/* Toolbar */}
      <div className="
        flex flex-wrap items-center gap-1 px-3 py-2 
        border-b border-gray-200 dark:border-gray-700 
        bg-gray-100 dark:bg-gray-800
      ">

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive('italic'))}
        >
          I
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn(editor.isActive('underline'))}
        >
          U
        </button>

        <div className="w-px h-6 bg-gray-400 mx-2" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().liftListItem('listItem').toggleBulletList().run()
          }
          className={btn(editor.isActive('bulletList'))}
        >
          • Liste
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().liftListItem('listItem').toggleOrderedList().run()
          }
          className={btn(editor.isActive('orderedList'))}
        >
          1. Liste
        </button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        spellCheck={true}
        autoCorrect="on"
        autoComplete="on"
        className="
          w-full
          box-border
          p-4
          min-h-[200px]
          text-gray-900 dark:text-gray-100
          outline-none

          [&_.ProseMirror]:w-full
          [&_.ProseMirror]:min-h-[200px]
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:break-words
        "
      />
    </div>
  )
}