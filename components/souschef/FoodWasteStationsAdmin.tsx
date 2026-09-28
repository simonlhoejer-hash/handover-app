'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import type { AccessShip } from '@/lib/shipAccess'
import { stationSlug, type FoodWasteStation, type WasteArea } from '@/lib/foodWasteStationConfig'

const labels: Record<WasteArea, string> = { 'morning-buffet': 'Morgenbuffet', 'evening-buffet': 'Aftenbuffet', mess: 'Messen', production: 'Produktion' }

export default function FoodWasteStationsAdmin({ ship }: { ship: AccessShip }) {
  const [stations, setStations] = useState<FoodWasteStation[]>([])
  const [name, setName] = useState('')
  const [area, setArea] = useState<WasteArea>('morning-buffet')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { void load() }, [ship])
  async function load() {
    const response = await fetch(`/api/food-waste/locations?ship=${ship}`, { cache: 'no-store' })
    const result = await response.json()
    if (response.ok) setStations(result.data ?? []); else setMessage(result.error)
  }
  async function save(next: FoodWasteStation[]) {
    setBusy(true); setMessage('')
    const response = await fetch('/api/food-waste/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ship, stations: next }) })
    const result = await response.json()
    if (response.ok) { setStations(result.data); setMessage('Stationerne er gemt.') } else setMessage(result.error ?? 'Kunne ikke gemme.')
    setBusy(false)
  }
  function add(event: FormEvent) {
    event.preventDefault(); const trimmed = name.trim(); if (!trimmed) return
    let slug = stationSlug(trimmed); let suffix = 2
    while (stations.some((station) => station.slug === slug)) slug = `${stationSlug(trimmed)}-${suffix++}`
    void save([...stations, { slug, name: trimmed, area, active: true, order: stations.length }]); setName('')
  }
  function change(index: number, changes: Partial<FoodWasteStation>) { const next = stations.map((station, i) => i === index ? { ...station, ...changes } : station); setStations(next) }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= stations.length) return; const next = [...stations]; [next[index], next[target]] = [next[target], next[index]]; void save(next) }

  return <section className="mt-7 rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d3b3a] sm:p-7">
    <h2 className="text-xl font-semibold">Administrér spildstationer</h2>
    <p className="mt-1 text-sm text-gray-500 dark:text-white/60">Ændringer gælder kun {ship === 'crown' ? 'Crown' : 'Pearl'}. Deaktivér stationer med historik i stedet for at slette dem.</p>
    <form onSubmit={add} className="mt-5 grid gap-3 sm:grid-cols-[1fr_190px_auto]">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ny stations navn" maxLength={120} className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
      <select value={area} onChange={(e) => setArea(e.target.value as WasteArea)} className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-[#0d3b3a]">{Object.entries(labels).filter(([key]) => ship === 'crown' || key !== 'production').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <button disabled={busy || !name.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-[#064e4c] px-5 py-3 font-semibold text-white disabled:opacity-50"><Plus size={18}/> Opret</button>
    </form>
    {message && <p className="mt-4 rounded-xl bg-[#347f7a]/10 px-4 py-3 text-sm font-semibold text-[#216762] dark:text-[#a8d5d1]">{message}</p>}
    <div className="mt-5 space-y-2">{stations.map((station, index) => <div key={station.slug} className={`grid gap-2 rounded-2xl border p-3 dark:border-white/10 sm:grid-cols-[1fr_180px_auto_auto] ${station.active ? 'border-black/5' : 'border-black/5 opacity-55'}`}>
      <input value={station.name} onChange={(e) => change(index, { name: e.target.value })} onBlur={() => void save(stations)} className="rounded-xl bg-gray-50 px-3 py-2 font-semibold dark:bg-white/5" />
      <select value={station.area} onChange={(e) => { const next = stations.map((item, i) => i === index ? { ...item, area: e.target.value as WasteArea } : item); void save(next) }} className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-[#082f2e]">{Object.entries(labels).filter(([key]) => ship === 'crown' || key !== 'production').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <label className="flex items-center gap-2 px-2 text-sm font-semibold"><input type="checkbox" checked={station.active} onChange={(e) => { const next = stations.map((item, i) => i === index ? { ...item, active: e.target.checked } : item); void save(next) }} /> Aktiv</label>
      <div className="flex"><button type="button" onClick={() => move(index, -1)} disabled={busy || index === 0} className="rounded-lg p-2 disabled:opacity-25"><ArrowUp size={17}/></button><button type="button" onClick={() => move(index, 1)} disabled={busy || index === stations.length - 1} className="rounded-lg p-2 disabled:opacity-25"><ArrowDown size={17}/></button></div>
    </div>)}</div>
  </section>
}
