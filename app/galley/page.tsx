import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Info } from 'lucide-react'

export default function GalleyMovedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--nordic-bg)] px-5 py-10 dark:bg-[#082d2d]">
      <section className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-7 text-center shadow-[0_24px_60px_rgba(6,78,76,.12)] dark:border-white/10 dark:bg-[#073f3d] sm:p-9">
        <div className="flex justify-center">
          <Image
            src="/go-nordic-logo.png"
            alt="Go Nordic Cruiseline"
            width={420}
            height={120}
            className="h-12 w-auto dark:hidden"
            priority
          />
          <Image
            src="/go-nordic-logo-dark.png"
            alt=""
            aria-hidden="true"
            width={420}
            height={120}
            className="hidden h-12 w-auto dark:block"
            priority
          />
        </div>

        <span className="mx-auto mt-9 flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f1ef] text-[#064e4c] dark:bg-white/10 dark:text-white">
          <Info size={22} />
        </span>
        <h1 className="font-nordic-display mt-5 text-4xl text-[#102f2e] dark:text-white">
          Nordic Crown har fået login
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-white/60">
          Galley hedder nu Nordic Crown i HandoverPro. Nordic Crown og Nordic
          Pearl har fået hver sin kabyskode, så adgangen via appen er begrænset
          til medarbejdere med koden.
        </p>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#064e4c] dark:text-[#8dc4bf]">
          Du kan få kabyskoden af din afdelingsleder.
        </p>

        <Link
          href="/crown"
          className="group mt-8 flex w-full items-center justify-between rounded-xl bg-[#064e4c] px-6 py-4 font-semibold text-white shadow-[0_12px_28px_rgba(6,78,76,.22)] transition hover:bg-[#073f3d] active:scale-[.99]"
        >
          <span>Åbn Nordic Crown-login</span>
          <ArrowRight
            size={20}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>

        <p className="mt-5 text-xs leading-relaxed text-gray-400 dark:text-white/35">
          Den gamle QR-kode kan stadig bruges til at komme hertil. Den nye
          Nordic Crown-QR går direkte til login.
        </p>
      </section>
    </main>
  )
}
