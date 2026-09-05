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

    const getCurrentShip = () => {
      if (!navigator.onLine) return

      const pathname = window.location.pathname
      if (
        pathname === '/crown/adgang' ||
        pathname === '/pearl/adgang' ||
        pathname.startsWith('/adgang/') ||
        pathname.startsWith('/crown/souschef')
      ) {
        return null
      }

      return pathname.startsWith('/pearl')
        ? 'pearl'
        : pathname.startsWith('/crown')
          ? 'crown'
          : null
    }

    const warmCurrentShip = (registration: ServiceWorkerRegistration) => {
      const ship = getCurrentShip()
      if (!ship) return
      const worker = registration.waiting ?? registration.active
      if (worker) {
        setCacheSeconds(0)
        setCacheVersion('')
        setCacheState('caching')
        worker.postMessage({ type: 'WARM_SHIP', ship })
      }
    }

    const registerServiceWorker = () => {
      const ship = getCurrentShip()
      if (ship) {
        setCacheSeconds(0)
        setCacheVersion('')
        setCacheState('caching')
      }

      void navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          warmCurrentShip(registration)
          void registration.update().catch(() => undefined)
          void navigator.serviceWorker.ready.then(warmCurrentShip)
        })
        .catch(() => {
          if (ship) setCacheState('error')
        })
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

    registerServiceWorker()
    window.addEventListener('online', handleOnline)
    navigator.serviceWorker.addEventListener('message', handleWorkerMessage)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
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
    <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center px-5">
      <div className={`flex min-w-[min(22rem,calc(100vw-2.5rem))] items-center justify-center gap-3 rounded-2xl border px-6 py-5 text-base font-semibold shadow-[0_20px_60px_rgba(0,0,0,.22)] backdrop-blur-xl ${
        cacheState === 'ready'
          ? 'border-emerald-500/20 bg-emerald-100/95 text-emerald-800'
          : cacheState === 'error'
            ? 'border-amber-500/25 bg-amber-100/95 text-amber-900'
            : 'border-black/10 bg-white/95 text-gray-800'
      }`}>
        {cacheState === 'ready' ? (
          <CheckCircle2 size={23} />
        ) : cacheState === 'error' ? (
          <TriangleAlert size={23} />
        ) : (
          <LoaderCircle size={23} className="animate-spin" />
        )}
        <span className="whitespace-nowrap text-center">
          {cacheState === 'ready'
            ? t.offlineCacheReady
            : cacheState === 'error'
              ? t.offlineCacheError
              : `${t.offlineCachePreparing} · ${cacheSeconds} ${t.secondsShort}`}
          {cacheVersion ? ` · cache ${cacheVersion}` : ''}
        </span>
      </div>
    </div>
  )
}
