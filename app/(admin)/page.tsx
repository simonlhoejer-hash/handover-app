'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Page() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  const handleLogin = () => {
    if (password === 'Handover') {
      setAuthenticated(true)
    } else {
      alert('Forkert kode')
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">

        <section
          className="
            w-full max-w-md
            rounded-3xl
            p-8
            space-y-6

            bg-white
            border border-black/5
            shadow-[0_25px_60px_rgba(0,0,0,0.08)]

            dark:bg-[#162338]
            dark:border-white/10
            dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)]
          "
        >
          <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
            Admin Login
          </h1>

          <input
            type="password"
            placeholder="Indtast kode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full
              rounded-2xl
              px-4 py-3
              transition

              bg-gray-100
              text-gray-900
              border border-black/5

              dark:bg-[#1d2e46]
              dark:text-white
              dark:border-white/10

              focus:outline-none
              focus:ring-2
              focus:ring-black/10
              dark:focus:ring-white/20
            "
          />

          <button
            onClick={handleLogin}
            className="
              w-full
              py-3
              rounded-2xl
              font-semibold
              transition-all duration-200
              active:scale-[0.98]

              bg-black
              text-white
              shadow-md

              dark:bg-white
              dark:text-black
              dark:shadow-lg

              hover:opacity-90
            "
          >
            Log ind
          </button>
        </section>

      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 pt-10 pb-24 space-y-10">

      {/* HEADER CARD */}
      <section
        className="
          rounded-3xl
          p-6
          flex justify-between items-center

          bg-white
          border border-black/5
          shadow-[0_15px_35px_rgba(0,0,0,0.06)]

          dark:bg-[#162338]
          dark:border-white/10
          dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
        "
      >
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          HandoverPro Admin
        </h1>

        <button
          onClick={() => setAuthenticated(false)}
          className="
            px-5 py-2
            rounded-2xl
            text-sm font-semibold
            transition-all duration-200
            active:scale-95

            bg-black
            text-white

            dark:bg-white
            dark:text-black

            hover:opacity-90
          "
        >
          Log ud
        </button>
      </section>

      {/* DASHBOARD CARD */}
      <section
        className="
          rounded-3xl
          p-10
          text-center
          space-y-8

          bg-white
          border border-black/5
          shadow-[0_25px_60px_rgba(0,0,0,0.08)]

          dark:bg-[#162338]
          dark:border-white/10
          dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)]
        "
      >
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">

          <Link
            href="/shop"
            className="
              px-8 py-4
              rounded-3xl
              font-semibold
              transition-all duration-200
              active:scale-95

              bg-black
              text-white
              shadow-md

              dark:bg-white
              dark:text-black
              dark:shadow-lg

              hover:opacity-90
            "
          >
            Gå til Shop
          </Link>

          <Link
            href="/galley"
            className="
              px-8 py-4
              rounded-3xl
              font-semibold
              transition-all duration-200
              active:scale-95

              bg-black/5
              text-gray-900
              border border-black/5

              dark:bg-white/10
              dark:text-white
              dark:border-white/10

              hover:opacity-90
            "
          >
            Gå til Galley
          </Link>

        </div>

      </section>

    </main>
  )
}