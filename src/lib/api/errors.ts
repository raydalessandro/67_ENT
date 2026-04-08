import type { ApiResult, AppError, ErrorCode } from '@/types/api'

// ── Static maps ──

const USER_MESSAGES: Record<ErrorCode, string> = {
  NETWORK_ERROR: 'Errore di connessione. Riprova.',
  UNAUTHORIZED: 'Accesso non autorizzato.',
  PERMISSION_DENIED: 'Non hai i permessi per questa operazione.',
  NOT_FOUND: 'Elemento non trovato.',
  INVALID_INPUT: 'Dati non validi.',
  CONSTRAINT_VIOLATION: 'Operazione non consentita.',
  STORAGE_ERROR: 'Errore nel caricamento del file.',
  RATE_LIMITED: 'Limite raggiunto. Riprova più tardi.',
  AI_PROVIDER_ERROR: 'Servizio AI non disponibile.',
  INSTAGRAM_API_ERROR: 'Errore Instagram. Riprova.',
  UNKNOWN: 'Si è verificato un errore.',
}

const RETRYABLE_CODES = new Set<ErrorCode>([
  'NETWORK_ERROR',
  'RATE_LIMITED',
  'AI_PROVIDER_ERROR',
  'INSTAGRAM_API_ERROR',
])

// ── createError ──

export function createError(code: ErrorCode, message: string, userMessage?: string): AppError {
  return {
    code,
    message,
    userMessage: userMessage ?? USER_MESSAGES[code],
    isRetryable: RETRYABLE_CODES.has(code),
  }
}

// ── mapSupabaseError ──

export function mapSupabaseError(error: unknown): AppError {
  try {
    if (error !== null && typeof error === 'object') {
      const e = error as Record<string, unknown>
      const code = typeof e['code'] === 'string' ? e['code'] : undefined
      const message = typeof e['message'] === 'string' ? e['message'] : ''

      // Code-based mapping (higher priority)
      if (code === '42501') return createError('PERMISSION_DENIED', message)
      if (code === '23503' || code === '23505') return createError('CONSTRAINT_VIOLATION', message)
      if (code === 'PGRST116') return createError('NOT_FOUND', message)
      if (code === '22P02' || code === '23514') return createError('INVALID_INPUT', message)

      // Message-based mapping
      if (message.includes('JWT') || message.includes('not authenticated')) {
        return createError('UNAUTHORIZED', message)
      }
      if (message.includes('fetch failed') || message.includes('NetworkError')) {
        return createError('NETWORK_ERROR', message)
      }
    }

    if (typeof error === 'string') {
      if (error.includes('JWT') || error.includes('not authenticated')) {
        return createError('UNAUTHORIZED', error)
      }
      if (error.includes('fetch failed') || error.includes('NetworkError')) {
        return createError('NETWORK_ERROR', error)
      }
    }
  } catch {
    // Never throws
  }

  return createError('UNKNOWN', String(error))
}

// ── query ──

export async function query<T>(
  promise: PromiseLike<{ data: T | null; error: unknown }>
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await promise
    if (error) return { ok: false, error: mapSupabaseError(error) }
    if (data === null) return { ok: false, error: createError('NOT_FOUND', 'No data returned') }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: mapSupabaseError(err) }
  }
}

// ── queryAsync ──

export async function queryAsync<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: mapSupabaseError(err) }
  }
}
