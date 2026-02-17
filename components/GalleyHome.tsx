'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/LanguageContext'

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

const PARTIER = [
  'NORD',
  'SYD',
  'KULL varmt',
  'KULL koldt',
  'Konditor',
  'Besætning',
  'Opsætter',
  'Skagerak',
  'Stilling 2',
  'Stilling 1',
  'Slagter',
]


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

export default function Page() {
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

      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    const result: StatusMap = {}

for (const parti of PARTIER) {
  const latest = data?.find(d => d.parti === parti) as any

  let isExpired = false

  if (latest?.created_at) {
    const daysOld = Math.floor(
      (Date.now() - new Date(latest.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    )

if (daysOld >= 14) {
  isExpired = true
}

  }

result[parti] = {
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
}, [])




  if (loading) {
    return <p className="p-6">{t.loading}</p>
  }

  return (
    <main className="px-4 py-6 max-w-5xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTIER.map((parti) => {
          const info = status[parti]

          const hasNotes = info?.hasNotes
          const isRead = hasNotes && !!info.readBy
          const isUnread = hasNotes && !info.readBy

return (
  <Link
    key={parti}
    href={`/parti/${encodeURIComponent(parti)}`}
    className="block rounded-xl bg-white dark:bg-gray-800 shadow p-4 active:scale-[0.98] transition hover:shadow-lg"
  >
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold">
        {parti}
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
