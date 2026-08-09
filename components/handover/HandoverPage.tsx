'use client'

import { useRouter } from 'next/navigation'
import HandoverHistoryItem from '@/components/handover/HandoverHistoryItem'
import HandoverForm from '@/components/handover/HandoverForm'
import { useTranslation } from '@/lib/LanguageContext'
import { useEffect, useRef, useState } from 'react'
import { queryString, secureFetch, type AccessShip } from '@/lib/secureApi'
import { ChevronDown, ChevronLeft, Sparkles, X } from 'lucide-react'
import { displayPartiName } from '@/lib/partis'

function getPlainText(value: string) {
  return value.replace(/<[^>]*>/g, '').trim()
}

type RepeatedPoint = {
  label: string
  count: number
  dates: string[]
}

const REPEATED_POINT_STOP_WORDS = new Set([
  'alle', 'alt', 'andet', 'blive', 'blevet', 'denne', 'der', 'det', 'eller',
  'efter', 'for', 'fra', 'har', 'have', 'hele', 'hvad', 'ikke', 'kan', 'med',
  'men', 'næste', 'også', 'over', 'skal', 'som', 'til', 'ved', 'vagt', 'var',
  'the', 'and', 'that', 'this', 'with', 'from', 'have', 'has', 'was', 'were',
  'ska', 'och', 'att', 'detta', 'från', 'med', 'har', 'inte', 'nästa',
])

function noteLines(value: string) {
  return value
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .split(/\n|[.!?]+(?=\s|$)/)
    .map((line) => line.replace(/\s+/g, ' ').replace(/^[•*\-–—\d.)\s]+/, '').trim())
    .filter((line) => line.length >= 8 && line.length <= 180)
}

function keywords(value: string) {
  return new Set(
    value
      .toLocaleLowerCase('da-DK')
      .replace(/[^a-zæøåäöüé0-9\s-]/gi, ' ')
      .split(/\s+/)
      .map((word) => word.replace(/^-+|-+$/g, ''))
      .filter((word) => word.length >= 4 && !REPEATED_POINT_STOP_WORDS.has(word))
  )
}

function similarity(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) return 0
  const shared = [...left].filter((word) => right.has(word)).length
  return shared / Math.min(left.size, right.size)
}

function findRepeatedPoints(items: any[]): RepeatedPoint[] {
  const clusters: Array<{
    label: string
    words: Set<string>
    noteIds: Set<string>
    dates: Set<string>
  }> = []

  for (const item of items.slice(0, 60)) {
    for (const line of noteLines(String(item.note ?? ''))) {
      const words = keywords(line)
      if (words.size === 0) continue

      const cluster = clusters.find((candidate) => similarity(candidate.words, words) >= 0.6)
      if (cluster) {
        cluster.noteIds.add(String(item.id))
        if (item.shift_date) cluster.dates.add(String(item.shift_date))
        if (line.length < cluster.label.length) cluster.label = line
      } else {
        clusters.push({
          label: line,
          words,
          noteIds: new Set([String(item.id)]),
          dates: new Set(item.shift_date ? [String(item.shift_date)] : []),
        })
      }
    }
  }

  return clusters
    .filter((cluster) => cluster.noteIds.size >= 2)
    .sort((a, b) => b.noteIds.size - a.noteIds.size)
    .slice(0, 6)
    .map((cluster) => ({
      label: cluster.label,
      count: cluster.noteIds.size,
      dates: [...cluster.dates].sort().reverse().slice(0, 4),
    }))
}

function getTodayInCopenhagen() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

type Props = {
  department: 'crown' | 'shop' | 'admin' | 'pearl'
  itemName: string
  hideHeader?: boolean
  createLabel?: string
}

export default function HandoverPage({ 
  department, 
  itemName, 
  hideHeader, 
  createLabel 
}: Props) {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const today = getTodayInCopenhagen()

  const [name, setName] = useState('')
  const [receiver, setReceiver] = useState('')
  const [date, setDate] = useState(getTodayInCopenhagen)
  const [note, setNote] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesError, setNotesError] = useState('')
  const [publishMessage, setPublishMessage] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [open, setOpen] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [draftError, setDraftError] = useState('')
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showRepeatedPoints, setShowRepeatedPoints] = useState(false)
  const draftHydratedRef = useRef(false)
  const ship: AccessShip = department === 'pearl' ? 'pearl' : 'crown'
  const displayedItemName = displayPartiName(itemName, department)
  const repeatedPoints = findRepeatedPoints(items)
  const repeatedText = lang === 'en'
    ? {
        button: 'Recurring points',
        eyebrow: 'Based on recent handovers',
        title: 'What comes up repeatedly?',
        explanation: 'A quick overview of similar points mentioned in at least two handovers. Check the original handovers before acting.',
        empty: 'No clear recurring points yet.',
        mentioned: 'Mentioned',
        times: 'times',
        close: 'Close',
      }
    : lang === 'sv'
      ? {
          button: 'Återkommande punkter',
          eyebrow: 'Baserat på senaste överlämningarna',
          title: 'Vad återkommer?',
          explanation: 'En snabb översikt över liknande punkter som nämnts i minst två överlämningar. Kontrollera originalen innan ni agerar.',
          empty: 'Inga tydliga återkommande punkter ännu.',
          mentioned: 'Nämnt',
          times: 'gånger',
          close: 'Stäng',
        }
      : {
          button: 'Gentagne punkter',
          eyebrow: 'Baseret på de seneste overleveringer',
          title: 'Hvad går igen?',
          explanation: 'Et hurtigt overblik over lignende punkter, der er nævnt i mindst to overleveringer. Tjek de oprindelige overleveringer, før I handler.',
          empty: 'Der er endnu ingen tydelige gentagelser.',
          mentioned: 'Nævnt',
          times: 'gange',
          close: 'Luk',
        }

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    updateConnection()
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  useEffect(() => {
    setItems([])
    setPublishMessage('')
    void loadNotes()
    void loadDraft()
  }, [itemName, department])

  async function loadNotes() {
    setNotesLoading(true)
    setNotesError('')
    try {
      const { data } = await secureFetch<{ data: any[] }>(
        `/api/handovers?${queryString({ ship, parti: itemName, status: 'published' })}`
      )
      setItems(data || [])
    } catch {
      setNotesError(t.handoverLoadFailed)
    } finally {
      setNotesLoading(false)
    }
  }

  async function loadDraft() {
    draftHydratedRef.current = false
    setDraftId(null)
    setDraftStatus('idle')
    setDraftSavedAt(null)
    setDraftError('')

    let data: any | null = null
    try {
      const result = await secureFetch<{ data: any[] }>(
        `/api/handovers?${queryString({ ship, parti: itemName, status: 'draft' })}`
      )
      data = result.data[0] ?? null
    } catch {
      draftHydratedRef.current = true
      setDraftStatus('idle')
      return
    }

    const serverSavedAt = data?.draft_saved_at ?? data?.updated_at ?? data?.created_at ?? null
    if (data) {
      setDraftId(data.id)
      setName(data.author_name ?? '')
      setReceiver(data.receiver_name ?? '')
      setDate(data.shift_date && data.shift_date >= today ? data.shift_date : today)
      setNote(data.note ?? '')
      setImages(data.images ?? [])
      setDraftSavedAt(serverSavedAt)
      setDraftStatus('saved')
      setOpen(true)
    } else {
      setName('')
      setReceiver('')
      setDate(today)
      setNote('')
      setImages([])
    }

    draftHydratedRef.current = true
  }

  async function saveDraft() {
    if (!navigator.onLine) return

    const trimmedNote = getPlainText(note)
    const hasDraftContent = Boolean(
      name.trim() || receiver.trim() || trimmedNote || images.length
    )
    if (!draftId && !hasDraftContent) return

    setDraftStatus('saving')
    setDraftError('')

    const now = new Date().toISOString()
    const payload = {
      department,
      author_name: name,
      receiver_name: receiver,
      parti: itemName,
      shift_date: date,
      note,
      images,
      status: 'draft',
      draft_saved_at: now,
    }

    try {
      const { data } = await secureFetch<{ data: any }>('/api/handovers', {
        method: 'POST',
        body: JSON.stringify({ action: 'save-draft', ship, id: draftId, ...payload }),
      })
      if (data?.id) setDraftId(data.id)
      setDraftStatus('saved')
      setDraftSavedAt(now)
    } catch {
      setDraftStatus('error')
      setDraftError(t.draftSaveFailed)
    }
  }

  async function saveNote() {
    if (!name || !receiver || !getPlainText(note)) {
      alert(t.requiredFields)
      return
    }

    if (date < today) {
      setDate(today)
      alert(t.handoverDateCannotBePast)
      return
    }

    if (!isOnline) return
    setShowPublishConfirm(true)
  }

  async function publishNote() {
    setLoading(true)
    setPublishMessage('')
    const publishedAt = new Date().toISOString()

    const payload = {
      author_name: name,
      receiver_name: receiver,
      shift_date: date,
      note,
      images,
      status: 'published',
      read_by: null,
      read_at: null,
      created_at: publishedAt,
    }

    try {
      await secureFetch('/api/handovers', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          ship,
          id: draftId,
          parti: itemName,
          ...payload,
        }),
      })
    } catch (error) {
      setLoading(false)
      setShowPublishConfirm(false)
      alert(error instanceof Error ? error.message : t.draftSaveFailed)
      return
    }

    setLoading(false)
    setShowPublishConfirm(false)

    setNote('')
    setImages([])
    setName('')
    setReceiver('')
    setDraftId(null)
    setDraftStatus('idle')
    setDraftSavedAt(null)
    setDraftError('')
    setPublishMessage(t.handoverPublished)
    await loadNotes()
    setOpen(false)
  }

  useEffect(() => {
    if (!draftHydratedRef.current) return

    const trimmedNote = getPlainText(note)
    const hasDraftContent = Boolean(
      name.trim() || receiver.trim() || trimmedNote || images.length
    )
    if (!draftId && !hasDraftContent) return

    const timer = window.setTimeout(() => {
      void saveDraft()
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [name, receiver, date, note, images, department, itemName, draftId])

  useEffect(() => {
    if (isOnline && draftHydratedRef.current) void saveDraft()
  }, [isOnline])

  return (
    <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-8">

      {/* HEADER */}
      <header className="relative flex items-center justify-center">

<button
  type="button"
  onClick={() => router.push(`/${ship}`)}
  aria-label={t.back}
  className="
    absolute left-0
    flex items-center justify-center
    w-10 h-10
    rounded-full
    transition-all duration-200
    active:scale-95

    bg-white
    border border-black/5
    shadow-sm

    dark:bg-white/5
    dark:border-white/10
    dark:shadow-[0_5px_20px_rgba(0,0,0,0.6)]
  "
>
  <span className="text-lg text-gray-700 dark:text-white/80">
    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-white/80" />
  </span>
</button>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {displayedItemName}
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.handoversFor} {displayedItemName}
          </p>
        </div>

      </header>

      {/* 🔥 TOGGLE BJÆLKE ØVERST */}
      <section className="space-y-4">

<button
  onClick={() => setOpen(!open)}
className="
  group
  w-full
  flex items-center justify-between
  px-6 py-4
  rounded-3xl
  text-lg font-semibold
  transition-all duration-300
  active:scale-[0.98]

  bg-white
  border border-black/5
  shadow-[0_10px_30px_rgba(0,0,0,0.06)]

  dark:bg-white/5
  dark:border-white/10
  dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)]
"
>
  <span className="tracking-tight text-gray-900 dark:text-white">
{createLabel || t.newHandover}
  </span>

  <ChevronDown
    className={`
      text-gray-500 dark:text-gray-300
      transition-all duration-300
      ${open ? 'rotate-180 scale-110' : ''}
      group-hover:scale-110
    `}
  />
</button> 

        <div
          className={`
            overflow-hidden
            transition-all
            duration-500
            ease-in-out
            will-change-[max-height,opacity]
            ${open ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
          `}
        >
          <div>
<HandoverForm
  name={name}
  setName={setName}
  receiver={receiver}
  setReceiver={setReceiver}
  date={date}
  setDate={setDate}
  minDate={today}
  note={note}
  setNote={setNote}
  images={images}
  setImages={setImages}
  loading={loading}
  onSave={saveNote}
  draftStatus={draftStatus}
  draftSavedAt={draftSavedAt}
  draftError={draftError}
  isOnline={isOnline}
parti={itemName}/>
          </div>
        </div>

      </section>

      {/* HISTORY SECTION */}
      <section className="space-y-4">

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t.history}
          </div>
          {!notesLoading && !notesError && items.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowRepeatedPoints(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-teal-700/15 bg-teal-700/10 px-4 text-sm font-semibold text-teal-900 transition hover:bg-teal-700/15 active:scale-[0.98] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <Sparkles className="h-4 w-4" />
              {repeatedText.button}
              {repeatedPoints.length > 0 && (
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-teal-900 dark:bg-black/20 dark:text-white">
                  {repeatedPoints.length}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {publishMessage && (
            <p role="status" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-200">
              {publishMessage}
            </p>
          )}

          {notesError && (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
              <span>{notesError}</span>
              <button
                type="button"
                onClick={() => void loadNotes()}
                className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 font-semibold text-white transition active:scale-[0.98]"
              >
                {t.retry}
              </button>
            </div>
          )}

          {notesLoading && items.length === 0 && (
            <p className="rounded-2xl bg-black/5 px-4 py-3 text-sm text-gray-500 dark:bg-white/5 dark:text-white/60">
              {t.loading}
            </p>
          )}

          {!notesLoading && !notesError && items.length === 0 && (
            <p className="rounded-2xl bg-black/5 px-4 py-3 text-sm text-gray-500 dark:bg-white/5 dark:text-white/60">
              {t.noHandover}
            </p>
          )}

          {items.map((item) => (
            <HandoverHistoryItem
              key={item.id}
              item={item}
              ship={ship}
              reload={loadNotes}
            />
          ))}
        </div>

      </section>

      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#0d3b3a] dark:border dark:border-white/10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t.publishConfirmTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-white/60">
              {t.publishConfirmText}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="min-h-12 rounded-2xl bg-black/5 px-4 font-semibold text-gray-700 transition active:scale-[0.98] dark:bg-white/10 dark:text-white/80"
              >
                {t.publishCancelButton}
              </button>
              <button
                onClick={() => void publishNote()}
                disabled={loading}
                className="min-h-12 rounded-2xl bg-black px-4 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {loading ? t.saving : t.publishConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepeatedPoints && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="repeated-points-title" className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-black/5 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0d3b3a]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-200">
                  {repeatedText.eyebrow}
                </p>
                <h2 id="repeated-points-title" className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {repeatedText.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowRepeatedPoints(false)}
                aria-label={repeatedText.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/5 text-gray-700 transition hover:bg-black/10 dark:bg-white/10 dark:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-white/60">
              {repeatedText.explanation}
            </p>

            <div className="mt-5 space-y-3">
              {repeatedPoints.length === 0 ? (
                <p className="rounded-2xl bg-black/5 px-4 py-5 text-sm text-gray-600 dark:bg-white/5 dark:text-white/65">
                  {repeatedText.empty}
                </p>
              ) : repeatedPoints.map((point) => (
                <article key={`${point.label}-${point.count}`} className="rounded-2xl border border-black/5 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold leading-snug text-gray-900 dark:text-white">{point.label}</p>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-300/15 dark:text-amber-100">
                      {point.count}×
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-white/55">
                    {repeatedText.mentioned} {point.count} {repeatedText.times}
                    {point.dates.length > 0 && ` · ${point.dates.map((date) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : lang === 'sv' ? 'sv-SE' : 'da-DK', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`))).join(', ')}`}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
