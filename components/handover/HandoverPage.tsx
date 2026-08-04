'use client'

import { useRouter } from 'next/navigation'
import HandoverHistoryItem from '@/components/handover/HandoverHistoryItem'
import HandoverForm from '@/components/handover/HandoverForm'
import { useTranslation } from '@/lib/LanguageContext'
import { useEffect, useRef, useState } from 'react'
import { queryString, secureFetch, type AccessShip } from '@/lib/secureApi'
import { ChevronDown } from 'lucide-react'
import { ChevronLeft } from 'lucide-react'

function getPlainText(value: string) {
  return value.replace(/<[^>]*>/g, '').trim()
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
  const { t } = useTranslation()
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
  const draftHydratedRef = useRef(false)
  const ship: AccessShip = department === 'pearl' ? 'pearl' : 'crown'

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
            {itemName}
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.handoversFor} {itemName}
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

        <div className="
          text-xs
          uppercase
          tracking-wider
          text-gray-500 dark:text-gray-400
        ">
          {t.history}
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

    </main>
  )
}
