// ============================================================================
// Error Handling
// ============================================================================

export type ErrorCode =
  // Auth
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  // Data
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  // Post workflow
  | 'INVALID_STATUS_TRANSITION'
  | 'POST_LOCKED'
  | 'REJECTION_REASON_REQUIRED'
  // AI
  | 'AI_RATE_LIMITED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'AI_AGENT_DISABLED'
  | 'AI_MESSAGE_TOO_LONG'
  // Upload
  | 'FILE_TOO_LARGE'
  | 'FILE_TYPE_INVALID'
  | 'UPLOAD_FAILED'
  // Network
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  // Generic
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode?: number,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  get userMessage(): string {
    return ERROR_MESSAGES[this.code] ?? ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  get isRetryable(): boolean {
    return RETRYABLE_ERRORS.has(this.code);
  }

  get isAuthError(): boolean {
    return this.code.startsWith('AUTH_');
  }
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS: 'Email o password non corretti.',
  AUTH_SESSION_EXPIRED: 'Sessione scaduta. Effettua di nuovo il login.',
  AUTH_UNAUTHORIZED: 'Devi effettuare il login.',
  AUTH_FORBIDDEN: 'Non hai i permessi per questa azione.',
  NOT_FOUND: 'Elemento non trovato.',
  VALIDATION_ERROR: 'Controlla i dati inseriti.',
  CONFLICT: 'Conflitto con i dati esistenti.',
  INVALID_STATUS_TRANSITION: 'Transizione di stato non valida.',
  POST_LOCKED: 'Questo post non può essere modificato.',
  REJECTION_REASON_REQUIRED: 'Il motivo del rifiuto è obbligatorio.',
  AI_RATE_LIMITED: 'Hai raggiunto il limite giornaliero di messaggi.',
  AI_SERVICE_UNAVAILABLE: 'Il servizio AI non è disponibile al momento. Riprova tra poco.',
  AI_AGENT_DISABLED: "L'assistente AI non è ancora attivo per te.",
  AI_MESSAGE_TOO_LONG: 'Il messaggio è troppo lungo (max 2000 caratteri).',
  FILE_TOO_LARGE: 'Il file è troppo grande (max 50MB).',
  FILE_TYPE_INVALID: 'Tipo di file non supportato.',
  UPLOAD_FAILED: 'Caricamento fallito. Riprova.',
  NETWORK_ERROR: 'Errore di connessione. Controlla la tua rete.',
  TIMEOUT: 'La richiesta ha impiegato troppo tempo. Riprova.',
  INTERNAL_ERROR: 'Errore interno. Riprova o contatta il supporto.',
  UNKNOWN_ERROR: 'Si è verificato un errore imprevisto.',
};

const RETRYABLE_ERRORS = new Set<ErrorCode>([
  'NETWORK_ERROR',
  'TIMEOUT',
  'AI_SERVICE_UNAVAILABLE',
  'UPLOAD_FAILED',
  'INTERNAL_ERROR',
]);

// Map Supabase errors to AppError
export function mapSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const err = error as Record<string, unknown> | null;
  const message = String(err?.message ?? err?.msg ?? 'Unknown error');
  const code = String(err?.code ?? '');
  const status = Number(err?.status ?? err?.statusCode ?? 0);

  // Auth
  if (message.includes('Invalid login credentials')) {
    return new AppError('AUTH_INVALID_CREDENTIALS', message, 401);
  }
  if (status === 401 || code === 'PGRST301') {
    return new AppError('AUTH_SESSION_EXPIRED', message, 401);
  }
  if (status === 403) {
    return new AppError('AUTH_FORBIDDEN', message, 403);
  }

  // Not found
  if (status === 404 || code === 'PGRST116') {
    return new AppError('NOT_FOUND', message, 404);
  }

  // Conflict
  if (status === 409 || code === '23505') {
    return new AppError('CONFLICT', message, 409);
  }

  // Business logic (from PG raise_exception)
  if (message.includes('Invalid status transition')) {
    return new AppError('INVALID_STATUS_TRANSITION', message, 400);
  }
  if (message.includes('Cannot edit')) {
    return new AppError('POST_LOCKED', message, 400);
  }
  if (message.includes('Rejection reason is required')) {
    return new AppError('REJECTION_REASON_REQUIRED', message, 400);
  }

  // Network
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('Failed to fetch') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return new AppError('NETWORK_ERROR', message);
  }

  // Timeout
  if (message.includes('timeout') || message.includes('Timeout')) {
    return new AppError('TIMEOUT', message);
  }

  // Fallback
  return new AppError('UNKNOWN_ERROR', message, status || undefined);
}
