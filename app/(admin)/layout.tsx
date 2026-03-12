'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [dark, setDark] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.classList.add("dark")
      setDark(true)
    }
  }, [])

  const toggleDark = () => {
    const html = document.documentElement

    if (dark) {
      html.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      html.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }

    setDark(!dark)
  }

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/")
  }

  return (
    <div
      className="
        min-h-screen
        bg-gray-100
        text-gray-900
        transition-colors duration-300
        dark:bg-[#0f1b2d]
        dark:text-white
      "
    >

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">

        {/* LOGO */}
        <h1 className="text-xl font-semibold">
          HandoverPro<span className="text-green-400">.</span>
        </h1>

        <div className="flex gap-3">

          {/* DARK MODE */}
          <button
            onClick={toggleDark}
            className="
              px-4 py-2
              rounded-xl
              bg-black
              text-white
              dark:bg-white
              dark:text-black
              text-sm
            "
          >
            {dark ? "Light" : "Dark"}
          </button>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm"
          >
            Log ud
          </button>

        </div>

      </header>

      {/* PAGE CONTENT */}
      <div className="px-6 py-8">
        {children}
      </div>

    </div>
  )
}