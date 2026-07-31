const CACHE_NAME = 'handover-offline-v10'

const APP_SHELL = [
  '/',
  '/ships',
  '/galley',
  '/galley/food-waste',
  '/galley/food-waste/overblik',
  '/galley/food-waste/skagerak-morgen',
  '/galley/food-waste/skagerak-aften',
  '/galley/food-waste/messen-morgen',
  '/galley/food-waste/messen-frokost',
  '/galley/food-waste/messen-aften',
  '/galley/food-waste/commodore-morgen',
  '/galley/food-waste/produktion-main-galley',
  '/galley/food-waste/produktion-skagerak-galley',
  '/galley/food-waste/produktion-bageri',
  '/galley/food-waste/produktion-slagteri',
  '/galley/food-waste/produktion-proviant-daek-1',
  '/manifest-galley.json',
  '/pearl',
  '/pearl/food-waste',
  '/pearl/food-waste/overblik',
  '/manifest-pearl.json',
  '/icon-192.png',
  '/icon-512.png',
  '/go-nordic-logo.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.hostname.includes('supabase.co')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/galley/food-waste'))
        )
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) return

              const copy = response.clone()
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, copy)
              })
            })
            .catch(() => undefined)
        )

        return cached
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response

        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      })
    })
  )
})
