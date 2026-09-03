'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { AlertCircle, ArrowRight, LockKeyhole } from 'lucide-react'
import type { AccessShip } from '@/lib/shipAccess'

type Props = {
  ship: AccessShip
  destination: string
  initialCode?: string
}

export default function ShipAccessForm({
  ship,
  destination,
  initialCode = '',
}: Props) {
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const shipName = ship === 'crown' ? 'Nordic Crown' : 'Nordic Pearl'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ship, code }),
    })

    setLoading(false)

    const result = (await response.json().catch(() => null)) as {
      destination?: string
      error?: string
    } | null

    if (!response.ok) {
      setError(result?.error || 'Koden kunne ikke kontrolleres.')
      return
    }

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: 'WARM_SHIP', ship })
      })
    }

    // Force the first protected navigation through the network so an older
    // offline shell can never mask a successful login.
    window.location.replace(`${result?.destination || destination}?login=1`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--nordic-bg)] px-5 py-10 dark:bg-[#082d2d]">
      <section className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-7 shadow-[0_24px_60px_rgba(6,78,76,.12)] dark:border-white/10 dark:bg-[#073f3d] sm:p-9">
        <div className="flex justify-center">
          <Image
            src="/go-nordic-logo.png"
            alt="Go Nordic Cruiseline"
            width={420}
            height={120}
            className="h-12 w-auto dark:hidden"
            priority
          />
          <Image
            src="/go-nordic-logo-dark.png"
            alt=""
            aria-hidden="true"
            width={420}
            height={120}
            className="hidden h-12 w-auto dark:block"
            priority
          />
        </div>

        <div className="mt-9 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f1ef] text-[#064e4c] dark:bg-white/10 dark:text-white">
            <LockKeyhole size={22} />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#347f7a] dark:text-[#8dc4bf]">
            {shipName}
          </p>
          <h1 className="font-nordic-display mt-2 text-4xl text-[#102f2e] dark:text-white">
            Skriv kabyskoden
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-white/60">
            Kontrollér koden, og tryk OK. Enheden husker adgangen i 6 måneder.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            required
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'access-code-error' : undefined}
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              if (error) setError('')
            }}
            placeholder="Kabyskode"
            className={`w-full rounded-xl bg-white px-5 py-4 text-center text-lg font-semibold uppercase tracking-[0.14em] text-gray-900 outline-none transition dark:bg-white/5 dark:text-white ${
              error
                ? 'border-2 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-400'
                : 'border border-black/10 focus:border-[#347f7a] focus:ring-2 focus:ring-[#347f7a]/15 dark:border-white/10'
            }`}
          />

          {error && (
            <div
              id="access-code-error"
              role="alert"
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="group flex w-full items-center justify-between rounded-xl bg-[#064e4c] px-6 py-4 font-semibold text-white shadow-[0_12px_28px_rgba(6,78,76,.22)] transition hover:bg-[#073f3d] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{loading ? 'Kontrollerer...' : 'OK'}</span>
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </form>
      </section>
    </main>
  )
}
