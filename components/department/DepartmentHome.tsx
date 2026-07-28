'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  department: 'admin' |'shop' | 'galley'
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

type HandoverStatusRow = {
  parti: string
  shift_date?: string
  read_by?: string | null
  receiver_name?: string | null
  created_at?: string
  handover_comments?: { id: string }[]
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
    const fetchStatus = async () => {
      const { data } = await supabase
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

      const RESET_DAYS = 6
      const result: StatusMap = {}

      for (const item of items) {
        const rows = (data ?? []) as HandoverStatusRow[]
        const latest = rows.find((row) => row.parti === item)

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

    void fetchStatus()
  }, [department, items])

  return (
    <main className="px-4 pt-4 pb-8 max-w-5xl mx-auto">
      <header className="mb-6 flex flex-col items-center text-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t.handoverTitle}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
            {t.handoverSubtitle}
          </p>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

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

            return aDate - bDate
          })
          .map((item) => {

            const info = status[item]
            const hasNotes = info?.hasNotes

            return (
              <Link
                key={item}
                href={`${basePath}/${encodeURIComponent(item)}`}
                className="
                  rounded-xl
                  p-5
                  h-[110px]

                  flex items-center justify-center

                  bg-[#ffffff]
                  border border-gray-200/70

                  text-gray-900
                  shadow-sm

                  hover:shadow-md
                  hover:-translate-y-[1px]

                  transition-all duration-200

                  dark:bg-[#162338]
                  dark:border-white/10
                  dark:text-white
                "
              >

                <div className="flex flex-col items-center text-center space-y-2">

                  <h2 className="text-lg font-semibold tracking-tight">
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
