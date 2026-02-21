'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function HandoverEditor({ value, onChange, placeholder }: Props) {

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
Placeholder.configure({
  placeholder:
    placeholder ||
    `Hjælp den næste vagt 👇

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
  if (!editor) return;

  const handler = () => {
    const html = editor.getHTML();
    if (!html) return;

    const updated = html
      .replace(/^<p>([a-zæøå])/, (_, letter) =>
        `<p>${letter.toUpperCase()}`
      )
      .replace(/([.!?]\s+)([a-zæøå])/g, (_, punc, letter) =>
        `${punc}${letter.toUpperCase()}`
      );

    if (updated !== html) {
      editor.commands.setContent(updated, {
        emitUpdate: false,
      });
    }
  };

  editor.on('update', handler);

  return () => {
    editor.off('update', handler);
  };
}, [editor]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  const btn = (active: boolean) =>
    `
      px-3 py-1.5
      text-sm
      rounded-full
      transition-all duration-200
      active:scale-95
      ${
        active
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-black/5 text-gray-700 dark:bg-white/10 dark:text-white/80'
      }
    `

  return (
    <div
      className="
        w-full
        rounded-3xl
        transition-all duration-300

        bg-white
        border border-black/5
        shadow-[0_15px_40px_rgba(0,0,0,0.05)]

        dark:bg-[#162338]
        dark:border-white/10
        dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]
      "
    >

      {/* Toolbar */}
      <div
        className="
          flex flex-wrap items-center gap-2
          px-4 py-3
          border-b border-black/5 dark:border-white/10
        "
      >

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

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

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
        spellCheck
        autoCorrect="on"
        autoComplete="on"
        autoCapitalize="sentences"
        className="
          w-full
          px-6 py-5
          min-h-[200px]
          text-gray-900
          dark:text-white
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