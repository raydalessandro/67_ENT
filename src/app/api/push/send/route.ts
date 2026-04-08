import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Set VAPID details at module level if keys exist
let webpush: typeof import('web-push') | null = null
try {
  webpush = require('web-push')

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (vapidPublicKey && vapidPrivateKey && vapidSubject && webpush) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  }
} catch {
  // web-push not available in this environment
  console.warn('[push/send] web-push module not available')
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // STEP 1: Validate Authorization: Bearer PUSH_INTERNAL_SECRET. → 401
  const authHeader = req.headers.get('authorization') ?? ''
  const internalSecret = process.env.PUSH_INTERNAL_SECRET

  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // STEP 2: Parse body → { user_id, title, body, data? }. → 400
  let reqBody: { user_id?: unknown; title?: unknown; body?: unknown; data?: unknown }
  try {
    reqBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_id, title, body: notifBody, data } = reqBody

  if (typeof user_id !== 'string' || !user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }
  if (typeof title !== 'string' || !title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (typeof notifBody !== 'string' || !notifBody) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  if (!webpush) {
    return NextResponse.json({ error: 'Push notifications not available' }, { status: 503 })
  }

  // STEP 3: Fetch push_subscriptions for user_id (use service role or admin query)
  const adminClient = getAdminClient()
  const { data: subscriptions, error: fetchError } = await adminClient
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', user_id)

  if (fetchError) {
    console.error('[push/send] failed to fetch subscriptions:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 })
  }

  // STEP 4: webpush.sendNotification per device via Promise.allSettled
  //         Delete stale subscriptions (410 Gone)
  const payload = JSON.stringify({ title, body: notifBody, data: data ?? null })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      await webpush!.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      )
      return sub.id
    })
  )

  let sent = 0
  let failed = 0
  const staleIds: string[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled') {
      sent++
    } else {
      failed++
      const err = result.reason
      // Delete stale subscriptions (410 Gone)
      if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 410) {
        staleIds.push(subscriptions[i].id)
      }
    }
  }

  if (staleIds.length > 0) {
    try {
      await adminClient
        .from('push_subscriptions')
        .delete()
        .in('id', staleIds)
    } catch (err) {
      console.error('[push/send] failed to delete stale subscriptions:', err)
    }
  }

  // STEP 5: Return { sent, failed }
  return NextResponse.json({ sent, failed })
}
