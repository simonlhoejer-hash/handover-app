const CACHE_NAME = 'handover-offline-v33'

function normalizedPath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
}

const SHIPS = ['crown', 'pearl']
const FOOD_WASTE_ROUTES = [
  '',
  '/overblik',
  '/skagerak-morgen',
  '/skagerak-aften',
  '/messen-morgen',
  '/messen-frokost',
  '/messen-aften',
  '/commodore-morgen',
  '/produktion-main-galley',
  '/produktion-skagerak-galley',
  '/produktion-slagteri',
  '/produktion-proviant-daek-1',
]

const APP_SHELL = [
  '/',
  '/ships',
  '/crown',
  ...FOOD_WASTE_ROUTES.map((route) => `/crown/food-waste${route}`),
  '/pearl',
  ...FOOD_WASTE_ROUTES
    .filter((route) => !route.startsWith('/produktion-'))
    .map((route) => `/pearl/food-waste${route}`),
  '/manifest-galley.json',
  '/manifest-pearl.json',
  '/icon-192.png',
  '/icon-512.png',
  '/go-nordic-logo.png',
]

async function cachePaths(paths) {
  const cache = await caches.open(CACHE_NAME)
  const assetPaths = new Set()

  await Promise.allSettled(
    paths.map(async (path) => {
      const response = await fetch(path, { cache: 'reload' })
      const finalUrl = new URL(response.url)
      if (
        response.ok &&
        finalUrl.origin === self.location.origin &&
        normalizedPath(finalUrl.pathname) === normalizedPath(path)
      ) {
        await cache.put(path, response.clone())

        if (response.headers.get('content-type')?.includes('text/html')) {
          const html = await response.text()
          for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
            const assetUrl = new URL(match[1], self.location.origin)
            if (
              assetUrl.origin === self.location.origin &&
              assetUrl.pathname.startsWith('/_next/static/')
            ) {
              assetPaths.add(assetUrl.href)
            }
          }
        }
      }
    })
  )

  await Promise.allSettled(
    [...assetPaths].map(async (assetPath) => {
      const response = await fetch(assetPath, { cache: 'reload' })
      if (response.ok) await cache.put(assetPath, response)
    })
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(cachePaths(APP_SHELL))
  self.skipWaiting()
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'WARM_SHIP') return

  const ship = event.data.ship
  if (!SHIPS.includes(ship)) return

  const routes = FOOD_WASTE_ROUTES
    .filter((route) => ship === 'crown' || !route.startsWith('/produktion-'))
    .map((route) => `/${ship}/food-waste${route}`)

  event.waitUntil(cachePaths([`/${ship}`, ...routes]))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== CACHE_NAME)
              .map((key) => caches.delete(key))
          )
        ),
      self.registration.navigationPreload
        ? self.registration.navigationPreload.enable()
        : Promise.resolve(),
    ])
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.hostname.includes('supabase.co')) return

  // API responses contain live operational data and must never come from an
  // older page cache. Offline-capable features keep their own explicit queue.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const pathKey = normalizedPath(url.pathname)
        const network = async () => {
          const preloaded = await event.preloadResponse
          const response = preloaded || await fetch(request)
          if (!response || !response.ok) throw new Error('Navigation failed')

          const finalUrl = new URL(response.url)
          if (
            finalUrl.origin === self.location.origin &&
            normalizedPath(finalUrl.pathname) === pathKey
          ) {
            await cache.put(pathKey, response.clone())
          }

          return response
        }

        // Always prefer the current app while online. The cache is only the
        // offline fallback, preventing installed iOS apps from keeping an old
        // home screen after a deployment.
        return network().catch(async () => {
          const ship = pathKey.startsWith('/pearl') ? 'pearl' : 'crown'
          return (
            await caches.match(request) ||
            await cache.match(pathKey) ||
            await cache.match(`/${ship}/food-waste`) ||
            await cache.match('/ships') ||
            await cache.match('/')
          )
        })
      })
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
