import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  // STEP 1: Auth → 401
  const supabase = createServerClient(cookies)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // STEP 2: Parse body → { endpoint, keys: { p256dh, auth }, userAgent? }. → 400
  let body: { endpoint?: unknown; keys?: unknown; userAgent?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { endpoint, keys, userAgent } = body

  if (typeof endpoint !== 'string' || !endpoint) {
    return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
  }

  if (
    typeof keys !== 'object' ||
    keys === null ||
    typeof (keys as Record<string, unknown>).p256dh !== 'string' ||
    typeof (keys as Record<string, unknown>).auth !== 'string'
  ) {
    return NextResponse.json({ error: 'keys.p256dh and keys.auth are required strings' }, { status: 400 })
  }

  const { p256dh, auth } = keys as { p256dh: string; auth: string }

  // STEP 3: Upsert push_subscriptions (onConflict: endpoint)
  const { error: upsertError } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: authUser.id,
        endpoint,
        p256dh,
        auth,
        user_agent: typeof userAgent === 'string' ? userAgent : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

  if (upsertError) {
    console.error('[push/subscribe] upsert failed:', upsertError)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }

  // STEP 4: Return { ok: true } → 201
  return NextResponse.json({ ok: true }, { status: 201 })
}
