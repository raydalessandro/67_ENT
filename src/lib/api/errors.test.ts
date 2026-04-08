import { describe, it, expect } from 'vitest'
import { createError, mapSupabaseError, query, queryAsync } from './errors'

// ── createError ──

describe('createError', () => {
  it('returns an AppError with the given code and message', () => {
    const err = createError('NOT_FOUND', 'resource missing')
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('resource missing')
  })

  it('uses provided userMessage when given', () => {
    const err = createError('UNKNOWN', 'internal', 'Custom user msg')
    expect(err.userMessage).toBe('Custom user msg')
  })

  it('derives userMessage from static map when omitted', () => {
    expect(createError('NETWORK_ERROR', '').userMessage).toBe('Errore di connessione. Riprova.')
    expect(createError('UNAUTHORIZED', '').userMessage).toBe('Accesso non autorizzato.')
    expect(createError('PERMISSION_DENIED', '').userMessage).toBe('Non hai i permessi per questa operazione.')
    expect(createError('NOT_FOUND', '').userMessage).toBe('Elemento non trovato.')
    expect(createError('INVALID_INPUT', '').userMessage).toBe('Dati non validi.')
    expect(createError('CONSTRAINT_VIOLATION', '').userMessage).toBe('Operazione non consentita.')
    expect(createError('STORAGE_ERROR', '').userMessage).toBe('Errore nel caricamento del file.')
    expect(createError('RATE_LIMITED', '').userMessage).toBe('Limite raggiunto. Riprova più tardi.')
    expect(createError('AI_PROVIDER_ERROR', '').userMessage).toBe('Servizio AI non disponibile.')
    expect(createError('INSTAGRAM_API_ERROR', '').userMessage).toBe('Errore Instagram. Riprova.')
    expect(createError('UNKNOWN', '').userMessage).toBe('Si è verificato un errore.')
  })

  it('marks retryable codes as isRetryable=true', () => {
    expect(createError('NETWORK_ERROR', '').isRetryable).toBe(true)
    expect(createError('RATE_LIMITED', '').isRetryable).toBe(true)
    expect(createError('AI_PROVIDER_ERROR', '').isRetryable).toBe(true)
    expect(createError('INSTAGRAM_API_ERROR', '').isRetryable).toBe(true)
  })

  it('marks non-retryable codes as isRetryable=false', () => {
    expect(createError('UNAUTHORIZED', '').isRetryable).toBe(false)
    expect(createError('PERMISSION_DENIED', '').isRetryable).toBe(false)
    expect(createError('NOT_FOUND', '').isRetryable).toBe(false)
    expect(createError('INVALID_INPUT', '').isRetryable).toBe(false)
    expect(createError('CONSTRAINT_VIOLATION', '').isRetryable).toBe(false)
    expect(createError('STORAGE_ERROR', '').isRetryable).toBe(false)
    expect(createError('UNKNOWN', '').isRetryable).toBe(false)
  })
})

// ── mapSupabaseError ──

describe('mapSupabaseError', () => {
  it('maps code 42501 to PERMISSION_DENIED', () => {
    const err = mapSupabaseError({ code: '42501', message: 'permission denied' })
    expect(err.code).toBe('PERMISSION_DENIED')
  })

  it('maps code 23503 to CONSTRAINT_VIOLATION', () => {
    const err = mapSupabaseError({ code: '23503', message: '' })
    expect(err.code).toBe('CONSTRAINT_VIOLATION')
  })

  it('maps code 23505 to CONSTRAINT_VIOLATION', () => {
    const err = mapSupabaseError({ code: '23505', message: '' })
    expect(err.code).toBe('CONSTRAINT_VIOLATION')
  })

  it('maps code PGRST116 to NOT_FOUND', () => {
    const err = mapSupabaseError({ code: 'PGRST116', message: '' })
    expect(err.code).toBe('NOT_FOUND')
  })

  it('maps code 22P02 to INVALID_INPUT', () => {
    const err = mapSupabaseError({ code: '22P02', message: '' })
    expect(err.code).toBe('INVALID_INPUT')
  })

  it('maps code 23514 to INVALID_INPUT', () => {
    const err = mapSupabaseError({ code: '23514', message: '' })
    expect(err.code).toBe('INVALID_INPUT')
  })

  it('maps message containing JWT to UNAUTHORIZED', () => {
    const err = mapSupabaseError({ message: 'JWT expired' })
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('maps message containing not authenticated to UNAUTHORIZED', () => {
    const err = mapSupabaseError({ message: 'User is not authenticated' })
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('maps message containing fetch failed to NETWORK_ERROR', () => {
    const err = mapSupabaseError({ message: 'fetch failed' })
    expect(err.code).toBe('NETWORK_ERROR')
  })

  it('maps message containing NetworkError to NETWORK_ERROR', () => {
    const err = mapSupabaseError({ message: 'NetworkError when attempting fetch' })
    expect(err.code).toBe('NETWORK_ERROR')
  })

  it('falls back to UNKNOWN for unrecognized errors', () => {
    const err = mapSupabaseError({ code: '99999', message: 'something else' })
    expect(err.code).toBe('UNKNOWN')
  })

  it('never throws on null/undefined/string input', () => {
    expect(() => mapSupabaseError(null)).not.toThrow()
    expect(() => mapSupabaseError(undefined)).not.toThrow()
    expect(() => mapSupabaseError('some string error')).not.toThrow()
  })

  it('falls back to UNKNOWN for completely unexpected input', () => {
    expect(mapSupabaseError(42).code).toBe('UNKNOWN')
  })
})

// ── query ──

describe('query', () => {
  it('returns ok:true with data when promise resolves with data', async () => {
    const result = await query(Promise.resolve({ data: { id: 1 }, error: null }))
    expect(result).toEqual({ ok: true, data: { id: 1 } })
  })

  it('returns ok:false with NOT_FOUND when data is null and no error', async () => {
    const result = await query(Promise.resolve({ data: null, error: null }))
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: 'NOT_FOUND' }) })
  })

  it('returns ok:false mapped error when supabase error present', async () => {
    const result = await query(Promise.resolve({ data: null, error: { code: '42501', message: '' } }))
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: 'PERMISSION_DENIED' }) })
  })

  it('catches unexpected throws and returns ok:false', async () => {
    const result = await query(Promise.reject(new Error('boom')))
    expect(result.ok).toBe(false)
  })
})

// ── queryAsync ──

describe('queryAsync', () => {
  it('returns ok:true with data on success', async () => {
    const result = await queryAsync(() => Promise.resolve(42))
    expect(result).toEqual({ ok: true, data: 42 })
  })

  it('returns ok:false with mapped error on thrown error', async () => {
    const result = await queryAsync(() => Promise.reject({ code: 'PGRST116', message: '' }))
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: 'NOT_FOUND' }) })
  })

  it('returns ok:false for unexpected throws', async () => {
    const result = await queryAsync(() => { throw new Error('unexpected') })
    expect(result.ok).toBe(false)
  })
})
