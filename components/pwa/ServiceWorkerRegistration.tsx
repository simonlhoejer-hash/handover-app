'use client'

import { useEffect, useRef, useState } from 'react'

type CacheState = 'idle' | 'caching' | 'ready' | 'error'

export default function ServiceWorkerRegistration() {
  const [cacheState, setCacheState] = useState<CacheState>('idle')
  const [cacheSeconds, setCacheSeconds] = useState(0)
  const [cacheVersion, setCacheVersion] = useState('')
  const warmingVersionRef = useRef('')

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const getCurrentShip = () => {
      if (!navigator.onLine) return null

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

    const checkCurrentShip = (registration: ServiceWorkerRegistration) => {
      const ship = getCurrentShip()
      if (!ship) return
      const worker = registration.waiting ?? registration.active
      worker?.postMessage({ type: 'GET_OFFLINE_CACHE_STATUS', ship })
    }

    const registerServiceWorker = () => {
      void navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          checkCurrentShip(registration)
          void registration.update().catch(() => undefined)
          void navigator.serviceWorker.ready.then(checkCurrentShip)
        })
        .catch(() => undefined)
    }

    const handleOnline = () => {
      void navigator.serviceWorker.ready.then(checkCurrentShip)
    }

    const handleControllerChange = () => {
      warmingVersionRef.current = ''
      void navigator.serviceWorker.ready.then(checkCurrentShip)
    }

    const handleWorkerMessage = (event: MessageEvent) => {
      const version = String(event.data?.cacheVersion || '')
      if (version) setCacheVersion(version)

      if (event.data?.type === 'OFFLINE_CACHE_STATUS') {
        if (event.data?.ready) {
          warmingVersionRef.current = ''
          try {
            localStorage.setItem('handover-offline-cache-version', version)
            window.dispatchEvent(new Event('handover-offline-cache-updated'))
          } catch {
            // The verified status is still available for this session.
          }
          setCacheState('ready')
        } else if (warmingVersionRef.current !== version) {
          warmingVersionRef.current = version
          setCacheSeconds(0)
          setCacheState('caching')
          const ship = getCurrentShip()
          if (ship) event.source?.postMessage({ type: 'WARM_SHIP', ship })
        }
      } else if (event.data?.type === 'OFFLINE_CACHE_START') {
        setCacheSeconds(0)
        setCacheState('caching')
      } else if (event.data?.type === 'OFFLINE_CACHE_READY') {
        warmingVersionRef.current = ''
        if (version) {
          try {
            localStorage.setItem('handover-offline-cache-version', version)
            window.dispatchEvent(new Event('handover-offline-cache-updated'))
          } catch {
            // The verified status is still available for this session.
          }
        }
        setCacheState('ready')
      } else if (event.data?.type === 'OFFLINE_CACHE_ERROR') {
        warmingVersionRef.current = ''
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
    const timeout = window.setTimeout(() => setCacheState('error'), 90_000)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(timeout)
    }
  }, [cacheState])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('handover-offline-cache-status', {
      detail: { state: cacheState, seconds: cacheSeconds, version: cacheVersion },
    }))
  }, [cacheState, cacheSeconds, cacheVersion])

  return null
}
