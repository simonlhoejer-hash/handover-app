'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/LanguageContext'

const outlets = [
  {
    name: 'Skagerrak',
    slug: 'skagerrak',
  },
  {
    name: 'Nord Banquet',
    slug: 'nord-banquet',
  },
  {
    name: 'Kull',
    slug: 'kull',
  },
  {
    name: 'Syd',
    slug: 'syd',
  },
  {
    name: 'Kværn',
    slug: 'kvaern',
  },
  {
    name: 'Grundkalkulationer',
    slug: 'grundkalkulationer',
  },
]

export default function AdminPage() {
  const { t } = useTranslation()

  return (
    <main className="max-w-5xl mx-auto px-4 pb-24">
   

      <div className="text-center mb-8 pt-8 sm:pt-12">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#347f7a] dark:text-[#8dc4bf]">
          Go Nordic Cruiseline
        </p>
        <h1 className="font-nordic-display text-4xl sm:text-5xl text-[#102f2e] dark:text-white">
          {t.administration}
        </h1>

        <p className="text-gray-500 mt-2">
          {t.chooseOutlet}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {outlets.map((outlet) => (
          <Link
            key={outlet.slug}
            href={`/admin/${outlet.slug}`}
            className="
              group
              rounded-xl
              nordic-card
              p-7
              hover:shadow-lg
              hover:-translate-y-0.5
              hover:border-[#347f7a]/40
              transition-all duration-300
              dark:bg-white/5
              dark:border-white/10
            "
          >
            <h2
              className="
                text-2xl
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              {outlet.name}
            </h2>

            <p
              className="
                mt-3
                text-sm
                text-gray-500
                dark:text-white/60
              "
            >
              {t.calculations}
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}


