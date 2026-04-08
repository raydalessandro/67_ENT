# 67 Hub V2

Internal platform for **67 Entertainment** — content management, artist approvals, brand guidelines, AI assistant, and Instagram analytics.

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** Pluggable provider layer (OpenAI + Anthropic)
- **Charts:** Recharts
- **Testing:** Vitest (128 tests)

## Quick Start

```bash
# 1. Start Supabase (requires Docker)
npx supabase start

# 2. Apply migrations + seed
npx supabase db reset

# 3. Start app
npm run dev
```

**URLs:**
- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54357

**Test accounts (seed):**

| Email | Password | Role |
|-------|----------|------|
| admin@67ent.com | admin123 | Admin |
| manager@67ent.com | manager123 | Manager |
| sliceg@67ent.com | artist123 | Artist |
| nova@67ent.com | artist123 | Artist |

## Features

### Implemented
- **Post Workflow** — Staff creates posts, artists approve/reject, staff publishes. Status machine: draft > in_review > approved > published (or rejected > draft)
- **Calendar** — Post list with filters (artist, status, platform). Posts grouped by date
- **Toolkit** — Sections with guidelines, Markdown content, priority levels, read tracking, campaign expiration
- **AI Chat** — Per-artist personalized assistant with configurable prompts (6 sections), daily rate limit, Europe/Rome timezone reset
- **AI Provider Layer** — Pluggable: OpenAI-compatible + Anthropic. Add new provider in ~10 lines
- **Instagram Analytics** — Per-artist dashboard: account overview, KPI cards, engagement chart, content type comparison, best posting day/hour, recommendations
- **Admin** — Artist CRUD (atomic creation via DB RPC), soft delete, password management, WhatsApp share
- **Auth** — Email/password via Supabase Auth, JWT, RLS on all tables, role-based routing
- **PWA** — Offline indicator, bottom nav, mobile-ready layout

### Known Limitations (V2.0)

- **Calendario visuale**: la vista calendario usa una lista filtrata con raggruppamento per data, non un calendario mensile interattivo (FullCalendar non ancora integrato). Planned per V2.1.
- **Upload media**: i post non supportano ancora il caricamento di foto e video. Il componente MediaUploader esiste ma l'integrazione con Supabase Storage per upload reale non e stata completata. I post funzionano solo con metadati (titolo, caption, hashtags, piattaforme).
- **Push notifications**: infrastruttura WebPush definita (tabella, API routes) ma non testata end-to-end. I browser devono concedere permesso.
- **Instagram API**: richiede token reale di Meta Business. In dev usa mock data automaticamente.

### Planned (V2.1)

- [ ] FullCalendar integrazione (vista mensile, drag & drop)
- [ ] Upload foto/video con Supabase Storage (drag & drop, thumbnail generation, gallery view)
- [ ] Push notifications end-to-end testing
- [ ] Instagram token auto-refresh (quando entro 7 giorni da scadenza)
- [ ] Dark/light mode toggle

## Project Structure

```
src/
  app/              — Next.js pages (App Router)
    (auth)/         — Login page
    (protected)/    — All authenticated pages
    api/            — API routes (ai-chat, instagram proxy, push)
  components/       — React components
    analytics/      — Charts, KPIs, recommendations
    posts/          — Post card, form, media, comments
    toolkit/        — Section cards, guideline items
    ai/             — Chat interface, config form
    admin/          — Artist form, artist table
    layout/         — Header, bottom nav, app shell
    ui/             — shadcn/ui primitives
  hooks/            — useAuth, usePosts, useInstagramData, useAiChat
  lib/
    api/            — Supabase data access (posts, artists, guidelines, etc.)
    ai/             — Provider layer (types, openai, anthropic, prompt-builder, router)
    instagram/      — Client, cache, metrics, mock data
    supabase/       — Client factory, middleware
  stores/           — Zustand (auth, UI)
  types/            — TypeScript models and API types

supabase/
  migrations/       — 14 SQL files (enums, tables, functions, triggers, RLS)
  seed.sql          — Dev data (4 users, 2 artists, sample posts, guidelines, AI configs)

specs/              — GSP specification documents
  BRIEF.md          — Project brief
  L0_architecture.md — File graph, DB schema, dependencies
  L0.5_interfaces.md — Exact function signatures (sacred document)
  L1_L2_*.md        — Detailed flows and contracts per module
  GSP_IMPROVEMENTS.md — Pipeline lessons and patterns
```

## Testing

```bash
npm test              # Run all 128 tests
npx vitest run        # Same, CI mode
npx vitest --ui       # Interactive UI
```

## Environment Variables

```bash
# .env.local (created automatically for local dev)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54355
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # fixed for local dev
NEXT_PUBLIC_FEATURE_AI_CHAT=true
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # fixed for local dev
AI_OPENAI_API_KEY=                    # add your key for AI chat
AI_ANTHROPIC_API_KEY=                 # optional
```

## Built with GSP

This project was built using the **Graph Spec Pipeline** — a 6-phase methodology:
1. BRIEF (what are we building)
2. L0 Architecture (file graph + DB schema)
3. L0.5 Interfaces (exact signatures — most critical)
4. L1+L2 Detail (per-file flows and contracts)
5. Test-first code (128 tests, 93 files)
6. UST (user scenario testing — pending)

See `specs/GSP_IMPROVEMENTS.md` for lessons learned.
