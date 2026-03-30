"use client"

import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()

  function handleLogin() {
    localStorage.setItem("admin-auth", "true")
    router.push("/admin")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">

      <h1 className="text-4xl font-bold mb-4">
        Handover
      </h1>

      <p className="text-gray-600 max-w-md mb-8">
        Digital overlevering til køkken og ledelse.
      </p>

      <button
        onClick={handleLogin}
        className="bg-black text-white px-6 py-3 rounded-2xl"
      >
        Log ind
      </button>

    </main>
  )
}