'use client'

import UploadMaterials from '@/components/admin/UploadMaterials'
import UploadToernplan from '@/components/admin/UploadToernplan'
import AdminStats from '@/components/statistics/AdminStats'

export default function Page() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">
          Admin værktøjer
        </h1>
        <p className="text-sm text-gray-500 dark:text-white/50">
          Upload filer, håndter tørnplan og se statistik
        </p>
      </div>

      {/* Upload materiale */}
      <section className="rounded-3xl bg-white dark:bg-[#162338] border border-black/5 dark:border-white/10 p-6 shadow-md">
        <h2 className="font-medium mb-4">
          Upload materiale
        </h2>
        <UploadMaterials />
      </section>

      {/* Tørnplan */}
      <section className="rounded-3xl bg-white dark:bg-[#162338] border border-black/5 dark:border-white/10 p-6 shadow-md">
        <h2 className="font-medium mb-4">
          Upload tørnplan
        </h2>
        <UploadToernplan />
      </section>

      {/* Statistik */}
      <section className="rounded-3xl bg-white dark:bg-[#162338] border border-black/5 dark:border-white/10 p-6 shadow-md">
        <h2 className="font-medium mb-4">
          Statistik
        </h2>
        <AdminStats />
      </section>

    </div>
  )
}