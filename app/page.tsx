"use client"

import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/LanguageContext"
import Image from "next/image"
import { ArrowRight, Anchor } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const { t } = useTranslation()

  function handleLogin() {
    localStorage.setItem("crew-auth", "true")
    router.push("/ships")
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.15fr_.85fr] overflow-hidden bg-white dark:bg-[#082d2d]">
      <section className="nordic-wave relative min-h-[42vh] lg:min-h-screen bg-[#347f7a] px-7 py-10 sm:px-12 lg:px-20 lg:py-16 text-white flex flex-col justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/go-nordic-logo-dark.png"
            alt="Go Nordic Cruiseline"
            width={420}
            height={120}
            className="h-12 sm:h-16 w-auto object-contain object-left"
            priority
          />
          <span className="h-9 w-px bg-white/30" aria-hidden="true" />
          <span className="leading-none">
            <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
              Powered by
            </span>
            <span className="mt-1 block text-base font-bold tracking-tight text-white">
              Handover<span className="text-white/65">Pro</span>
            </span>
          </span>
        </div>
        <div className="relative z-10 max-w-2xl py-14 lg:py-0">
          <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            <Anchor size={17} />
            Crew platform
          </div>
          <h1 className="font-nordic-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95]">
            Klar til næste vagt.
          </h1>
          <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-white/80">
            Én samlet arbejdsflade til overlevering, drift og opfølgning om bord.
          </p>
        </div>
        <p className="relative z-10 hidden lg:block text-xs uppercase tracking-[0.18em] text-white/55">
          København · Oslo
        </p>
      </section>

      <section className="flex items-center px-7 py-12 sm:px-14 lg:px-20">
        <div className="w-full max-w-md mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#347f7a]">Handover</p>
          <h2 className="font-nordic-display mt-3 text-4xl text-[#102f2e] dark:text-white">
            Velkommen om bord
          </h2>
          <p className="mt-4 text-gray-500 dark:text-white/60">
            {t.loginTagline}
          </p>
          <button
            onClick={handleLogin}
            className="group mt-9 w-full flex items-center justify-between rounded-xl bg-[#064e4c] px-6 py-4 text-left font-semibold text-white shadow-[0_12px_28px_rgba(6,78,76,.22)] transition hover:bg-[#073f3d] active:scale-[.99]"
          >
            <span>{t.login}</span>
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
          <p className="mt-5 text-center text-xs text-gray-400 dark:text-white/35">
            HandoverPro platform · for Go Nordic Cruiseline crew
          </p>
        </div>
      </section>
    </main>
  )
}
