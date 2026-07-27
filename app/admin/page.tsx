import Link from 'next/link'

const outlets = [
  {
    name: 'Skagerrak',
    slug: 'skagerrak',
  },
  {
    name: 'Nord Banquet',
    slug: 'nord-banquet',
  },
  {
    name: 'Kull',
    slug: 'kull',
  },
  {
    name: 'Syd',
    slug: 'syd',
  },
  {
    name: 'Kværn',
    slug: 'kvaern',
  },
  {
    name: 'Grundkalkulationer',
    slug: 'grundkalkulationer',
  },
]

export default function AdminPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 pb-24">
   

      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Administration
        </h1>

        <p className="text-gray-500 mt-2">
          Vælg outlet
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {outlets.map((outlet) => (
          <Link
            key={outlet.slug}
            href={`/admin/${outlet.slug}`}
            className="
              group
              rounded-3xl
              bg-white
              border border-black/5
              p-8
              shadow-sm
              hover:shadow-lg
              hover:-translate-y-1
              transition-all duration-300
              dark:bg-white/5
              dark:border-white/10
            "
          >
            <h2
              className="
                text-2xl
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              {outlet.name}
            </h2>

            <p
              className="
                mt-3
                text-sm
                text-gray-500
                dark:text-white/60
              "
            >
              kalkulationer
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}