# 67 Hub V2

Internal platform for **67 Entertainment** — content management, artist approvals, brand guidelines, AI assistant, and Instagram analytics.

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **AI:** Pluggable provider layer (OpenAI + Anthropic)
- **Calendar:** FullCalendar v6 (monthly grid with media thumbnails)
- **Charts:** Recharts
- **Push:** WebPush (service worker + VAPID)
- **Testing:** Vitest (181 tests)
- **Deploy:** Vercel + Supabase Cloud

## Live

- **App:** https://app-nu-gold-70.vercel.app
- **Supabase:** project `ltbescywrtdikbakpeaf` (EU West)

## Quick Start (Local Dev)

```bash
# 1. Start Supabase (requires Docker)
npx supabase start

# 2. Apply migrations + seed
npx supabase db reset

# 3. Install deps + start
npm install
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

**Production admin:** `admin@67ent.com` / `Admin67Hub!`

## Features

### Post Workflow
Staff creates posts, sends for review. Artist approves or rejects (with reason). Staff marks as published. Full status machine: `draft > in_review > approved > published` (or `rejected > draft`). Bidirectional comments on every post.

### Calendar (FullCalendar)
Interactive monthly grid view. Events color-coded by artist, opacity by status. Media thumbnails (20x20) shown on events. Click event to view post detail, click date to create new post (staff). **Main landing view for artists** (auto-redirect from home).

### Media Upload
Drag & drop upload for images and videos. Stored in Supabase Storage (`post-media` bucket). Thumbnails in calendar events and post detail gallery. Staff-only upload (RLS enforced).

### Push Notifications
WebPush via service worker (`public/sw.js`). Permission banner on first visit. Notifications sent when: post sent for review, post approved/rejected. VAPID key authentication.

### Toolkit (Guidelines)
Sections with configurable icons. Items with Markdown content, priority levels (1-5), types (permanent/campaign/update). Read tracking per user. Campaign auto-expiration.

### AI Chat
Per-artist personalized assistant. 6 configurable system prompt sections. Daily message limit with Europe/Rome timezone reset. Context injection (recent posts, upcoming schedule). Pluggable providers (OpenAI-compatible + Anthropic).

### Instagram Analytics
Per-artist dashboard (staff-only). Account overview, KPI cards, engagement chart, content type comparison, best posting day/hour, AI recommendations. Cached (5min TTL), fallback to mock data.

### Admin
Artist CRUD via server-side API routes (atomic: auth user + profile + AI config). Soft delete only. Password generation + WhatsApp share button.

### Auth & Security
Email/password via Supabase Auth. JWT + RLS on all tables. Role-based routing. Admin operations go through server-side API routes with `service_role` key (never exposed to browser).

### PWA
Service worker for push notifications. Offline indicator. Bottom navigation bar. Mobile-ready layout with iOS safe areas.

### Known Limitations (V2.1)

- **Instagram API**: requires real Meta Business token. In dev uses mock data automatically.
- **Instagram token auto-refresh**: not yet implemented (planned when within 7 days of expiry).
- **Video thumbnails**: not generated server-side (uses video element directly).

## Architecture

```
src/
  app/                — Next.js pages (App Router)
    (auth)/           — Login page
    (protected)/      — All authenticated pages
    api/              — API routes
      ai-chat/        — AI completion endpoint
      artists/        — Artist CRUD (server-side, service_role)
      instagram/      — Instagram API proxy
      push/           — WebPush subscribe/send
  components/
    analytics/        — Charts, KPIs, recommendations
    calendar/         — FullCalendar wrapper + event rendering
    posts/            — Post card, form, media uploader, comments
    toolkit/          — Section cards, guideline items
    ai/               — Chat interface, config form
    admin/            — Artist form, artist table
    layout/           — Header, bottom nav, app shell, push banner
    ui/               — shadcn/ui primitives
  hooks/              — useAuth, usePosts, useInstagramData, useAiChat, usePush
  lib/
    api/              — Supabase data access (posts, artists, guidelines, media, etc.)
    ai/               — Provider layer (types, openai, anthropic, prompt-builder, router)
    instagram/        — Client, cache, metrics, mock data
    supabase/         — Client factory, middleware
  stores/             — Zustand (auth, UI)
  types/              — database.ts (generated), models.ts, api.ts
  middleware.ts       — Session refresh

public/
  sw.js               — Service worker (push notifications)

supabase/
  migrations/         — 15 SQL files (enums, tables, functions, triggers, RLS, views)
  seed.sql            — Dev data (4 users, 2 artists, sample posts, guidelines, AI configs)

specs/                — GSP specification documents
  BRIEF.md            — Project brief
  L0_architecture.md  — File graph, DB schema, infrastructure decisions, security boundaries
  L0.5_interfaces.md  — Exact function signatures (sacred document)
  L1_L2_*.md          — Detailed flows and contracts per module
  GSP_IMPROVEMENTS.md — Pipeline lessons and patterns
```

## Testing

```bash
npm test              # Run all 181 tests
npx vitest run        # Same, CI mode
npx vitest --ui       # Interactive UI
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54355
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_FEATURE_AI_CHAT=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY=            # for push notifications
AI_OPENAI_API_KEY=                       # for AI chat
AI_ANTHROPIC_API_KEY=                    # optional

# Production (Vercel)
VAPID_PUBLIC_KEY=                        # server-side
VAPID_PRIVATE_KEY=                       # server-side
VAPID_SUBJECT=mailto:admin@67ent.com
PUSH_INTERNAL_SECRET=                    # internal auth for push/send
```

## Deploy

```bash
# Supabase
supabase link --project-ref <ref>
supabase db push
supabase gen types typescript --project-id <ref> 2>/dev/null > src/types/database.ts

# Vercel
vercel link --yes
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel --prod
```

## Built with GSP

This project was built using the **Graph Spec Pipeline (GSP)** — a structured methodology that treats specifications as compilable contracts:

1. **Phase 0** — BRIEF (requirements + design intent)
2. **Phase 1-2** — L0 Architecture + L0.5 Interfaces (the sacred document)
3. **Phase 3** — L1/L2 Detail (per-file flows and external contracts)
4. **Phase 4** — Test-first code (181 tests, parallel agents, ≤10 files/batch)
5. **Phase 5** — Deploy + stabilization

See `specs/GSP_IMPROVEMENTS.md` for v1 lessons and `GSP_IMPROVEMENTS_V2_DEPLOY.md` for deploy session lessons.
