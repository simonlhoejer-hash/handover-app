import { supabase } from '@/lib/supabase'

export default async function Page() {
  const { data } = await supabase
    .from('ideas')
    .select('*')
    .eq('department', 'shop')
    .order('created_at', { ascending: false })

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Idé parkering
      </h1>

      {data?.length === 0 && (
        <p className="text-gray-500">
          Ingen idéer endnu
        </p>
      )}

      <div className="space-y-4">
        {data?.map((idea) => (
          <div
            key={idea.id}
            className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow"
          >
            <h2 className="font-semibold text-lg">
              {idea.title}
            </h2>

            {idea.description && (
              <p className="text-sm text-gray-500 mt-1">
                {idea.description}
              </p>
            )}

            <div className="mt-2 text-xs text-gray-400">
              Status: {idea.status}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}