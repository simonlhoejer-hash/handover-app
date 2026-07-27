import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type Props = {
  params: Promise<{
    outlet: string
  }>
}

export default async function OutletAdminPage({ params }: Props) {
  const { outlet } = await params

  const outletName = outlet
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-8">

      <header className="relative flex items-center justify-center">

        <Link
          href="/admin"
          className="
            absolute left-0
            flex items-center justify-center
            w-10 h-10
            rounded-full
            bg-white
            border border-black/5
            shadow-sm
          "
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {outletName}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Administration
          </p>
        </div>

      </header>

    </main>
  )
}