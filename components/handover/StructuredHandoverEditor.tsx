'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ClipboardCheck,
  CookingPot,
  Lightbulb,
  List,
  MenuSquare,
  SprayCan,
} from 'lucide-react'
import { useTranslation } from '@/lib/LanguageContext'

const sections = [
  { key: 'mise-en-place', label: 'Mise en place', icon: CookingPot },
  { key: 'cleaning', label: 'Rengøring', icon: SprayCan },
  { key: 'self-check', label: 'Egenkontrol', icon: ClipboardCheck },
  { key: 'issues', label: 'Fejl og mangler', icon: AlertTriangle },
  { key: 'menu-changes', label: 'Ændringer i menu – opskrifter', icon: MenuSquare },
  { key: 'miscellaneous', label: 'Diverse', icon: Lightbulb },
] as const

type SectionKey = (typeof sections)[number]['key']
type Values = Record<SectionKey, string>

const emptyValues = () => Object.fromEntries(sections.map(({ key }) => [key, ''])) as Values

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function serialize(values: Values) {
  const filled = sections.filter(({ key }) => values[key].trim())
  if (filled.length === 0) return ''

  return `<div data-handover-format="structured">${filled.map(({ key, label }) => (
    `<section data-handover-section="${key}"><h2>${label}</h2><ul>${values[key]
      .trim()
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => `<li>${escapeHtml(line.trim().replace(/^[•*-]\s*/, ''))}</li>`)
      .join('')}</ul></section>`
  )).join('')}</div>`
}

function parse(value: string): Values {
  const next = emptyValues()
  if (!value) return next

  const document = new DOMParser().parseFromString(value, 'text/html')
  const structured = document.querySelector('[data-handover-format="structured"]')
  if (!structured) {
    next.miscellaneous = document.body.textContent?.trim() ?? ''
    return next
  }

  sections.forEach(({ key }) => {
    const section = structured.querySelector(`[data-handover-section="${key}"]`)
    next[key] = Array.from(section?.querySelectorAll('p, li') ?? [])
      .map((item) => item.textContent?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
  })
  return next
}

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function StructuredHandoverEditor({ value, onChange }: Props) {
  const { lang } = useTranslation()
  const [values, setValues] = useState<Values>(() => emptyValues())
  const textareaRefs = useRef<Partial<Record<SectionKey, HTMLTextAreaElement | null>>>({})

  useEffect(() => {
    setValues(parse(value))
  }, [value])

  const intro = lang === 'en'
    ? 'Fill in the relevant sections. Leave the rest blank.'
    : lang === 'sv'
      ? 'Fyll i de relevanta fälten. Lämna resten tomt.'
      : 'Udfyld det, der er relevant for vagten. Resten kan stå tomt.'

  function update(key: SectionKey, nextValue: string) {
    const next = { ...values, [key]: nextValue }
    setValues(next)
    onChange(serialize(next))
  }

  function insertBullet(key: SectionKey) {
    const textarea = textareaRefs.current[key]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = values[key]
    const lineStart = current.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const prefix = current.slice(lineStart, start).trim().length > 0 ? '\n• ' : '• '
    const next = `${current.slice(0, start)}${prefix}${current.slice(end)}`
    update(key, next)

    window.requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + prefix.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <fieldset className="mb-5">
      <legend className="sr-only">Overleveringens punkter</legend>
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-teal-700/10 bg-teal-700/[0.06] px-4 py-3 text-sm text-teal-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80">
        <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>{intro}</p>
      </div>

      <div className="grid gap-3">
        {sections.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className={`group rounded-2xl border p-4 transition focus-within:border-teal-700/30 focus-within:bg-teal-700/[0.035] focus-within:shadow-[0_8px_24px_rgba(15,118,110,0.08)] dark:focus-within:border-white/20 dark:focus-within:bg-white/[0.07] ${
              values[key].trim()
                ? 'border-teal-700/20 bg-teal-700/[0.025] dark:border-white/15 dark:bg-white/[0.05]'
                : 'border-black/[0.07] bg-gray-50/80 dark:border-white/10 dark:bg-black/10'
            }`}
          >
            <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800 dark:bg-white/10 dark:text-teal-100">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </span>
            <span className="block rounded-xl border border-black/[0.06] bg-white/60 focus-within:border-teal-700/25 dark:border-white/10 dark:bg-black/10">
              <textarea
                ref={(element) => { textareaRefs.current[key] = element }}
                value={values[key]}
                onChange={(event) => update(key, event.target.value)}
                rows={4}
                maxLength={3000}
                placeholder="Skriv kort og konkret…"
                aria-label={label}
                className="block min-h-28 w-full resize-y bg-transparent px-3 pt-3 text-[16px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-white/30"
              />
              <span className="flex border-t border-black/[0.06] px-2 py-2 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => insertBullet(key)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-gray-600 transition hover:bg-black/5 active:scale-95 dark:text-white/70 dark:hover:bg-white/10"
                  aria-label={`Tilføj punkt i ${label}`}
                >
                  <List className="h-4 w-4" />
                  Punkt
                </button>
              </span>
            </span>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
