'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import UploadMaterials from '@/components/admin/UploadMaterials'
import UploadToernplan from '@/components/admin/UploadToernplan'

export default function Page() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin-auth')
    if (savedAuth === 'true') {
      setAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    if (password === 'Handover') {
      setAuthenticated(true)
      localStorage.setItem('admin-auth', 'true')
    } else {
      alert('Forkert kode')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('admin-auth')
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <section className="w-full max-w-md rounded-3xl p-8 space-y-6 bg-white border border-black/5 shadow-xl dark:bg-[#162338] dark:border-white/10">
          <h1 className="text-2xl font-semibold text-center">
            Admin Login
          </h1>

          <input
            type="password"
            placeholder="Indtast kode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogin()
            }}
            className="w-full rounded-2xl px-4 py-3 bg-gray-100 dark:bg-[#1d2e46]"
          />

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black"
          >
            Log ind
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 pt-10 pb-24 space-y-10">

      <section className="rounded-3xl p-6 flex justify-between items-center bg-white border border-black/5 shadow-md dark:bg-[#162338] dark:border-white/10">
        <h1 className="text-xl font-semibold">
          HandoverPro Admin
        </h1>

        <button
          onClick={handleLogout}
          className="px-5 py-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black"
        >
          Log ud
        </button>
      </section>

      {/* Navigation */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Link
          href="/galley"
          className="rounded-3xl p-6 bg-white border border-black/5 shadow-md dark:bg-[#162338] dark:border-white/10 text-center font-medium hover:scale-[1.02] transition"
        >
          Gå til Galley
        </Link>

        <Link
          href="/shop"
          className="rounded-3xl p-6 bg-white border border-black/5 shadow-md dark:bg-[#162338] dark:border-white/10 text-center font-medium hover:scale-[1.02] transition"
        >
          Gå til Shop
        </Link>

      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <UploadMaterials />

        <UploadToernplan />

      </div>

    </main>
  )
}