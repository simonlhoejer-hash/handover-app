'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let refreshing = false

    const useNewWorker = () => {
      if (refreshing) return
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
