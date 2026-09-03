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

    const useCachedNavigationWhenOffline = (event: MouseEvent) => {
      if (
        navigator.onLine ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return

      const element = event.target instanceof Element ? event.target : null
      const anchor = element?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || url.protocol !== window.location.protocol) return

      // A full navigation is handled by the service worker's cached HTML.
      // Next's client navigation would otherwise request an uncached RSC
      // response and show its generic offline error page.
      event.preventDefault()
      event.stopPropagation()
      window.location.assign(url.href)
    }

    navigator.serviceWorker.addEventListener('controllerchange', useNewWorker)
    document.addEventListener('click', useCachedNavigationWhenOffline, true)

    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
    }

    return () => {
      window.removeEventListener('load', registerServiceWorker)
      navigator.serviceWorker.removeEventListener('controllerchange', useNewWorker)
      document.removeEventListener('click', useCachedNavigationWhenOffline, true)
    }
  }, [])

  return null
}
