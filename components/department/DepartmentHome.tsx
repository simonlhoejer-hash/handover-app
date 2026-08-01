'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  department: 'admin' | 'shop' | 'crown' | 'pearl'
  items: string[]
  basePath: string
}

type StatusMap = Record<
  string,
  {
    hasNotes: boolean
    lastDate?: string
    readBy?: string | null
    receiverName?: string | null
  }
>

type HandoverStatusRow = {
  parti: string
  shift_date?: string
  read_by?: string | null
  receiver_name?: string | null
  created_at?: string
  updated_at?: string
}

function formatDate(dateString?: string, lang?: string) {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString(
    lang === 'sv' ? 'sv-SE' : 'da-DK',
    {
      day: 'numeric',
      month: 'short',
    }
  )
}

export default function DepartmentHome({
  department,
  items,
  basePath,
}: Props) {
  const { t, lang } = useTranslation()
  const [status, setStatus] = useState<StatusMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    const cacheKey = `handover-status:${department}`

    try {
      const cached = window.localStorage.getItem(cacheKey)

      if (cached) {
        setStatus(JSON.parse(cached) as StatusMap)
        setLoading(false)
      }
    } catch {
      // Continue with live data if local storage is unavailable.
    }

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('handover_notes')
        .select(`
          parti,
          shift_date,
          read_by,
          receiver_name,
          created_at,
          updated_at
        `)
        .eq('department', department)
        .or('status.eq.published,status.is.null')
        .order('shift_date', { ascending: false })
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (!isCurrent) return

      if (error) {
        setLoading(false)
        return
      }

      const RESET_DAYS = 6
      const result: StatusMap = {}
      const latestByParti = new Map<string, HandoverStatusRow>()

      for (const row of (data ?? []) as HandoverStatusRow[]) {
        if (!latestByParti.has(row.parti)) {
          latestByParti.set(row.parti, row)
        }
      }

      for (const item of items) {
        const latest = latestByParti.get(item)

        let isExpired = false

        const statusDate = latest?.shift_date || latest?.updated_at || latest?.created_at

        if (statusDate) {
          const daysOld = Math.floor(
            (Date.now() - new Date(statusDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )

          if (daysOld >= RESET_DAYS) {
            isExpired = true
          }
        }

        result[item] = {
          hasNotes: !!latest && !isExpired,
          lastDate: latest?.shift_date,
          readBy: isExpired ? null : latest?.read_by ?? null,
          receiverName: isExpired ? null : latest?.receiver_name ?? null,
        }
      }

      setStatus(result)
      setLoading(false)

      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(result))
      } catch {
        // Live status still works if local storage is unavailable.
      }
    }

    void fetchStatus()

    return () => {
      isCurrent = false
    }
  }, [department, items])

  return (
    <main className="pt-8 sm:pt-12 pb-8 max-w-5xl mx-auto">
      <header className="mb-8 sm:mb-10 flex flex-col items-center text-center">
        <div>
          <h1 className="font-nordic-display text-4xl sm:text-5xl text-[#102f2e] dark:text-white">
            {t.handoverTitle}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
            {t.handoverSubtitle}
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {[...items]
          .sort((a, b) => {
            const aInfo = status[a]
            const bInfo = status[b]

            const getPriority = (info?: StatusMap[string]) => {
              if (info?.hasNotes && !info?.readBy) return 1
              if (info?.hasNotes && info?.readBy) return 2
              return 3
            }

            const priorityDiff =
              getPriority(aInfo) - getPriority(bInfo)

            if (priorityDiff !== 0) return priorityDiff

            const aDate = aInfo?.lastDate
              ? new Date(aInfo.lastDate).getTime()
              : 0
            const bDate = bInfo?.lastDate
              ? new Date(bInfo.lastDate).getTime()
              : 0

            return bDate - aDate
          })
          .map((item) => {

            const info = status[item]
            const hasNotes = info?.hasNotes

            return (
              <Link
                key={item}
                href={`${basePath}/${encodeURIComponent(item)}`}
                className="
                  group rounded-xl
                  p-5
                  min-h-[126px]

                  flex items-center justify-center

                  nordic-card

                  text-gray-900
                  shadow-sm

                  hover:border-[#347f7a]/40
                  hover:-translate-y-0.5

                  transition-all duration-200

                  dark:bg-[#162338]
                  dark:border-white/10
                  dark:text-white
                "
              >

                <div className="w-full flex flex-col items-center text-center space-y-2">

                  <h2 className="text-xl font-semibold tracking-tight text-[#102f2e] dark:text-white">
                    {item}
                  </h2>

                  {/* STATUS */}

                  {loading && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/10 text-gray-500 dark:text-white/60">
                      {t.loading}
                    </span>
                  )}

                  {!loading && !hasNotes && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/15 text-red-500">
                      {t.missing}
                    </span>
                  )}

                  {!loading && hasNotes && !info?.readBy && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-400/20 text-amber-600">
                      {t.pending}
                    </span>
                  )}

                  {!loading && hasNotes && info?.readBy && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-400/20 text-emerald-600">
                      {t.read}
                    </span>
                  )}

                  {/* INFO */}

                  <div className="text-sm text-gray-500 dark:text-white/60">

                    {loading ? (

                      <div className="text-xs opacity-50">
                        {t.loading}
                      </div>

                    ) : info?.lastDate ? (

                      <div className="flex items-center justify-center gap-2">

                        {info?.receiverName && !info?.readBy && (
                          <span className="font-semibold text-amber-600">
                            {info.receiverName}
                          </span>
                        )}

                        {info?.readBy && (
                          <span className="font-semibold text-emerald-600">
                            {info.readBy}
                          </span>
                        )}

                        {(info?.receiverName || info?.readBy) && (
                          <span className="opacity-40">·</span>
                        )}

                        <span className="opacity-70">
                          {formatDate(info.lastDate, lang)}
                        </span>

                      </div>

                    ) : (

                      <div className="text-xs opacity-50">
                        {t.noHandover}
                      </div>

                    )}

                  </div>

                </div>

              </Link>
            )
          })}

      </div>
    </main>
  )
}
