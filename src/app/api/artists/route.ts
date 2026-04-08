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

// POST /api/artists — create artist (auth user + public.users + artists + ai_config)
export async function POST(request: NextRequest) {
  // Verify caller is staff
  const supabase = createServerClient(() => cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .schema('public')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Permesso negato' }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password, color, instagram_handle, tiktok_handle, youtube_handle, spotify_handle, instagram_token } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Nome e email obbligatori' }, { status: 400 })
  }

  const admin = getAdminClient()
  const finalPassword = password || generatePassword()

  // 1. Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: finalPassword,
    email_confirm: true,
    user_metadata: { display_name: name },
  })

  if (authError) {
    return NextResponse.json(
      { error: `Errore creazione utente: ${authError.message}` },
      { status: 400 }
    )
  }

  const userId = authData.user.id

  // 2. Create public.users record
  const { error: userError } = await admin
    .from('users')
    .insert({
      id: userId,
      email,
      display_name: name,
      role: 'artist',
    })

  if (userError) {
    // Rollback: delete auth user
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Errore creazione profilo: ${userError.message}` },
      { status: 500 }
    )
  }

  // 3. Create artist record
  const { data: artist, error: artistError } = await admin
    .from('artists')
    .insert({
      user_id: userId,
      name,
      color: color || '#F5C518',
      instagram_handle: instagram_handle || null,
      tiktok_handle: tiktok_handle || null,
      youtube_handle: youtube_handle || null,
      spotify_handle: spotify_handle || null,
      instagram_token: instagram_token || null,
    })
    .select('id, user_id, name, color, instagram_handle, tiktok_handle, youtube_handle, spotify_handle, is_active, deactivated_at, created_at, updated_at')
    .single()

  if (artistError) {
    // Rollback: delete user record and auth user
    await admin.from('users').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Errore creazione artista: ${artistError.message}` },
      { status: 500 }
    )
  }

  // 4. ai_agent_configs is created automatically by trigger (auto_create_ai_config)

  return NextResponse.json({ artist, password: finalPassword }, { status: 201 })
}

function generatePassword(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase()
}
