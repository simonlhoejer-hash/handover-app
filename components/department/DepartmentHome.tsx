'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  department: 'shop' | 'galley'
  items: string[]
  basePath: string
}

type StatusMap = Record<
  string,
  {
    hasNotes: boolean
    hasComments: boolean
    lastDate?: string
    readBy?: string | null
    receiverName?: string | null
  }
>

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
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('handover_notes')
        .select(`
          parti,
          shift_date,
          read_by,
          receiver_name,
          created_at,
          handover_comments(id)
        `)
        .eq('department', department)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        return
      }

      const RESET_DAYS = 6
      const result: StatusMap = {}

      for (const item of items) {
        const latest = data?.find(d => d.parti === item) as any

        let isExpired = false

        if (latest?.created_at) {
          const daysOld = Math.floor(
            (Date.now() - new Date(latest.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )

          if (daysOld >= RESET_DAYS) {
            isExpired = true
          }
        }

        result[item] = {
          hasNotes: !!latest && !isExpired,
          hasComments:
            !!latest &&
            !isExpired &&
            (latest.handover_comments?.length ?? 0) > 0,
          lastDate: latest?.shift_date,
          readBy: isExpired ? null : latest?.read_by ?? null,
          receiverName: isExpired ? null : latest?.receiver_name ?? null,
        }
      }

      setStatus(result)
      setLoading(false)
    }

    fetchStatus()
  }, [department, items])

return (
  <main className="px-4 py-6 max-w-5xl mx-auto">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

      {[...items]
        .sort((a, b) => {
          const aInfo = status[a]
          const bInfo = status[b]

const getPriority = (info: any) => {
  if (info?.hasNotes && !info?.readBy) return 1 // 🟡 Afventer
  if (info?.hasNotes && info?.readBy) return 2  // 🟢 Læst
  return 3                                      // 🔴 Mangler
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

          return aDate - bDate
        })
        .map((item) => {
          const info = status[item]
          const hasNotes = info?.hasNotes
          const isRead = hasNotes && !!info?.readBy
          const isUnread = hasNotes && !info?.readBy

          return (
<Link
  key={item}
  href={`${basePath}/${encodeURIComponent(item)}`}
className="
  rounded-2xl
  p-4
  h-[108px]
  flex items-center justify-center

  bg-white
  border border-gray-200
  text-gray-900
  shadow-[0_8px_20px_rgba(0,0,0,0.06)]

  dark:bg-[#162338]
  dark:border-white/10
  dark:text-white
  dark:shadow-none

  transition-all duration-200
  hover:scale-[1.02]
  active:scale-[0.98]
"
>
  <div className="flex flex-col items-center text-center space-y-2.5">

    {/* TITLE */}
    <h2 className="text-lg font-semibold">
      {item}
    </h2>

    {/* STATUS */}
    {!hasNotes && (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/15 text-red-400">
        {t.missing}
      </span>
    )}

    {hasNotes && !info?.readBy && (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
        {t.pending}
      </span>
    )}

    {hasNotes && info?.readBy && (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
        {t.read}
      </span>
    )}

{/* INFO */}
<div className="text-sm text-gray-500 dark:text-white/70">

  {info?.lastDate ? (
    <div className="flex items-center justify-center gap-2">

      {info?.receiverName && !info?.readBy && (
        <span className="text-base font-semibold text-yellow-400">
          {info.receiverName}
        </span>
      )}

      {info?.readBy && (
        <span className="text-base font-semibold text-emerald-400">
          {info.readBy}
        </span>
      )}

      {(info?.receiverName || info?.readBy) && (
        <span className="opacity-40">·</span>
      )}

      <span className="text-sm opacity-70">
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

  return (
    <main className="px-2 py-6 max-w-5xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
{[...items]
  .sort((a, b) => {
    const aInfo = status[a]
    const bInfo = status[b]

const getPriority = (info: any) => {
  if (info?.hasNotes && !info?.readBy) return 1 // 🟡 Afventer
  if (info?.hasNotes && info?.readBy) return 2  // 🟢 Læst
  return 3                                      // 🔴 Mangler
}

    const priorityDiff =
      getPriority(aInfo) - getPriority(bInfo)

    if (priorityDiff !== 0) return priorityDiff

    // Hvis samme status → sorter efter ældste først
    const aDate = aInfo?.lastDate
      ? new Date(aInfo.lastDate).getTime()
      : 0
    const bDate = bInfo?.lastDate
      ? new Date(bInfo.lastDate).getTime()
      : 0

    return aDate - bDate
  })
  .map((item) => {
              const info = status[item]

          const hasNotes = info?.hasNotes
          const isRead = hasNotes && !!info.readBy
          const isUnread = hasNotes && !info.readBy

          return (
            <Link
              key={item}
              href={`${basePath}/${encodeURIComponent(item)}`}
              className="block rounded-xl bg-white dark:bg-gray-800 shadow p-4 active:scale-[0.98] transition hover:shadow-lg"
            >
<div className="flex justify-between items-start">                <h2 className="text-lg font-semibold">
                  {item}
                </h2>

                {!hasNotes && (
                  <span className="text-red-600 text-sm font-semibold">
                    {t.missing}
                  </span>
                )}

                {isUnread && (
                  <span className="text-yellow-600 text-sm font-semibold">
                    {t.pending}
                  </span>
                )}

                {isRead && (
                  <span className="text-green-600 text-sm font-semibold">
                    {t.read}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-2">
                {info?.lastDate ? (
                  <>
                    {t.last}: {formatDate(info.lastDate, lang)}

                    {isUnread && info.receiverName && (
                      <>
                        {' · '}
                        <span className="font-semibold text-yellow-500">
                          {info.receiverName}
                        </span>
                      </>
                    )}

                    {isRead && info.readBy && (
                      <>
                        {' · '}
                        <span className="font-semibold text-green-600">
                          {info.readBy}
                        </span>
                      </>
                    )}

                    {info?.hasComments && (
                      <>
                        {' '}
                        <span className="text-gray-400">
                          💬
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  t.noHandover
                )}
              </p>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
