# 67 Hub — Documentazione Tecnica per AI

Questo documento serve come riferimento rapido per qualsiasi AI (Claude, GPT, ecc.) che debba intervenire sul codice di 67 Hub.

---

## Architettura

L'app è divisa in due parti completamente separate:

### Frontend (Vercel)
- **React 18 + TypeScript 5 + Vite 7**
- Single Page App con `react-router-dom` v7
- State management: **Zustand** (3 store: auth, ui, featureFlags)
- Form: **React Hook Form + Zod** (validazione con messaggi in italiano)
- Styling: **Tailwind CSS 4** (no config file, usa `@tailwindcss/vite` plugin)
- Tutte le pagine pesanti sono **lazy loaded** (`React.lazy()`)
- Bundle splitting con `manualChunks` in `vite.config.ts`

### Backend (Supabase)
- **Auth**: email/password, no signup pubblico, session con JWT
- **Database**: PostgreSQL con RLS su ogni tabella
- **Storage**: 2 bucket pubblici (`post-media`, `guideline-attachments`)
- **Edge Functions**: 2 Deno functions (`ai-chat`, `admin-artists`)
- **Non c'è un server Node/Express** — tutto passa per Supabase client + Edge Functions

---

## Pattern Fondamentali

### API Layer (`src/lib/api.ts`)
- **Mai throw** — ogni funzione ritorna `ApiResult<T>` che è `{ ok: true, data: T } | { ok: false, error: AppError }`
- Il wrapper `query<T>()` accetta un Supabase query builder (`PromiseLike`) e cattura errori
- Per query async (es. count, storage) si usa `queryAsync<T>()`
- Tutti gli errori Supabase vengono mappati in `AppError` con codice tipizzato via `mapSupabaseError()`

### Errori (`src/lib/errors.ts`)
- `AppError` ha: `code` (ErrorCode union type), `message` (tecnico), `userMessage` (getter, italiano), `isRetryable` (getter)
- `ErrorCode` è un union type con ~20 codici — aggiungere nuovi codici qui e in `ERROR_MESSAGES`
- `mapSupabaseError()` gestisce errori Postgres (PGRST), RLS (42501), constraint violations, network

### Auth Flow
1. `useAuth()` hook chiama `supabase.auth.getSession()` all'init
2. `onAuthStateChange` ascolta login/logout
3. Al login carica profilo da tabella `users` + eventuale profilo `artists`
4. `useAuthStore` espone: `user`, `artist`, `isStaff` (computed da role)
5. `ProtectedRoute` redirige a `/login` se non autenticato
6. `StaffRoute` redirige a `/` se non admin/manager

### Post Workflow (stato macchina)
```
draft → in_review → approved → published
                  → rejected → draft (può essere re-inviato)
```
- Le transizioni sono enforce a livello DB (trigger PostgreSQL)
- Il frontend chiama `api.posts.sendForReview()`, `.approve()`, `.reject()`, `.markPublished()`
- Ogni transizione crea una riga in `post_history`

### Edge Functions
- Entrambe verificano il JWT del chiamante e controllano il ruolo in `users`
- `ai-chat`: verifica rate limit giornaliero, carica storico sessione, chiama DeepSeek, salva messaggi
- `admin-artists`: CRUD artisti con creazione auth user via `admin.auth.admin.createUser()`
- Se un'Edge Function non funziona, il codice frontend è in `supabase/functions/*/index.ts`
- Le Edge Function girano su Deno (non Node) — import da URL, no npm

---

## File Chiave per Tipo di Modifica

### "Devo aggiungere una nuova pagina"
1. Crea `src/pages/NuovaPagina.tsx`
2. Aggiungi rotta in `src/config/routes.ts` (ROUTES + routes builder)
3. Aggiungi lazy import + Route in `src/App.tsx`
4. Se staff-only: metti dentro `<StaffRoute>`

### "Devo aggiungere un nuovo campo al database"
1. Crea nuovo file `.sql` in `supabase/migrations/`
2. Aggiorna tipo in `src/types/models.ts`
3. Aggiorna query in `src/lib/api.ts`
4. Se serve validazione form: aggiorna schema in `src/lib/validation.ts`

### "Devo aggiungere un nuovo tipo di errore"
1. Aggiungi codice a `ErrorCode` in `src/lib/errors.ts`
2. Aggiungi messaggio italiano in `ERROR_MESSAGES`
3. Se retryable: aggiungi a `RETRYABLE_ERRORS`

### "Devo modificare l'AI Chat"
- System prompt default: in `supabase/functions/ai-chat/index.ts` → `buildSystemPrompt()`
- System prompt per artista: tabella `ai_agent_configs` → campo `system_prompt`
- Rate limit: `ai_agent_configs.daily_message_limit`
- Modello: `ai_agent_configs.model_name` (default `deepseek-chat`)
- Frontend chat: `src/pages/AIChatPage.tsx`

### "Devo modificare la gestione artisti"
- Edge Function: `supabase/functions/admin-artists/index.ts`
- Frontend admin: `src/pages/AdminPage.tsx`
- API client: `src/lib/adminApi.ts`

---

## Database — Tabelle Principali

| Tabella | Scopo | RLS |
|---------|-------|-----|
| `users` | Profili utente (id = auth.uid) | Lettura: tutti; Scrittura: solo il proprio |
| `artists` | Profili artista (1:1 con user) | Lettura: tutti; Scrittura: staff |
| `posts` | Post social con stato workflow | Artista vede i propri; Staff vede tutti |
| `post_media` | Media allegati ai post | Segue RLS del post |
| `post_comments` | Commenti sui post | Segue RLS del post |
| `post_history` | Log transizioni di stato | Sola lettura |
| `guideline_sections` | Sezioni toolkit | Lettura: tutti |
| `guideline_items` | Contenuti toolkit | Lettura: tutti; Scrittura: staff |
| `ai_agent_configs` | Config AI per artista | Staff only |
| `ai_chat_sessions` | Sessioni chat giornaliere | Artista vede le proprie |
| `ai_chat_messages` | Messaggi chat | Artista vede i propri |
| `ai_daily_usage` | Contatore giornaliero messaggi | Service role only |
| `notifications` | Notifiche push (non ancora implementate UI) | Artista vede le proprie |

---

## Convenzioni

- **Lingua UI**: Italiano (messaggi errore, label, placeholder)
- **Lingua codice**: Inglese (variabili, funzioni, commenti)
- **CSS**: Tailwind utility classes, no CSS modules, no styled-components
- **Componenti**: Functional components con hooks, no class components
- **Import**: Path alias `@/` = `./src/`
- **Test ID**: `data-testid` su elementi interattivi chiave
- **Toast**: `sonner` con `toast.success()` / `toast.error()`
- **Icone**: `lucide-react`
- **Date**: `Intl.DateTimeFormat` con locale `it-IT`, no moment/dayjs

---

## Problemi Comuni

### "Build fallisce con TS6133 (unused variable)"
`tsconfig.app.json` ha `noUnusedLocals: true`. Rimuovi la variabile o usa `_` prefix.

### "Supabase ritorna errore 42501"
RLS policy mancante o errata. Controlla che la policy esista per il ruolo dell'utente.

### "Edge Function ritorna CORS error"
Le Edge Function devono gestire `OPTIONS` preflight e ritornare `corsHeaders`. Verifica che il handler OPTIONS sia il primo check.

### "L'artista non vede l'AI Chat"
1. Verifica `ai_agent_configs` abbia una riga per quell'artista con `is_enabled = true`
2. Verifica `VITE_FEATURE_AI_CHAT=true` nelle env vars
3. Verifica che l'Edge Function `ai-chat` sia deployata e attiva

### "Login funziona ma il profilo non si carica"
La tabella `users` deve avere una riga con `id` = UUID dell'auth user. Se manca, `useAuth` setta `user = null`.

### "Media upload fallisce su iOS"
Controllare che il bucket storage sia pubblico e che le CORS policy di Supabase includano il dominio Vercel.

---

## Prossimi Sviluppi Previsti

L'architettura è modulare. Per aggiungere un nuovo modulo:

1. Tabella config con `is_enabled` per artista
2. Toggle nella pagina Admin (stesso pattern di `ai_enabled`)
3. Feature flag in `src/stores/featureFlags.ts`
4. Condizione nella navigazione (HomePage + BottomNav)
5. Nuova pagina lazy loaded

Moduli pianificati: analytics per artista, notifiche push, calendario condiviso, libreria media.
