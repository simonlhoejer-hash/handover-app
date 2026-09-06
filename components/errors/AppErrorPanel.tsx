'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  error: Error & { digest?: string }
  reset?: () => void
}

export default function AppErrorPanel({ error, reset }: Props) {
  const [clearing, setClearing] = useState(false)
  const diagnostic = useMemo(() => {
    const userAgent = typeof navigator === 'undefined' ? 'ukendt browser' : navigator.userAgent
    return [
      error.name || 'Error',
      error.message || 'Ukendt klientfejl',
      error.digest ? `digest=${error.digest}` : '',
      userAgent,
    ].filter(Boolean).join(' | ').slice(0, 900)
  }, [error])

  useEffect(() => {
    console.error('[HandoverPro startup error]', error)
  }, [error])

  async function clearAppCache() {
    setClearing(true)
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
      }
      if ('caches' in window) {
        const names = await window.caches.keys()
        await Promise.all(names.map((name) => window.caches.delete(name)))
      }
    } catch (cacheError) {
      console.error('[HandoverPro cache cleanup error]', cacheError)
    } finally {
      window.location.reload()
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-5 text-[#102f2e]">
      <section className="w-full max-w-lg rounded-3xl border border-black/5 bg-white p-7 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#347f7a]">HandoverPro</p>
        <h1 className="mt-3 text-2xl font-semibold">Appen kunne ikke starte</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Prøv først igen. Hvis fejlen fortsætter på denne enhed, kan du rydde den gamle app-cache uden at slette ventende waste-målinger.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => reset ? reset() : window.location.reload()}
            className="rounded-xl bg-[#064e4c] px-4 py-3 font-semibold text-white"
          >
            Prøv igen
          </button>
          <button
            type="button"
            disabled={clearing}
            onClick={() => void clearAppCache()}
            className="rounded-xl border border-[#064e4c]/15 px-4 py-3 font-semibold text-[#064e4c] disabled:opacity-50"
          >
            {clearing ? 'Rydder cache…' : 'Ryd gammel app-cache'}
          </button>
        </div>
        <details className="mt-6 rounded-xl bg-gray-100 p-3 text-xs text-gray-600">
          <summary className="cursor-pointer font-semibold">Teknisk fejlkode</summary>
          <code className="mt-2 block break-words whitespace-pre-wrap">{diagnostic}</code>
        </details>
      </section>
    </main>
  )
}
