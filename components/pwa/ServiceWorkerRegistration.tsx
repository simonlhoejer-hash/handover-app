'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let refreshing = false

    const useNewWorker = () => {
      // Never replace the currently working screen with a browser reload while
      // offline. The new worker already controls the open app, and the normal
      // online navigation will pick up the newest files later.
      if (refreshing || !navigator.onLine) return
      refreshing = true
      window.location.reload()
    }

    const registerServiceWorker = () => {
      void navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => registration.update())
        .catch(() => undefined)
    }

    navigator.serviceWorker.addEventListener('controllerchange', useNewWorker)

    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
    }

    return () => {
      window.removeEventListener('load', registerServiceWorker)
      navigator.serviceWorker.removeEventListener('controllerchange', useNewWorker)
    }
  }, [])

  return null
}
