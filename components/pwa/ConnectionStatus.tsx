'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import {
  getPendingFoodWasteCount,
  syncAllPendingFoodWaste,
} from '@/lib/foodWasteSync'
import { useTranslation } from '@/lib/LanguageContext'

function clearLegacyLocalHandoverDrafts() {
  try {
    const keys: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith('handover-local-draft:')) keys.push(key)
    }
    for (const key of keys) window.localStorage.removeItem(key)
  } catch {
    // Browser storage may be unavailable; no action is required.
  }
}

export default function ConnectionStatus() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'retry'>('idle')
  const isSyncingRef = useRef(false)

  const syncPending = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current || getPendingFoodWasteCount() === 0) {
      return
    }

    isSyncingRef.current = true
    setSyncState('syncing')

    try {
      const result = await syncAllPendingFoodWaste()
      setPendingCount(result.remaining)
      setSyncState(result.remaining > 0 ? 'retry' : 'idle')
    } catch {
      setPendingCount(getPendingFoodWasteCount())
      setSyncState('retry')
    } finally {
      isSyncingRef.current = false
    }
  }, [])

  useEffect(() => {
    clearLegacyLocalHandoverDrafts()

    function updateStatus() {
      setIsOnline(navigator.onLine)
      setPendingCount(getPendingFoodWasteCount())
    }

    function handleOnline() {
      updateStatus()
      void syncPending()
    }

    updateStatus()
    if (navigator.onLine) void syncPending()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', updateStatus)
    window.addEventListener('storage', updateStatus)
    window.addEventListener('food-waste-pending-updated', updateStatus)

    const timer = window.setInterval(() => {
      updateStatus()
      if (navigator.onLine) void syncPending()
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', updateStatus)
      window.removeEventListener('storage', updateStatus)
      window.removeEventListener('food-waste-pending-updated', updateStatus)
      window.clearInterval(timer)
    }
  }, [syncPending])

  const totalPending = pendingCount
  const hasPending = pendingCount > 0
  const label = isOnline ? t.online : t.offline
  const waitingDetail = pendingCount > 0 ? `${pendingCount} ${t.waitingShort}` : ''
  const detail =
    syncState === 'syncing'
      ? `${t.syncing}${waitingDetail ? ` · ${waitingDetail}` : ''}`
      : syncState === 'retry' && pendingCount > 0
        ? `${waitingDetail} · ${t.retrying}`
        : hasPending
          ? waitingDetail
          : t.synced
  const Icon = syncState === 'syncing' ? RefreshCw : isOnline ? Cloud : CloudOff

  return (
    <div className="fixed right-3 top-3 z-50 sm:right-4 sm:top-4">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-label={`${label}. ${detail}`}
        title={`${label} · ${detail}`}
        className={`
          flex items-center
          rounded-full
          border
          ${isExpanded ? 'gap-2 px-3 py-2' : 'gap-0 p-1.5'}
          shadow-lg
          backdrop-blur-xl
          sm:gap-2 sm:px-3 sm:py-2
          ${
            isOnline
              ? 'border-emerald-500/20 bg-emerald-50/95 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'
              : 'border-amber-500/25 bg-amber-50/95 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200'
          }
        `}
      >
        <span
          className={`
            relative
            flex h-8 w-8 items-center justify-center rounded-full
            ${
              isOnline
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-500 text-white'
            }
          `}
        >
          <Icon
            size={17}
            strokeWidth={2}
            className={syncState === 'syncing' ? 'animate-spin' : undefined}
          />
          {hasPending && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white sm:hidden">
              {totalPending > 9 ? '9+' : totalPending}
            </span>
          )}
        </span>

        <span className={`${isExpanded ? 'block' : 'hidden'} leading-tight text-left sm:block`}>
          <span className="block text-sm font-semibold">{label}</span>
          <span className="block text-xs opacity-75">{detail}</span>
        </span>
      </button>
    </div>
  )
}
