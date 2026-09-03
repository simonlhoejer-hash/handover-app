'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useTranslation } from '@/lib/LanguageContext'

export default function ServiceWorkerRegistration() {
  const { t } = useTranslation()
  const [cacheState, setCacheState] = useState<'idle' | 'caching' | 'ready' | 'error'>('idle')
  const [cacheSeconds, setCacheSeconds] = useState(0)
  const [cacheVersion, setCacheVersion] = useState('')

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const warmCurrentShip = (registration: ServiceWorkerRegistration) => {
      if (!navigator.onLine) return

      const ship = window.location.pathname.startsWith('/pearl')
        ? 'pearl'
        : window.location.pathname.startsWith('/crown')
          ? 'crown'
          : null

      if (!ship) return
      const worker = registration.active ?? registration.waiting
      worker?.postMessage({ type: 'WARM_SHIP', ship })
    }

    const registerServiceWorker = () => {
      void navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then(async (registration) => {
          await registration.update().catch(() => undefined)
          warmCurrentShip(registration)
          const readyRegistration = await navigator.serviceWorker.ready
          warmCurrentShip(readyRegistration)
        })
        .catch(() => undefined)
    }

    const handleOnline = () => {
      void navigator.serviceWorker.ready.then(warmCurrentShip)
    }

    const handleControllerChange = () => {
      void navigator.serviceWorker.ready.then(warmCurrentShip)
    }

    const handleWorkerMessage = (event: MessageEvent) => {
      if (event.data?.cacheVersion) setCacheVersion(String(event.data.cacheVersion))
      if (event.data?.type === 'OFFLINE_CACHE_START') {
        setCacheSeconds(0)
        setCacheState('caching')
      } else if (event.data?.type === 'OFFLINE_CACHE_READY') {
        if (event.data?.cacheVersion) {
          try {
            localStorage.setItem('handover-offline-cache-version', String(event.data.cacheVersion))
            window.dispatchEvent(new Event('handover-offline-cache-updated'))
          } catch {
            // The temporary confirmation still shows if storage is unavailable.
          }
        }
        setCacheState('ready')
      } else if (event.data?.type === 'OFFLINE_CACHE_ERROR') {
        setCacheState('error')
      }
    }

    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
    }
    window.addEventListener('online', handleOnline)
    navigator.serviceWorker.addEventListener('message', handleWorkerMessage)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      window.removeEventListener('load', registerServiceWorker)
      window.removeEventListener('online', handleOnline)
      navigator.serviceWorker.removeEventListener('message', handleWorkerMessage)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  useEffect(() => {
    if (cacheState !== 'caching') return
    const timer = window.setInterval(() => setCacheSeconds((seconds) => seconds + 1), 1000)
    const timeout = window.setTimeout(() => setCacheState('idle'), 90_000)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(timeout)
    }
  }, [cacheState])

  useEffect(() => {
    if (cacheState !== 'ready' && cacheState !== 'error') return
    const timer = window.setTimeout(
      () => setCacheState('idle'),
      cacheState === 'ready' ? 4000 : 6000
    )
    return () => window.clearTimeout(timer)
  }, [cacheState])

  if (cacheState === 'idle') return null

  return (
    <div className={`fixed bottom-24 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-xl ${
      cacheState === 'ready'
        ? 'bg-emerald-100/95 text-emerald-800'
        : cacheState === 'error'
          ? 'bg-amber-100/95 text-amber-900'
          : 'bg-white/95 text-gray-800'
    }`}>
      {cacheState === 'ready' ? (
        <CheckCircle2 size={18} />
      ) : cacheState === 'error' ? (
        <TriangleAlert size={18} />
      ) : (
        <LoaderCircle size={18} className="animate-spin" />
      )}
      <span className="whitespace-nowrap">
        {cacheState === 'ready'
          ? t.offlineCacheReady
          : cacheState === 'error'
            ? t.offlineCacheError
            : `${t.offlineCachePreparing} · ${cacheSeconds} ${t.secondsShort}`}
        {cacheVersion ? ` · cache ${cacheVersion}` : ''}
      </span>
    </div>
  )
}
