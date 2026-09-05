const CACHE_VERSION = '39'
const CACHE_NAME = `handover-offline-v${CACHE_VERSION}`
const CACHE_FETCH_TIMEOUT_MS = 15_000

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
      const response = await fetch(path, {
        cache: 'reload',
        signal: AbortSignal.timeout(CACHE_FETCH_TIMEOUT_MS),
      })
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
      const response = await fetch(assetPath, {
        cache: 'reload',
        signal: AbortSignal.timeout(CACHE_FETCH_TIMEOUT_MS),
      })
      if (response.ok) await cache.put(assetPath, response)
    })
  )
}

async function seedFromPreviousCache(paths) {
  const cache = await caches.open(CACHE_NAME)

  await Promise.allSettled(
    paths.map(async (path) => {
      if (await cache.match(path)) return
      const previous = await caches.match(path)
      if (previous) await cache.put(path, previous)
    })
  )
}

async function hasAllPaths(paths) {
  const cache = await caches.open(CACHE_NAME)
  return (await Promise.all(paths.map((path) => cache.match(path)))).every(Boolean)
}

async function matchNewestOfflineCache(key) {
  const cacheNames = (await caches.keys())
    .filter((name) => name.startsWith('handover-offline-v'))
    .sort((left, right) => {
      const leftVersion = Number(left.replace('handover-offline-v', '')) || 0
      const rightVersion = Number(right.replace('handover-offline-v', '')) || 0
      return rightVersion - leftVersion
    })

  for (const cacheName of cacheNames) {
    const cached = await (await caches.open(cacheName)).match(key)
    if (cached) return cached
  }

  return undefined
}

function stringHash(value) {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}

function rscCacheKeys(request, url) {
  const state = request.headers.get('next-router-state-tree') || ''
  const prefetch = request.headers.get('next-router-prefetch') || ''
  const path = normalizedPath(url.pathname)
  return {
    exact: `/__offline-rsc${path}?state=${stringHash(state)}&prefetch=${prefetch}`,
    latest: `/__offline-rsc${path}?latest=1`,
  }
}

self.addEventListener('install', (event) => {
  // Activate immediately. The complete working cache from the previous
  // version is retained and promoted when the current ship is warmed.
  event.waitUntil(Promise.resolve())
  self.skipWaiting()
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'WARM_SHIP') return

  const ship = event.data.ship
  if (!SHIPS.includes(ship)) return

  const routes = FOOD_WASTE_ROUTES
    .filter((route) => ship === 'crown' || !route.startsWith('/produktion-'))
    .map((route) => `/${ship}/food-waste${route}`)

  const requiredPaths = [`/${ship}`, ...routes]
  event.source?.postMessage({ type: 'OFFLINE_CACHE_START', ship, cacheVersion: CACHE_VERSION })

  event.waitUntil(
    seedFromPreviousCache(requiredPaths).then(async () => {
      const seeded = await hasAllPaths(requiredPaths)

      if (seeded) {
        event.source?.postMessage({
          type: 'OFFLINE_CACHE_READY',
          ship,
          cacheVersion: CACHE_VERSION,
        })

        // Refresh the promoted pages without making the crew wait for them.
        await cachePaths(requiredPaths)
        return
      }

      await cachePaths(requiredPaths)
      const ready = await hasAllPaths(requiredPaths)

      event.source?.postMessage({
        type: ready ? 'OFFLINE_CACHE_READY' : 'OFFLINE_CACHE_ERROR',
        ship,
        cacheVersion: CACHE_VERSION,
      })
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Keep the previous cache as a fallback while a device finishes
      // preparing the newest offline version.
      Promise.resolve(),
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

  const isRscRequest =
    request.headers.get('rsc') === '1' || url.searchParams.has('_rsc')

  if (isRscRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = rscCacheKeys(request, url)
        try {
          const response = await fetch(request)
          if (response.ok) {
            await Promise.all([
              cache.put(keys.exact, response.clone()),
              cache.put(keys.latest, response.clone()),
            ])
          }
          return response
        } catch {
          const fallback =
            await matchNewestOfflineCache(keys.exact) ||
            await matchNewestOfflineCache(keys.latest)

          if (fallback) {
            await Promise.allSettled([
              cache.put(keys.exact, fallback.clone()),
              cache.put(keys.latest, fallback.clone()),
            ])
            return fallback
          }

          return new Response('', { status: 503, statusText: 'Offline route unavailable' })
        }
      })
    )
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
            await matchNewestOfflineCache(pathKey) ||
            await cache.match(`/${ship}/food-waste`) ||
            await matchNewestOfflineCache(`/${ship}/food-waste`) ||
            await cache.match('/ships') ||
            await matchNewestOfflineCache('/ships') ||
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
