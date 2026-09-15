'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { FolderPlus, RefreshCw, Trash2 } from 'lucide-react'
import type { AccessShip } from '@/lib/shipAccess'

type Folder = { name: string; group: 'partier' | 'skyllerier' }
type Handover = {
  id: string
  parti: string
  author_name?: string
  receiver_name?: string
  shift_date: string
  status: 'draft' | 'published'
}

export default function SouschefAdmin({ ship, view }: { ship: AccessShip; view: 'folders' | 'handovers' }) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [name, setName] = useState('')
  const [group, setGroup] = useState<Folder['group']>('partier')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

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
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">Sletning er permanent og fjerner også kommentarer og billeder.</p>
        <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto">
          {handovers.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">Ingen overleveringer</p> : handovers.map((handover) => (
            <div key={handover.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-3 dark:border-white/10">
              <div className="min-w-0">
                <div className="truncate font-semibold">{handover.parti}</div>
                <div className="text-xs text-gray-500 dark:text-white/50">{new Date(`${handover.shift_date}T12:00:00`).toLocaleDateString('da-DK')} · {handover.author_name || 'Ukendt'} · {handover.status === 'draft' ? 'Kladde' : 'Udgivet'}</div>
              </div>
              <button type="button" disabled={busy} onClick={() => void deleteHandover(handover)} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-600" aria-label="Slet overlevering"><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      </div>}
    </section>
  )
}
