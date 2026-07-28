# Architecture

## Overview

Next.js 16 App Router monolith — single `better-sqlite3` database, DeepSeek AI backend, custom JWT auth, no external state library.

## Directory Layout

```
src/
├── app/                   Next.js App Router pages + API routes
│   ├── api/               REST API endpoints
│   ├── (auth)/            Login/signup pages
│   ├── topics/[topic]/    Topic landing pages (redirect to /)
│   └── globals.css        All custom CSS (4000+ lines)
├── components/
│   ├── chat/              Chat-specific components (InputArea, MessageRow, etc.)
│   ├── sidebar/           Extracted Sidebar subcomponents
│   └── ui/                Reusable UI components (ThemeToggle, ErrorBoundary, etc.)
├── contexts/              React Context providers (Auth, Chat, Language, Concept, Toast)
├── hooks/                 Custom hooks (useChatMessages, useChatUI, useSidebar)
├── lib/
│   ├── ai/                AI model abstraction (client.ts, deepseek.ts, prompts.ts, context.ts)
│   ├── db/                SQLite data access (migrations, users, sessions, chats, messages, usage)
│   ├── auth.ts            JWT signing/verification + password hashing
│   ├── auth-middleware.ts  Session lookup from request cookies
│   ├── rate-limit.ts      In-memory token bucket rate limiter
│   ├── translations.ts    Monolithic 12-language i18n (still needs lazy loading)
│   ├── validators.ts      Zod schemas for API request validation
│   ├── api-utils.ts       Shared API helpers (validateBody)
│   └── gsap.ts            Trimmed GSAP utilities (springIn, particleBurst)
└── types/                 Shared TypeScript interfaces (chat.ts, index.ts)
```

## Data Flow

```
User Input → InputArea → page.tsx (useChatMessages hook)
  → fetch POST /api/chat/message
    → auth middleware (getSession → verify JWT + DB lookup)
    → rate limit (per-IP + per-user)
    → validate body (Zod)
    → build context (system prompt + last 20 messages + new message)
    → DeepSeek streaming SSE → ReadableStream → client
  → on stream complete: save assistant message to SQLite
```

## Auth

- Password: PBKDF2-SHA256 (100K iterations) with salt
- Token: HMAC-SHA256 JWT with 7-day expiry
- Session: SQLite `sessions` table, token stored in httpOnly `session_token` cookie
- Middleware: `getSession()` reads cookie, verifies JWT, checks DB session

## Database

Single `data/math-tutor.db` (WAL mode). Tables: `users`, `sessions`, `chat_sessions`, `chat_messages`, `usage_logs`, `user_preferences`. All queries are synchronous (better-sqlite3).

## Known Debt

- Translations fully loaded (12 languages, ~72KB). Should use dynamic `import()`.
- better-sqlite3 is synchronous — blocks event loop under load.
- Rate limiter is in-memory — resets on restart.
- CSS is monolithic globals.css with no code splitting.
- No E2E tests.
