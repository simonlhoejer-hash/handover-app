'use client'

import { useEffect, useRef } from 'react'

export default function KeepScreenAwake() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const requestingRef = useRef(false)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    async function requestWakeLock() {
      if (document.visibilityState !== 'visible' || wakeLockRef.current || requestingRef.current) return
      requestingRef.current = true
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        wakeLockRef.current = sentinel
        sentinel.addEventListener('release', () => {
          if (wakeLockRef.current === sentinel) wakeLockRef.current = null
        }, { once: true })
      } catch {
        // Some tablets require the first tap before granting a screen wake lock.
      } finally {
        requestingRef.current = false
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void requestWakeLock()
    }
    const handleFirstInteraction = () => void requestWakeLock()

    void requestWakeLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true })
    window.addEventListener('keydown', handleFirstInteraction)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pointerdown', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      void wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [])

  return null
}
