'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerServiceWorker = () => {
      void navigator.serviceWorker.register('/sw.js')
    }

    if (document.readyState === 'complete') {
      registerServiceWorker()
      return
    }

    window.addEventListener('load', registerServiceWorker)

    return () => window.removeEventListener('load', registerServiceWorker)
  }, [])

  return null
}
