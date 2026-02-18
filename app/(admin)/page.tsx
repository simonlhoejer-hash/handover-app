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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Admin Login</h1>

        <input
          type="password"
          placeholder="Indtast kode"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        />

        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-black text-white rounded-lg"
        >
          Log ind
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold">HandoverPro Admin</h1>

        <button
          onClick={() => setAuthenticated(false)}
          className="text-sm px-4 py-2 bg-black text-white rounded-lg"
        >
          Log ud
        </button>
      </header>

      {/* CONTENT */}
      <div className="flex flex-col items-center justify-center mt-24 gap-8">
        <h2 className="text-3xl font-bold">Dashboard</h2>

        <div className="flex gap-6">
          <Link
            href="/shop"
            className="px-8 py-4 bg-black text-white rounded-xl"
          >
            Gå til Shop
          </Link>

          <Link
            href="/galley"
            className="px-8 py-4 bg-gray-200 rounded-xl"
          >
            Gå til Galley
          </Link>
        </div>
      </div>
    </div>
  )
}
