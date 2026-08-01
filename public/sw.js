const CACHE_NAME = 'handover-offline-v10'

const APP_SHELL = [
  '/',
  '/ships',
  '/crown',
  '/crown/food-waste',
  '/crown/food-waste/overblik',
  '/crown/food-waste/skagerak-morgen',
  '/crown/food-waste/skagerak-aften',
  '/crown/food-waste/messen-morgen',
  '/crown/food-waste/messen-frokost',
  '/crown/food-waste/messen-aften',
  '/crown/food-waste/commodore-morgen',
  '/crown/food-waste/produktion-main-galley',
  '/crown/food-waste/produktion-skagerak-galley',
  '/crown/food-waste/produktion-bageri',
  '/crown/food-waste/produktion-slagteri',
  '/crown/food-waste/produktion-proviant-daek-1',
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
            .then((cached) => cached || caches.match('/crown/food-waste'))
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
