import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { InstagramClient } from '@/lib/instagram/client'

const VALID_TYPES = ['account', 'media', 'insights'] as const
type InstagramQueryType = typeof VALID_TYPES[number]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  // STEP 1: Auth → createServerClient(cookies) → getUser(). → 401
  const supabase = createServerClient(cookies)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // STEP 2: Staff check → query users.role (use .schema('public')). → 403
  const { data: userRow, error: userError } = await supabase
    .schema('public')
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (userError || !userRow || userRow.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // STEP 3: Validate params → artistId + type query param ∈ ['account','media','insights']. → 400
  const { artistId } = await params
  if (!artistId) {
    return NextResponse.json({ error: 'artistId is required' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const typeParam = searchParams.get('type')

  if (!typeParam || !VALID_TYPES.includes(typeParam as InstagramQueryType)) {
    return NextResponse.json(
      { error: `type query param must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const type = typeParam as InstagramQueryType

  // STEP 4: Fetch artist with token (server-only: instagram_token, instagram_token_expires_at). → 404/400
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, instagram_token, instagram_token_expires_at')
    .eq('id', artistId)
    .single()

  if (artistError || !artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  }

  if (!artist.instagram_token) {
    return NextResponse.json({ error: 'Artist has no Instagram token configured' }, { status: 400 })
  }

  // STEP 5: new InstagramClient(token, artistId) → call method based on type. → 502 on fail
  const client = new InstagramClient(artist.instagram_token, artistId)

  let data: unknown
  try {
    if (type === 'account') {
      data = await client.getAccount()
    } else if (type === 'media') {
      data = await client.getMedia()
    } else {
      data = await client.getInsights()
    }
  } catch (err) {
    console.error(`[instagram/${artistId}] ${type} fetch failed:`, err)
    return NextResponse.json({ error: 'Instagram API error' }, { status: 502 })
  }

  // STEP 6: Return JSON data
  return NextResponse.json({ data })
}
