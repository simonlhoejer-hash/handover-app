import { supabase } from '@/lib/supabase'

export default async function Page() {
  const { data } = await supabase
    .from('ideas')
    .select('*')
    .eq('department', 'galley')
    .order('created_at', { ascending: false })

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Idé parkering
      </h1>

      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  )
}