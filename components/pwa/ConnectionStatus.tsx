'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudOff } from 'lucide-react'
import { readPendingFoodWasteEntries } from '@/lib/foodWasteOffline'
import { useTranslation } from '@/lib/LanguageContext'

function getPendingCount() {
  return readPendingFoodWasteEntries().length
}

export default function ConnectionStatus() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    function updateStatus() {
      setIsOnline(navigator.onLine)
      setPendingCount(getPendingCount())
    }

    updateStatus()

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    window.addEventListener('storage', updateStatus)
    window.addEventListener('food-waste-pending-updated', updateStatus)

    const timer = window.setInterval(updateStatus, 15000)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      window.removeEventListener('storage', updateStatus)
      window.removeEventListener('food-waste-pending-updated', updateStatus)
      window.clearInterval(timer)
    }
  }, [])

  const hasPending = pendingCount > 0
  const label = isOnline ? t.online : t.offline
  const detail = hasPending ? `${pendingCount} ${t.waitingShort}` : t.synced
  const Icon = isOnline ? Cloud : CloudOff

  return (
    <div className="fixed right-3 top-3 z-30 sm:right-4 sm:top-4">
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
          <Icon size={17} strokeWidth={2} />
          {hasPending && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white sm:hidden">
              {pendingCount > 9 ? '9+' : pendingCount}
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
