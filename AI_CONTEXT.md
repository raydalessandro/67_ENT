# 67 Entertainment Hub — AI Context

**Ultimo aggiornamento**: 2024-02-16
**Versione**: BUILD_WITH_AI_CONFIG

## ⚠️ REGOLE CRITICHE — LEGGERE PRIMA DI MODIFICARE

### 1. Git Workflow
- **Fare modifiche incrementali** — una feature alla volta
- **Committare subito dopo ogni fix** con messaggio chiaro in inglese
- **Pushare su main** dopo ogni commit per trigger Vercel deploy
- **Aspettare feedback utente** prima di procedere al fix successivo

### 2. Schema Database
- **NON inventare colonne** — verificare sempre schema reale su Supabase
- Colonne importanti:
  - `artists.is_active` (NON `is_label` — errore comune!)
  - `notifications.is_read` (NON `read`)
  - `artists.instagram_handle` (NON `instagram_url`)
  - `users` esiste in **DUE posti**: `auth.users` (Supabase Auth) e `public.users` (nostro profilo)
  - Usare SEMPRE `.schema('public')` quando si query `users`

### 3. Deployment
- **Vercel rebuilda automaticamente** al push su main
- **Cache del browser**: dopo deploy, utente DEVE fare hard refresh (Ctrl+Shift+R)
- Se modifiche non appaiono: controllare console browser per log di versione
- **PWA**: service worker può cachare, suggerire modalità incognito per test

### 4. TypeScript
- Mantenere consistenza nei nomi: `AiAgentConfig` (NON `AIAgentConfig`)
- Non usare `any` — sempre tipizzare
- Importare tipi da `@/types/models` e `@/types/api`

---

## 📁 STRUTTURA PROGETTO

### Frontend (`src/`)

```
components/
├── calendar/          Filtri calendario
├── guidelines/        CreateGuidelineModal, CreateSectionModal (staff)
├── layout/            Header, BottomNav, AppLayout, RouteGuards
├── posts/             Gallery, Uploader, Actions, Comments
└── ui/                ErrorBoundary, Primitives, Badge, LoadingSpinner

config/
├── constants.ts       Toast duration, limiti, etc.
├── env.ts             Env vars (VITE_SUPABASE_URL, etc.)
└── routes.ts          ROUTES object, route builders

hooks/
├── useAuth.ts         Gestione auth + user profile (con timeout 10s)
├── useCalendar.ts     Fetch posts per calendario
└── usePost.ts         CRUD post

lib/
├── api.ts             API client principale (posts, artists, aiAgents, etc.)
├── adminApi.ts        API admin (listArtists, createArtist, etc.)
├── errors.ts          AppError, handleApiError, isApiError
├── supabase.ts        Supabase client
├── storage.ts         Upload/download file (post-media, guideline-attachments)
├── utils.ts           cn (classnames), formatDate, etc.
└── validation.ts      Zod schemas

pages/
├── HomePage.tsx                Landing page con navigazione
├── LoginPage.tsx               Login form
├── CalendarPage.tsx            Vista calendario con filtri
├── PostDetailPage.tsx          Dettaglio post + commenti
├── CreatePostPage.tsx          Creazione post (staff only)
├── ToolkitPage.tsx             Lista sezioni materiali + FAB crea sezione (staff)
├── ToolkitSectionPage.tsx      Lista materiali in sezione + FAB crea materiale (staff)
├── AIChatPage.tsx              Chat AI per artisti
├── AIAgentConfigListPage.tsx   Lista config AI (staff) — route: /ai-chat/config
├── AIAgentConfigPage.tsx       Config singola AI (staff) — route: /ai-chat/config/:artistId
├── AdminPage.tsx               Gestione artisti (staff) + bottone "Configura AI"
└── PlaceholderPages.tsx        NotFoundPage

stores/
├── authStore.ts        Zustand: user, isStaff, login, logout
├── uiStore.ts          Zustand: offline, showOfflineBanner
└── featureFlags.ts     Zustand: aiChat flag (da env VITE_FEATURE_AI_CHAT)

types/
├── enums.ts            PostStatus, PostPlatform, UserRole, NotifType, etc.
├── models.ts           Tutti i tipi: User, Artist, Post, AiAgentConfig, etc.
└── api.ts              Input types: CreatePostInput, UpdateAiAgentConfigInput, etc.
```

### Backend (`supabase/`)

```
migrations/
├── 001_base.sql               Schema base: users, artists, posts, etc.
├── 002_ai_chat.sql            Tabelle AI: ai_agent_configs, ai_chat_messages
├── 003_addendum.sql           Aggiunte varie
├── 004_rpc_patch.sql          Fix RPC functions
├── 005_posts_view.sql         View post_details_with_counts
└── 006_fix_ai_trigger.sql     Fix trigger auto_create_ai_config (usa is_active)

functions/
├── ai-chat/
│   └── index.ts               Edge Function: chat con DeepSeek API
└── admin-artists/
    └── index.ts               Edge Function: creazione/gestione artisti
```

---

## 🗺️ MAPPA ROUTE

### Route Pubbliche
- `/login` — LoginPage

### Route Artisti (protette, require auth)
- `/` — HomePage (landing con navigazione)
- `/calendar` — CalendarPage
- `/posts/:id` — PostDetailPage
- `/toolkit` — ToolkitPage (lista sezioni)
- `/toolkit/:slug` — ToolkitSectionPage (materiali in sezione)
- `/ai-chat` — AIChatPage (chat con AI, solo se feature flag attivo)

### Route Staff (protette, require role=admin|manager)
- `/posts/new` — CreatePostPage
- `/admin` — AdminPage (gestione artisti)
- `/ai-chat/config` — AIAgentConfigListPage (lista config AI)
- `/ai-chat/config/:artistId` — AIAgentConfigPage (config AI singola)

### Note Importanti
- **NON confondere**:
  - `/ai-chat` = chat per artisti
  - `/ai-chat/config` = configurazione AI per staff
- Il bottone "Configura AI" in `/admin` naviga a `/ai-chat/config`
- Staff può vedere tutto, artisti vedono solo il proprio
- RLS (Row Level Security) su tutte le tabelle

---

## 🔧 MODIFICHE RECENTI (2024-02-16)

### Bug Fixes
1. **Artist selection in post creation**
   - Problema: Query usava `is_label=false` ma colonna non esiste
   - Fix: Cambiato a `is_active=true` in `src/lib/api.ts`
   - Commit: 3d83057

2. **Infinite loading on refresh**
   - Problema: Query timeout su `useAuth.ts`, query a `auth.users` invece di `public.users`
   - Fix: Aggiunto `.schema('public')` e explicit column selection + timeout 10s
   - Commit: 68f67ee

3. **TypeScript build error**
   - Problema: `Cannot find name 'AIAgentConfig'. Did you mean 'AiAgentConfig'?`
   - Fix: Cambiato tutti i riferimenti da `AIAgentConfig` a `AiAgentConfig` in `api.ts`
   - Commit: 5e154ee

4. **AI trigger bug**
   - Problema: Trigger `auto_create_ai_config()` usava ancora `is_label` invece di `is_active`
   - Fix: Migration `006_fix_ai_trigger.sql` + backfill configs mancanti
   - Commit: 56efb75

### Nuove Feature
1. **Material creation UI (Staff)**
   - Creato `CreateSectionModal.tsx` per creare sezioni toolkit
   - Creato `CreateGuidelineModal.tsx` per creare materiali
   - FAB button in `ToolkitPage.tsx` (crea sezione)
   - FAB button in `ToolkitSectionPage.tsx` (crea materiale)
   - Commit: 19c7b49, 9118c2a

2. **AI Configuration UI (Staff)**
   - Creato `AIAgentConfigListPage.tsx` — lista tutti gli agenti AI
   - Creato `AIAgentConfigPage.tsx` — config singola con 6 prompt sections
   - Route: `/ai-chat/config` e `/ai-chat/config/:artistId`
   - Bottone "Configura AI" in AdminPage → naviga a `/ai-chat/config`
   - API endpoints in `src/lib/api.ts`: `aiAgents.getAll()`, `getByArtist()`, `update()`
   - Commit: e136a93, 565900f

3. **Deployment debugging**
   - Aggiunto console.log versione in `App.tsx`
   - Aggiunto cache control headers in `vercel.json`
   - Commit: 9117f7d

---

## 🚀 WORKFLOW TIPICO

### Creare un nuovo artista (Staff)
1. Admin va su `/admin`
2. Click "Nuovo Artista"
3. Form: nome, email, password (auto-generabile), colore, handles social
4. Submit → crea: `auth.users` + `public.users` + `artists` + `ai_agent_configs`
5. Bottone WhatsApp → apre chat con credenziali

### Configurare AI per un artista (Staff)
1. Admin va su `/admin`
2. Click "Configura AI" → naviga a `/ai-chat/config`
3. Lista tutti gli artisti con badge (Attivo/Disabilitato)
4. Click su artista → naviga a `/ai-chat/config/:artistId`
5. Form: toggle enable, model, temperature, max_tokens, daily_message_limit
6. 6 sezioni prompt: identity, activity, ontology, marketing, boundaries, extra
7. Save → update `ai_agent_configs`

### Chattare con AI (Artista)
1. Artista va su `/ai-chat`
2. Vede chat con contesto giornaliero
3. Scrive messaggio → inviato a Edge Function `ai-chat`
4. Edge Function valida JWT, carica config AI, chiama DeepSeek API
5. Risposta salvata in `ai_chat_messages` e mostrata in chat

### Creare sezione materiali (Staff)
1. Staff va su `/toolkit`
2. Click FAB "+" (bottom-right)
3. Modal: title, slug (auto-generato), icon (16 opzioni), descrizione
4. Submit → crea `guideline_sections`
5. Refresh → nuova sezione appare

### Creare materiale (Staff)
1. Staff va su `/toolkit/:slug`
2. Click FAB "+" (bottom-right)
3. Modal: title, content (Markdown), type (permanent/campaign/update), priority, validity, targeting
4. Submit → crea `guideline_items`
5. Refresh → nuovo materiale appare

---

## 🐛 PROBLEMI NOTI

### 1. Cache del browser dopo deploy
- **Sintomo**: Modifiche non appaiono dopo deploy Vercel
- **Causa**: Browser cache HTML/JS assets
- **Fix**: Hard refresh (Ctrl+Shift+R) o modalità incognito
- **Mitigation**: Aggiunto cache control headers in `vercel.json` (commit 9117f7d)

### 2. Service Worker cache (PWA)
- **Sintomo**: App installata come PWA serve sempre vecchia versione
- **Causa**: Service worker (`public/sw.js`) può cachare assets
- **Fix**: Disinstalla PWA e reinstalla dopo deploy, oppure clear storage in DevTools
- **Note**: Service worker attuale è minimal (skipWaiting + claim), non dovrebbe causare problemi

### 3. Admin page lenta a caricare
- **Sintomo**: `/admin` impiega tanto tempo ad aprirsi
- **Causa**: Lazy loading + fetch artisti con tutti i dati
- **Fix potenziale**: Implementare pagination o virtualization se lista artisti cresce

### 4. Missing migrations su Supabase
- **Sintomo**: Errore "relation does not exist" o "column does not exist"
- **Causa**: Migration non eseguita su Supabase
- **Fix**: Verificare che tutte le 6 migration (001-006) siano state eseguite in ordine

---

## 🎯 TODO / FEATURE MANCANTI

### Materiali
- [ ] **Livello intermedio**: Manca possibilità di creare sottosezioni o categorie dentro le sezioni
- [ ] Upload allegati: form esiste ma upload non implementato

### AI
- [ ] Admin chat history: vedere le conversazioni degli artisti (solo staff)
- [ ] Analytics: tracking utilizzo AI (messaggi/giorno, artisti più attivi)
- [ ] A/B testing prompt: testare varianti prompt e vedere quale funziona meglio

### Post
- [ ] Notifiche push: quando post va in review o viene approvato
- [ ] Bulk actions: approvare/rifiutare multipli post
- [ ] Template post: salvare post come template riutilizzabile

### Generale
- [ ] Dark mode: attualmente solo dark, aggiungere toggle light/dark
- [ ] Esportazione dati: scaricare calendario/post/materiali in CSV/PDF
- [ ] Audit log: tracciare chi ha fatto cosa (creazione/modifica/cancellazione)

---

## 🔑 SECRETS & ENV

### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_FEATURE_AI_CHAT=true
```

### Supabase Edge Functions
```
DEEPSEEK_API_KEY=sk-...
```

### Vercel
Stesse variabili di `.env.local`, configurate in Project Settings → Environment Variables

---

## 📚 RIFERIMENTI UTILI

### Supabase
- Docs: https://supabase.com/docs
- RLS Policies: tutte definite in `001_base.sql`
- Storage buckets: `post-media`, `guideline-attachments` (public)

### API Endpoints
- Supabase REST API: auto-generato da schema
- Edge Functions:
  - `https://xxxxx.supabase.co/functions/v1/ai-chat` (POST)
  - `https://xxxxx.supabase.co/functions/v1/admin-artists` (POST, PATCH, DELETE)

### Librerie Frontend
- React Router: v6 (loader/action pattern NON usato, solo hooks)
- Zustand: state management (3 stores: auth, ui, featureFlags)
- React Hook Form: tutti i form (CreatePostPage, AdminPage, etc.)
- Zod: validation (vedi `src/lib/validation.ts`)
- FullCalendar: calendario (v6, solo daygrid + interaction)
- Lucide React: icone (NON usare altre librerie)
- Sonner: toast notifications (già configurato in App.tsx)

---

## ✅ CHECKLIST MODIFICHE

Prima di committare:
- [ ] TypeScript compila senza errori (`npm run build`)
- [ ] Nomi consistenti (AiAgentConfig, NON AIAgentConfig)
- [ ] Schema DB verificato (no colonne inventate)
- [ ] `.schema('public')` se query `users`
- [ ] Import corretti (`@/` alias, non `../..`)
- [ ] Messaggio commit chiaro in inglese (feat/fix/chore)
- [ ] Push su main per trigger deploy

Dopo deploy:
- [ ] Aspetta build Vercel (1-2 minuti)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Controlla console per log versione
- [ ] Testa funzionalità modificata
- [ ] Aspetta feedback utente prima di procedere

---

**Buon lavoro! 🚀**
