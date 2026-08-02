import { NextRequest, NextResponse } from 'next/server'
import { parseAccessShip, requestHasShipAccess } from '@/lib/apiAccess'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg'])

function safeSegment(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const ship = parseAccessShip(typeof form?.get('ship') === 'string' ? String(form.get('ship')) : null)
  const parti = typeof form?.get('parti') === 'string' ? safeSegment(String(form.get('parti'))) : ''
  const file = form?.get('file')

  if (
    !ship ||
    !parti ||
    !(file instanceof File) ||
    !ALLOWED_TYPES.has(file.type) ||
    file.size <= 0 ||
    file.size > MAX_BYTES ||
    !(await requestHasShipAccess(request, ship))
  ) {
    return NextResponse.json({ error: 'Ugyldigt billede eller ingen adgang.' }, { status: 400 })
  }

  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${ship}/${parti}/${crypto.randomUUID()}.${extension}`
  const { error } = await getSupabaseAdmin()
    .storage
    .from('handover-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ url: `/api/handover-images/${path}?ship=${ship}` })
}
