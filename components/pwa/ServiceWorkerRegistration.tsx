'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
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

    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
    }
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('load', registerServiceWorker)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return null
}
