import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { createServerClient as _createServerClient } from '@supabase/ssr'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServerClient(cookies: () => Promise<ReadonlyRequestCookies>) {
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          try {
            const cookieStore = await cookies()
            cookieStore.set(name, value, options)
          } catch {
            // set() can be called from a Server Component — ignore if not possible
          }
        },
        async remove(name: string, options: Record<string, unknown>) {
          try {
            const cookieStore = await cookies()
            cookieStore.set(name, '', options)
          } catch {
            // remove() can be called from a Server Component — ignore if not possible
          }
        },
      },
    }
  )
}
