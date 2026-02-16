# 67 Hub

Hub interno per **67 Entertainment** — gestione contenuti social, approvazioni artisti, materiali e assistente AI.

## Funzionalità

### 🏠 Homepage
Landing page con navigazione a tutte le sezioni. Gli artisti vedono Calendario, Materiali e AI Chat. Lo staff vede anche Gestione Artisti.

### 📅 Calendario
- Vista mensile con FullCalendar
- Post colorati per artista con indicatore stato
- Filtri per artista, piattaforma (Instagram Feed/Story/Reel, TikTok, YouTube, Spotify), stato
- Click sul post → dettaglio completo
- FAB "+" per creare post (solo staff)

### 📝 Post Workflow
- **Staff** crea post con titolo, caption, hashtag, media (immagini + video), data programmata
- **Staff** invia per approvazione → stato cambia a `in_review`
- **Artista** riceve notifica, apre il post, vede media e caption
- **Artista** approva o rifiuta (con motivo obbligatorio)
- **Staff** segna come pubblicato dopo la pubblicazione reale
- Commenti bidirezionali su ogni post
- Video: thumbnail generato client-side, compatibile iOS/Android

### 📚 Consigli & Materiali (Toolkit)
- Sezioni con icone dinamiche
- Items espandibili con contenuto Markdown
- Supporto allegati
- Priorità visuale (stelle colorate)
- Campagne con data di scadenza
- Read tracking automatico

### 🤖 Assistente AI
- Chat con contesto giornaliero (reset a mezzanotte)
- Rate limiting configurabile per artista (default 20 msg/giorno)
- System prompt personalizzabile per artista
- Attivabile/disattivabile per artista da admin
- Backend: Supabase Edge Function → DeepSeek API

### 👥 Gestione Artisti (Admin)
- Crea artista: account auth + profilo + config AI in un colpo
- Password auto-generabile
- Bottone **WhatsApp** con credenziali pronte da inviare
- Reset password, attiva/disattiva, toggle AI, elimina
- Signup pubblico disabilitato — solo staff crea account

### 🔒 Sicurezza
- RLS su tutte le tabelle — artisti vedono solo i propri dati
- Edge Functions verificano JWT + ruolo
- Nessuna API key esposta nel frontend

### 📱 Mobile
- PWA installabile
- Safe areas iOS, 100dvh fix, input zoom prevention
- Offline indicator, bottom navigation

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript 5, Vite 7, Tailwind 4 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Calendar | FullCalendar |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | DeepSeek API |
| Deploy | Vercel + Supabase |

## Setup Produzione

### 1. Supabase

Crea progetto su [supabase.com](https://supabase.com).

**SQL Editor** — esegui in ordine:
```
supabase/migrations/001_base.sql
supabase/migrations/002_ai_chat.sql
supabase/migrations/003_addendum.sql
supabase/migrations/004_rpc_patch.sql
```

**Storage** — crea 2 bucket public:
- `post-media`
- `guideline-attachments`

**Authentication → Settings** → Disabilita "Enable sign up"

**Edge Functions** — crea 2 funzioni:
1. `ai-chat` → `supabase/functions/ai-chat/index.ts`
2. `admin-artists` → `supabase/functions/admin-artists/index.ts`

**Edge Functions → Secrets** → `DEEPSEEK_API_KEY`

**Primo utente admin**:
1. Authentication → Users → Add User
2. Table Editor → `users` → Insert: stessa `id`, `email`, `display_name`, `role` = `admin`

Da qui in poi tutti gli utenti si creano da `/admin` nell'app.

### 2. Vercel

Push su GitHub → importa su Vercel → env vars:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_FEATURE_AI_CHAT=true
```

### 3. Dev locale

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Struttura

```
src/
├── components/
│   ├── calendar/       Filtri calendario
│   ├── layout/         Layout, Header, BottomNav, RouteGuards
│   ├── posts/          Gallery, Uploader, Actions, Comments
│   └── ui/             ErrorBoundary, Primitives
├── config/             env, constants, routes
├── hooks/              useAuth, useCalendar, usePost
├── lib/                api, adminApi, errors, supabase, storage, utils, validation
├── pages/              Tutte le pagine
├── stores/             auth, ui, featureFlags
└── types/              enums, models, api

supabase/
├── migrations/         4 SQL files
└── functions/
    ├── ai-chat/        Edge Function AI
    └── admin-artists/  Edge Function gestione utenti
```
