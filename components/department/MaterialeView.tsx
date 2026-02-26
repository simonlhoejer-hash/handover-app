'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

type Props = {
  department: string
  parti: string
}

type Material = {
  id: string
  type: 'ret' | 'menukort' | 'opskrift'
  title: string
  file_url?: string
  image_url?: string
}

export default function MaterialeView({ department, parti }: Props) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchMaterials = async () => {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .eq('department', department)
        .eq('parti', parti)
        .order('created_at', { ascending: false })

      setMaterials(data || [])
      setLoading(false)
    }

    fetchMaterials()
  }, [department, parti])

  if (loading) {
    return <p className="text-center opacity-60">Loader...</p>
  }

  const menukort = materials.filter(m => m.type === 'menukort')
  const billeder = materials.filter(m => m.type === 'ret')
  const opskrifter = materials.filter(m => m.type === 'opskrift')

return (
  <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-8">

    <header className="text-center space-y-2 mb-8">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {parti}
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Materialer for {parti}
      </p>
    </header>

    {/* MENUKORT */}
    {menukort.length > 0 && (
      <section className="space-y-4">

        <div className="
          text-xs
          uppercase
          tracking-wider
          text-gray-500 dark:text-gray-400
        ">
          Menukort
        </div>

        <div className="space-y-4">
          {menukort.map(menu => (
            <a
              key={menu.id}
              href={menu.file_url ? encodeURI(menu.file_url) : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="
                block
                rounded-xl
                p-5
                bg-white dark:bg-gray-900
                shadow
                transition
                hover:opacity-90
              "
            >
              <p className="font-medium">{menu.title}</p>
              <p className="text-sm opacity-60 mt-1">
                Klik for at åbne
              </p>
            </a>
          ))}
        </div>

      </section>
    )}

    {/* GALLERI */}
    {billeder.length > 0 && (
      <section className="space-y-4">

        <div className="
          text-xs
          uppercase
          tracking-wider
          text-gray-500 dark:text-gray-400
        ">
          Galleri
        </div>

        <div className="grid grid-cols-2 gap-4">
          {billeder.map(img => (
            <div key={img.id} className="space-y-2">
              {img.image_url && (
                <div
                  onClick={() => setActiveImage(encodeURI(img.image_url!))}
                  className="
                    cursor-pointer
                    overflow-hidden
                    rounded-xl
                    shadow
                  "
                >
                  <img
                    src={encodeURI(img.image_url)}
                    alt={img.title}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
              <p className="text-sm font-medium">
                {img.title}
              </p>
            </div>
          ))}
        </div>

      </section>
    )}

    {/* OPSKRIFTER */}
    {opskrifter.length > 0 && (
      <section className="space-y-4">

        <div className="
          text-xs
          uppercase
          tracking-wider
          text-gray-500 dark:text-gray-400
        ">
          Opskrifter
        </div>

        <div className="space-y-4">
          {opskrifter.map(op => (
            <a
              key={op.id}
              href={op.file_url ? encodeURI(op.file_url) : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="
                block
                rounded-xl
                p-4
                bg-white dark:bg-gray-900
                shadow
                hover:opacity-90
                transition
              "
            >
              {op.title}
            </a>
          ))}
        </div>

      </section>
    )}

    {/* IMAGE MODAL */}
    {activeImage && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <button
          onClick={() => setActiveImage(null)}
          className="absolute top-6 right-6 text-white"
        >
          <X size={28} />
        </button>

        <img
          src={activeImage}
          className="max-h-[85vh] max-w-[95vw] rounded-xl shadow-2xl"
        />
      </div>
    )}

  </main>
)
}