import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Ship } from 'lucide-react'

const ships = [
  {
    name: 'Nordic Crown',
    department: 'Galley',
    description: 'Overlevering og food waste for Nordic Crown.',
    href: '/galley',
  },
  {
    name: 'Pearl',
    department: 'Galley',
    description: 'Overlevering og food waste for Pearl.',
    href: '/pearl',
  },
]

export default function ShipsPage() {
  return (
    <main className="min-h-screen bg-[var(--nordic-bg)] px-5 py-10 dark:bg-[#082d2d] sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex justify-center">
          <Link href="/" aria-label="Tilbage til forsiden">
            <Image
              src="/go-nordic-logo.png"
              alt="Go Nordic Cruiseline"
              width={420}
              height={120}
              className="h-12 w-auto dark:hidden sm:h-14"
              priority
            />
            <Image
              src="/go-nordic-logo-dark.png"
              alt=""
              aria-hidden="true"
              width={420}
              height={120}
              className="hidden h-12 w-auto dark:block sm:h-14"
              priority
            />
          </Link>
        </div>

        <header className="mt-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#347f7a] dark:text-[#8dc4bf]">
            Handover
          </p>
          <h1 className="font-nordic-display mt-3 text-4xl text-[#102f2e] dark:text-white sm:text-5xl">
            Vælg dit skib
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-white/60">
            Vælg det skib, du arbejder på i dag.
          </p>
        </header>

        <div className="mt-9 grid gap-4">
          {ships.map((ship) => (
            <Link
              key={ship.href}
              href={ship.href}
              className="nordic-card group flex items-center gap-4 rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-[#347f7a]/40 sm:p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e7f1ef] text-[#064e4c] dark:bg-white/10 dark:text-white">
                <Ship size={22} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#347f7a] dark:text-[#8dc4bf]">
                  {ship.department}
                </span>
                <span className="mt-0.5 block text-xl font-semibold text-[#102f2e] dark:text-white">
                  {ship.name}
                </span>
                <span className="mt-1 block text-sm text-gray-500 dark:text-white/55">
                  {ship.description}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="shrink-0 text-[#347f7a] transition-transform group-hover:translate-x-1"
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
