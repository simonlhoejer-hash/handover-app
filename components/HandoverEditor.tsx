'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder' // ✅ NY

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function HandoverEditor({ value, onChange }: Props) {

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Placeholder.configure({   // ✅ NY
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
<div
  className="
    w-full
    box-border
    border 
    border-gray-300 dark:border-gray-700 
    rounded-xl 
    bg-white dark:bg-gray-900 
    transition
  "
>



      {/* 🔥 Toolbar */}
<div
  className="
    flex flex-wrap items-center gap-1 px-3 py-2 
    border-b border-gray-200 dark:border-gray-700 
    bg-gray-100 dark:bg-gray-800
  "
>

  {/* Bold */}
  <button
    type="button"
    onClick={() => editor?.chain().focus().toggleBold().run()}
    className={btn(editor.isActive('bold'))}
  >
    B
  </button>

  {/* Italic */}
  <button
    type="button"
    onClick={() => editor?.chain().focus().toggleItalic().run()}
    className={btn(editor.isActive('italic'))}
  >
    I
  </button>

  {/* Underline */}
  <button
    type="button"
    onClick={() => editor?.chain().focus().toggleUnderline().run()}
    className={btn(editor.isActive('underline'))}
  >
    U
  </button>

  <div className="w-px h-6 bg-gray-400 mx-2" />

  {/* Bullet list */}
<button
  type="button"
  onClick={() => {
    editor
      ?.chain()
      .focus()
      .liftListItem('listItem') // 🔥 bryd ud af eksisterende liste
      .toggleBulletList()
      .run()
  }}
  className={btn(editor.isActive('bulletList'))}
>
  • Liste
</button>


  {/* Ordered list */}
<button
  type="button"
  onClick={() => {
    editor
      ?.chain()
      .focus()
      .liftListItem('listItem') // 🔥 bryd først
      .toggleOrderedList()
      .run()
  }}
  className={btn(editor.isActive('orderedList'))}
>
  1. Liste
</button>


</div>


      {/* 📝 Editor */}
<EditorContent
  editor={editor}
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
