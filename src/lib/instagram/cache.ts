/**
 * Thin wrapper around Next.js Data Cache.
 * Uses fetch() with { next: { revalidate, tags } } so Next.js can cache and
 * revalidate responses on demand.
 */
export async function instagramFetch<T>(
  url: string,
  options?: { revalidate?: number; tags?: string[] }
): Promise<T> {
  const res = await fetch(url, {
    next: {
      revalidate: options?.revalidate,
      tags: options?.tags,
    },
  })

  if (!res.ok) {
    throw new Error(
      `Instagram API error: ${res.status} ${res.statusText} — ${url}`
    )
  }

  return res.json() as Promise<T>
}
