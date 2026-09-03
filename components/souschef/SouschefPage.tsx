'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock3,
  LogOut,
  Plus,
  Trash2,
} from 'lucide-react'

type TaskStatus = 'new' | 'doing' | 'waiting' | 'done'
type TaskPriority = 'normal' | 'important' | 'critical'

type ManagerTask = {
  id: string
  title: string
  description: string
  owner: string
  dueDate: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<TaskStatus, string> = {
  new: 'Ny',
  doing: 'I gang',
  waiting: 'Afventer',
  done: 'Færdig',
}

const statusStyles: Record<TaskStatus, string> = {
  new: 'bg-blue-500/10 text-blue-700 dark:text-blue-200',
  doing: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  waiting: 'bg-purple-500/10 text-purple-700 dark:text-purple-200',
  done: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
}

export default function SouschefPage() {
  const [tasks, setTasks] = useState<ManagerTask[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    void fetch('/api/souschef', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setTasks(result.data ?? [])
      })
      .catch(() => setMessage('Punkterne kunne ikke hentes.'))
      .finally(() => setLoading(false))
  }, [])

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks])
  const doneTasks = useMemo(() => tasks.filter((task) => task.status === 'done'), [tasks])

  async function persist(nextTasks: ManagerTask[], previousTasks: ManagerTask[]) {
    setTasks(nextTasks)
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/souschef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: nextTasks }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setTasks(result.data ?? nextTasks)
      setMessage('Gemt')
      window.setTimeout(() => setMessage(''), 1800)
    } catch {
      setTasks(previousTasks)
      setMessage('Kunne ikke gemme ændringen.')
    } finally {
      setSaving(false)
    }
  }

  function addTask(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || saving) return
    const now = new Date().toISOString()
    const task: ManagerTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      owner: owner.trim(),
      dueDate,
      priority,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    }
    const previous = tasks
    void persist([task, ...tasks], previous)
    setTitle('')
    setDescription('')
    setOwner('')
    setDueDate('')
    setPriority('normal')
  }

  function updateTask(id: string, changes: Partial<ManagerTask>) {
    if (saving) return
    const previous = tasks
    const next = tasks.map((task) =>
      task.id === id ? { ...task, ...changes, updatedAt: new Date().toISOString() } : task
    )
    void persist(next, previous)
  }

  function deleteTask(id: string) {
    if (!window.confirm('Vil du slette dette punkt?')) return
    const previous = tasks
    void persist(tasks.filter((task) => task.id !== id), previous)
  }

  async function logOut() {
    await fetch('/api/access', { method: 'DELETE' })
    window.location.assign('/')
  }

  return (
    <main className="min-h-screen bg-[var(--nordic-bg)] px-4 py-7 text-gray-900 dark:bg-[#082d2d] dark:text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#064e4c] text-white shadow-lg">
              <ChefHat size={24} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#347f7a] dark:text-[#8dc4bf]">Nordic Crown</p>
              <h1 className="text-3xl font-semibold tracking-tight">Souschef-overlevering</h1>
            </div>
          </div>
          <button onClick={logOut} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm dark:bg-white/10">
            <LogOut size={17} /> Log ud
          </button>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <Summary label="Åbne punkter" value={openTasks.length} icon={<Clock3 size={19} />} />
          <Summary label="Kritiske" value={openTasks.filter((task) => task.priority === 'critical').length} icon={<AlertTriangle size={19} />} danger />
          <Summary label="Afsluttet" value={doneTasks.length} icon={<CheckCircle2 size={19} />} />
        </section>

        <section className="mt-7 rounded-3xl border border-black/5 bg-white p-5 shadow-[0_18px_45px_rgba(6,78,76,.08)] dark:border-white/10 dark:bg-[#0d3b3a] sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Nyt opfølgningspunkt</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">Punktet bliver stående, indtil det markeres som færdigt.</p>
            </div>
            {message && <span className="text-sm font-semibold text-[#347f7a] dark:text-[#8dc4bf]">{message}</span>}
          </div>
          <form onSubmit={addTask} className="mt-5 grid gap-3 sm:grid-cols-2">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hvad skal følges op?" className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-[#347f7a]/30 dark:border-white/10 dark:bg-white/5 sm:col-span-2" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Noter og næste skridt" rows={3} className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-[#347f7a]/30 dark:border-white/10 dark:bg-white/5 sm:col-span-2" />
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Ansvarlig" className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-[#0d3b3a]">
              <option value="normal">Normal prioritet</option>
              <option value="important">Vigtig</option>
              <option value="critical">Kritisk</option>
            </select>
            <button disabled={saving || !title.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-[#064e4c] px-5 py-3 font-semibold text-white disabled:opacity-50">
              <Plus size={18} /> Tilføj punkt
            </button>
          </form>
        </section>

        <section className="mt-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Skal følges op</h2>
            <span className="text-sm text-gray-500 dark:text-white/60">{saving ? 'Gemmer…' : `${openTasks.length} åbne`}</span>
          </div>
          {loading ? <Empty text="Henter punkter…" /> : openTasks.length === 0 ? <Empty text="Ingen åbne punkter" /> : openTasks.map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
          ))}
        </section>

        {doneTasks.length > 0 && (
          <section className="mt-7">
            <button onClick={() => setShowDone((value) => !value)} className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-white px-5 py-4 font-semibold dark:border-white/10 dark:bg-[#0d3b3a]">
              Færdige punkter ({doneTasks.length}) <ArrowRight className={showDone ? 'rotate-90 transition' : 'transition'} size={18} />
            </button>
            {showDone && <div className="mt-3 space-y-3">{doneTasks.map((task) => <TaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />)}</div>}
          </section>
        )}
      </div>
    </main>
  )
}

function Summary({ label, value, icon, danger = false }: { label: string; value: number; icon: React.ReactNode; danger?: boolean }) {
  return <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d3b3a]"><div className={danger ? 'text-red-600 dark:text-red-300' : 'text-[#347f7a] dark:text-[#8dc4bf]'}>{icon}</div><div className="mt-3 text-3xl font-semibold">{value}</div><div className="text-sm text-gray-500 dark:text-white/60">{label}</div></div>
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-black/10 px-5 py-10 text-center text-gray-500 dark:border-white/15 dark:text-white/50">{text}</div>
}

function TaskCard({ task, onUpdate, onDelete }: { task: ManagerTask; onUpdate: (id: string, changes: Partial<ManagerTask>) => void; onDelete: (id: string) => void }) {
  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#0d3b3a] ${task.priority === 'critical' ? 'border-red-400/60' : task.priority === 'important' ? 'border-amber-400/50' : 'border-black/5 dark:border-white/10'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            {task.priority !== 'normal' && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${task.priority === 'critical' ? 'bg-red-500/10 text-red-700 dark:text-red-200' : 'bg-amber-500/15 text-amber-800 dark:text-amber-200'}`}>{task.priority === 'critical' ? 'Kritisk' : 'Vigtig'}</span>}
          </div>
          {task.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-white/70">{task.description}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-white/50">
            {task.owner && <span>Ansvarlig: <strong>{task.owner}</strong></span>}
            {task.dueDate && <span>Deadline: <strong>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('da-DK')}</strong></span>}
          </div>
        </div>
        <button onClick={() => onDelete(task.id)} aria-label="Slet punkt" className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-600"><Trash2 size={17} /></button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4 dark:border-white/10">
        <select value={task.status} onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })} className={`rounded-full border-0 px-3 py-2 text-sm font-semibold outline-none ${statusStyles[task.status]}`}>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {task.status !== 'done' && <button onClick={() => onUpdate(task.id, { status: 'done' })} className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200"><CheckCircle2 size={16} /> Markér færdig</button>}
      </div>
    </article>
  )
}
