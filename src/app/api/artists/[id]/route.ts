import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyStaff() {
  const supabase = createServerClient(() => cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .schema('public')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) return null
  return user
}

// PATCH /api/artists/[id] — update artist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await verifyStaff()
  if (!staff) {
    return NextResponse.json({ error: 'Permesso negato' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const admin = getAdminClient()

  const { data, error } = await admin
    .from('artists')
    .update(body)
    .eq('id', id)
    .select('id, user_id, name, color, instagram_handle, tiktok_handle, youtube_handle, spotify_handle, is_active, deactivated_at, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ artist: data })
}

// POST /api/artists/[id]/reset-password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await verifyStaff()
  if (!staff) {
    return NextResponse.json({ error: 'Permesso negato' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { password } = body

  if (!password) {
    return NextResponse.json({ error: 'Password obbligatoria' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Get user_id from artist
  const { data: artist, error: fetchError } = await admin
    .from('artists')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError || !artist) {
    return NextResponse.json({ error: 'Artista non trovato' }, { status: 404 })
  }

  const { error } = await admin.auth.admin.updateUserById(artist.user_id, { password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
