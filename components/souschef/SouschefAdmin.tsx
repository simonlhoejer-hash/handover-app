'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { FolderPlus, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react'
import type { AccessShip } from '@/lib/shipAccess'
import HandoverEditor from '@/components/handover/HandoverEditor'

type Folder = { name: string; group: 'partier' | 'skyllerier' }
type Handover = {
  id: string
  parti: string
  author_name?: string
  receiver_name?: string
  shift_date: string
  status: 'draft' | 'published'
  note: string
}

export default function SouschefAdmin({ ship, view }: { ship: AccessShip; view: 'folders' | 'handovers' }) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [name, setName] = useState('')
  const [group, setGroup] = useState<Folder['group']>('partier')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<Handover | null>(null)

  const load = useCallback(async () => {
    const [folderResponse, handoverResponse] = await Promise.all([
      fetch(`/api/handover-folders?ship=${ship}`, { cache: 'no-store' }),
      fetch(`/api/souschef/handovers?ship=${ship}`, { cache: 'no-store' }),
    ])
    const folderResult = await folderResponse.json()
    const handoverResult = await handoverResponse.json()
    if (!folderResponse.ok) throw new Error(folderResult.error)
    if (!handoverResponse.ok) throw new Error(handoverResult.error)
    setFolders(folderResult.data ?? [])
    setHandovers(handoverResult.data ?? [])
  }, [ship])

  useEffect(() => {
    void load().catch(() => setMessage('Administrationen kunne ikke hentes.'))
  }, [load])

  async function addFolder(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/handover-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ship, name, group }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setFolders(result.data)
      setName('')
      setMessage('Mappen er oprettet.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mappen kunne ikke oprettes.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteFolder(folder: Folder) {
    if (!window.confirm(`Vil du slette mappen “${folder.name}”? Mappen kan kun slettes, når den er tom.`)) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/handover-folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ship, name: folder.name }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setFolders(result.data)
      setMessage('Mappen er slettet.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mappen kunne ikke slettes.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteHandover(handover: Handover) {
    const label = `${handover.parti} fra ${new Date(`${handover.shift_date}T12:00:00`).toLocaleDateString('da-DK')}`
    if (!window.confirm(`Slet overleveringen “${label}” permanent? Kommentarer og billeder bliver også slettet.`)) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/souschef/handovers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ship, id: handover.id }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setHandovers((current) => current.filter((item) => item.id !== handover.id))
      setMessage('Overleveringen er slettet.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Overleveringen kunne ikke slettes.')
    } finally {
      setBusy(false)
    }
  }

  async function saveHandoverEdit(event: FormEvent) {
    event.preventDefault()
    if (!editing || !editing.author_name?.trim() || !editing.receiver_name?.trim() || busy) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/souschef/handovers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ship,
          id: editing.id,
          author_name: editing.author_name,
          receiver_name: editing.receiver_name,
          note: editing.note,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setHandovers((current) => current.map((item) => item.id === editing.id ? result.data : item))
      setEditing(null)
      setMessage('Overleveringen er rettet.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Overleveringen kunne ikke rettes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-7 space-y-6 rounded-3xl border border-black/5 bg-white p-5 shadow-[0_18px_45px_rgba(6,78,76,.08)] dark:border-white/10 dark:bg-[#0d3b3a] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{view === 'folders' ? 'Administrér mapper' : 'Administrér overleveringer'}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">Ændringer gælder kun {ship === 'crown' ? 'Crown' : 'Pearl'}.</p>
        </div>
        <button type="button" onClick={() => void load()} className="rounded-xl p-3 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Opdatér"><RefreshCw size={18} /></button>
      </div>

      {message && <p className="rounded-xl bg-[#347f7a]/10 px-4 py-3 text-sm font-semibold text-[#216762] dark:text-[#a8d5d1]">{message}</p>}

      {view === 'folders' && <div>
        <h3 className="font-semibold">Ny mappe</h3>
        <form onSubmit={addFolder} className="mt-3 grid gap-3 sm:grid-cols-[1fr_190px_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mappens navn" maxLength={80} required className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
          <select value={group} onChange={(event) => setGroup(event.target.value as Folder['group'])} className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-[#0d3b3a]">
            <option value="partier">Køkkener</option>
            <option value="skyllerier">Skyllerier</option>
          </select>
          <button disabled={busy || !name.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-[#064e4c] px-5 py-3 font-semibold text-white disabled:opacity-50"><FolderPlus size={18} /> Opret</button>
        </form>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {folders.map((folder) => (
            <div key={folder.name} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-3 dark:border-white/10">
              <div><div className="font-semibold">{folder.name}</div><div className="text-xs text-gray-500 dark:text-white/50">{folder.group === 'partier' ? 'Køkken' : 'Skylleri'}</div></div>
              <button type="button" disabled={busy} onClick={() => void deleteFolder(folder)} className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-600" aria-label={`Slet ${folder.name}`}><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      </div>}

      {view === 'handovers' && <div>
        <h3 className="font-semibold">Overleveringer</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">Ret useriøst indhold, eller slet overleveringen permanent.</p>
        {editing && (
          <form onSubmit={saveHandoverEdit} className="mt-4 rounded-2xl border-2 border-[#347f7a]/30 bg-[#347f7a]/5 p-4 dark:bg-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold">Ret overlevering</h4>
                <p className="text-xs text-gray-500 dark:text-white/50">{editing.parti} · {new Date(`${editing.shift_date}T12:00:00`).toLocaleDateString('da-DK')}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Luk redigering"><X size={18} /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Fra
                <input value={editing.author_name ?? ''} onChange={(event) => setEditing({ ...editing, author_name: event.target.value })} maxLength={100} required className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-normal dark:border-white/10 dark:bg-[#082f2e]" />
              </label>
              <label className="text-sm font-semibold">Til
                <input value={editing.receiver_name ?? ''} onChange={(event) => setEditing({ ...editing, receiver_name: event.target.value })} maxLength={100} required className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-normal dark:border-white/10 dark:bg-[#082f2e]" />
              </label>
            </div>
            <div className="mt-3"><HandoverEditor value={editing.note ?? ''} onChange={(note) => setEditing({ ...editing, note })} /></div>
            <button disabled={busy || !editing.author_name?.trim() || !editing.receiver_name?.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#064e4c] px-5 py-3 font-semibold text-white disabled:opacity-50"><Save size={18} /> {busy ? 'Gemmer…' : 'Gem rettelser'}</button>
          </form>
        )}
        <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto">
          {handovers.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">Ingen overleveringer</p> : handovers.map((handover) => (
            <div key={handover.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-3 dark:border-white/10">
              <div className="min-w-0">
                <div className="truncate font-semibold">{handover.parti}</div>
                <div className="text-xs text-gray-500 dark:text-white/50">{new Date(`${handover.shift_date}T12:00:00`).toLocaleDateString('da-DK')} · {handover.author_name || 'Ukendt'} · {handover.status === 'draft' ? 'Kladde' : 'Udgivet'}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" disabled={busy} onClick={() => setEditing({ ...handover })} className="rounded-lg p-2 text-gray-400 hover:bg-[#347f7a]/10 hover:text-[#216762]" aria-label="Ret overlevering"><Pencil size={17} /></button>
                <button type="button" disabled={busy} onClick={() => void deleteHandover(handover)} className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-600" aria-label="Slet overlevering"><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>}
    </section>
  )
}
