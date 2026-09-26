'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ClipboardCheck,
  CookingPot,
  Lightbulb,
  MenuSquare,
  SprayCan,
} from 'lucide-react'
import { useTranslation } from '@/lib/LanguageContext'
import StructuredSectionEditor from './StructuredSectionEditor'
import ImageUploader from '../ui/ImageUploader'
import { X } from 'lucide-react'

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

function hasText(value: string) {
  return new DOMParser().parseFromString(value, 'text/html').body.textContent?.trim()
}

type SectionImages = Record<SectionKey, string[]>
const emptySectionImages = () => Object.fromEntries(sections.map(({ key }) => [key, [] as string[]])) as SectionImages

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function serialize(values: Values, sectionImages: SectionImages) {
  const filled = sections.filter(({ key }) => hasText(values[key]) || sectionImages[key].length)
  if (filled.length === 0) return ''

  return `<div data-handover-format="structured">${filled.map(({ key, label }) => (
    `<section data-handover-section="${key}"><h2>${label}</h2>${values[key]}${sectionImages[key].length ? `<div class="grid grid-cols-3 gap-3 mt-4" data-handover-section-images="${key}">${sectionImages[key].map((url) => `<img src="${escapeAttribute(url)}" alt="" data-handover-section-image="true" class="h-24 w-full rounded-2xl object-cover" />`).join('')}</div>` : ''}</section>`
  )).join('')}</div>`
}

function parse(value: string): Values {
  const next = emptyValues()
  if (!value) return next

  const document = new DOMParser().parseFromString(value, 'text/html')
  const structured = document.querySelector('[data-handover-format="structured"]')
  if (!structured) {
    next.miscellaneous = document.body.innerHTML
    return next
  }

  sections.forEach(({ key }) => {
    const section = structured.querySelector(`[data-handover-section="${key}"]`)
    if (!section) return
    const content = section.cloneNode(true) as HTMLElement
    content.querySelector('h2')?.remove()
    content.querySelector('[data-handover-section-images]')?.remove()
    next[key] = content.innerHTML
  })
  return next
}

function parseSectionImages(value: string): SectionImages {
  const next = emptySectionImages()
  if (!value) return next
  const document = new DOMParser().parseFromString(value, 'text/html')
  sections.forEach(({ key }) => {
    next[key] = Array.from(document.querySelectorAll(`[data-handover-section-images="${key}"] img`))
      .map((image) => image.getAttribute('src') ?? '')
      .filter(Boolean)
  })
  return next
}

type Props = {
  value: string
  onChange: (value: string) => void
  images: string[]
  onImagesChange: (images: string[]) => void
  parti: string
  isOnline: boolean
}

export default function StructuredHandoverEditor({ value, onChange, images, onImagesChange, parti, isOnline }: Props) {
  const { lang } = useTranslation()
  const [values, setValues] = useState<Values>(() => emptyValues())
  const [sectionImages, setSectionImages] = useState<SectionImages>(() => emptySectionImages())
  const lastSerializedValue = useRef('')

  useEffect(() => {
    if (value === lastSerializedValue.current) return
    setValues(parse(value))
    const parsedImages = parseSectionImages(value)
    const assigned = new Set(Object.values(parsedImages).flat())
    parsedImages.miscellaneous.push(...images.filter((url) => !assigned.has(url)))
    setSectionImages(parsedImages)
  }, [value])

  const intro = lang === 'en'
    ? 'Fill in the relevant sections. Leave the rest blank.'
    : lang === 'sv'
      ? 'Fyll i de relevanta fälten. Lämna resten tomt.'
      : 'Udfyld det, der er relevant for modtørnen. Resten kan stå tomt.'

  function update(key: SectionKey, nextValue: string) {
    const next = { ...values, [key]: nextValue }
    const serialized = serialize(next, sectionImages)
    setValues(next)
    lastSerializedValue.current = serialized
    onChange(serialized)
  }

  function updateSectionImages(key: SectionKey, nextImages: string[]) {
    const next = { ...sectionImages, [key]: nextImages }
    const serialized = serialize(values, next)
    setSectionImages(next)
    lastSerializedValue.current = serialized
    onChange(serialized)
    onImagesChange(Object.values(next).flat())
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
              hasText(values[key])
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
            <StructuredSectionEditor
              label={label}
              value={values[key]}
              onChange={(nextValue) => update(key, nextValue)}
            />
            <div className="mt-3 border-t border-black/[0.06] pt-3 dark:border-white/10">
              {isOnline ? (
                <ImageUploader compact parti={parti} onUploadComplete={(url) => updateSectionImages(key, [...sectionImages[key], url])} />
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-200">Billeder kræver internet</p>
              )}
              {sectionImages[key].length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {sectionImages[key].map((url) => (
                    <div key={url} className="relative">
                      <img src={url} alt="" className="h-24 w-full rounded-xl object-cover" />
                      <button type="button" onClick={() => updateSectionImages(key, sectionImages[key].filter((image) => image !== url))} aria-label={`Fjern billede fra ${label}`} className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
