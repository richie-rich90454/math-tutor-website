# MathTutor AI — Phase 0: Existing Project Analysis

Date of analysis: 2026-08-01
Branch: `compatibility-rewrite`
Commit baseline: `871715d`

This document records a complete analysis of the existing MathTutor AI application before migration. It captures the current monolithic Next.js architecture, every API route, the database schema, the auth model, the frontend structure, and all configuration. It serves as the source of truth for feature-parity checks during the migration.

## 1. High-Level Overview

The current application is a **monolithic Next.js 16 application** (App Router, React 19) that serves both the UI and the backend API. The backend runs as Next.js API Routes on the Node runtime. Persistence uses a local SQLite database via `better-sqlite3`. The AI integration talks to an OpenAI-compatible chat-completions endpoint (DeepSeek by default) and streams SSE responses back to the client as plain text.

There is no external database, no external auth provider, and no separate backend process.

## 2. Runtime / Stack Inventory

| Concern | Current implementation |
| --- | --- |
| Framework | Next.js 16.2.9 (App Router), React 19.2.7, React DOM 19.2.7 |
| Language | TypeScript 5.8.3 |
| Styling | Tailwind CSS (v4, via PostCSS), global CSS |
| Animation | GSAP 3.15.0, @gsap/react 2.1.2 |
| Markdown / math | react-markdown 10.1.0, remark-gfm 4.0.1, remark-math 6.0.0, rehype-katex 7.0.1 |
| Code highlighting | react-syntax-highlighter 16.1.1 |
| DB | better-sqlite3 12.11.1 (SQLite, WAL mode) |
| Validation | zod 3.24.0 |
| IDs | uuid 14.0.1 |
| Test | Vitest 4.1.10 (+ @vitest/coverage-v8) |
| Lint/format | ESLint 9.39.4, eslint-config-next 16.2.9, oxfmt 0.61.0 |
| Package manager | npm (package-lock.json) |
| Next.js mode | Node runtime for API routes (not Edge) |
| Dev server | `next dev --turbopack` |

## 3. Directory Layout

```
src/
├── app/                      # App Router pages + API routes
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── (auth)/layout.tsx
│   ├── api/auth/{login,signup,logout,me}/route.ts
│   ├── api/chat/message/route.ts        # streaming chat
│   ├── api/chat/image/route.ts          # vision chat
│   ├── api/chat/prompts/prompt-*.txt    # 10 system prompts
│   ├── api/chats/route.ts
│   ├── api/chats/[id]/route.ts
│   ├── api/progress/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx              # main chat page
│   ├── progress/page.tsx
│   ├── settings/page.tsx
│   ├── topics/[topic]/page.tsx
│   ├── robots.ts, sitemap.ts, favicon.ico
├── components/
│   ├── chat/    ChatInterface, InputArea, MessageActions, MessageRow, SlashCommandMenu, VirtualizedMessages
│   ├── sidebar/ ChatList, ChatListItem, SearchBar, UserArea
│   └── ui/      AnimatedCounter, BottomSheet, Button, CommandPalette, ErrorBoundary, FocusTrap,
│                HtmlAttributes, LanguageSwitcher, MarkdownRenderer, MathParticles, MessageSkeleton,
│                PageTransition, RippleEffect, ShortcutHelp, Sidebar, Skeleton, SkipLink, Sparkles, ThemeToggle
├── contexts/    AuthContext, ChatContext, ConceptContext, LanguageContext, ToastContext
├── contexts/context_json/  mongolian + tibetan math concept JSON (70+ concepts each)
├── hooks/       useChatMessages, useChatUI, useSidebar
├── lib/
│   ├── ai/      client.ts (AIModel interface), deepseek.ts (SSE stream), context.ts, prompts.ts
│   ├── db/      chats.ts, messages.ts, migrations.ts, sessions.ts, usage.ts, users.ts
│   ├── api-utils.ts, aria-live.ts, auth-middleware.ts, auth.ts, config.ts, date.ts, db.ts,
│   │   export.ts, gsap.ts, rate-limit.ts, translations.ts, validators.ts
├── types/       chat.ts, index.ts, speech.d.ts
data/math-tutor.db            # SQLite DB (gitignored)
__tests__/auth.test.ts        # Vitest unit tests
```

## 4. API Surface (behavior to preserve)

### 4.1 POST /api/auth/signup
- Body: `{ name, email, password }` (zod `signupSchema`; email max 255, password 8-128, name 2-100).
- Rate limit: 5/min per IP (`signup:${ip}`).
- Flow: check email uniqueness (409 if taken) → `hashPassword` (PBKDF2-SHA256, 100k iterations) → `createUser` → `signToken` (JWT HS256, 7-day) → `createSession(userId, jwt)` → JSON `{ user }` (id, email, name, preferred_language, math_level) with status 201.
- Sets HttpOnly cookie `session_token` (30 days when remember, else 24h; Secure in production; SameSite=Lax).

### 4.2 POST /api/auth/login
- Body: `{ email, password, remember? }` (zod `loginSchema`).
- Rate limit: 10/min per IP (`login:${ip}`).
- Flow: lookup by email → `comparePassword` (supports legacy 2-part `salt:hash` SHA-256 and 4-part PBKDF2 format) → if !remember deleteUserSessions → `signToken({sub, email})` → `createSession` → JSON `{ user }`.
- Same cookie as signup. Invalid creds → 401 `{ error: "Invalid email or password" }`.

### 4.3 POST /api/auth/logout
- Requires valid session (optional — deletes session if present). Clears cookie. Returns `{ success: true }`.

### 4.4 GET /api/auth/me
- Requires session → `{ user: { id, email, name, avatar_url, preferred_language, math_level } }` else 401.

### 4.5 POST /api/chat/message
- Auth required (401 "Please sign in to chat").
- Rate limit: IP 60/min (`chat:ip:${ip}`), user 30/min (`chat:user:${id}`). 429 with `Retry-After` + X-RateLimit-* headers.
- Body: `{ message, chatId?, preferredLanguage? }` (zod `chatMessageSchema`, message 1-4000).
- Flow:
  1. Resolve/create chat: if `chatId` provided and exists → append user message + update preview (`slice(0,100)`) + `extractTopic`. If chatId provided but missing → create chat with that id. If no chatId → `uuidv4()`, create chat with title = first 50 chars of message.
  2. Title = message.slice(0,50) + `...` if > 50.
  3. History = `getRecentMessages(chatId, 20)`; `buildContext` → `[system, ...history, userMessage]`.
  4. System prompt from `getSystemPrompt(preferredLanguage || user.preferred_language || "en")`.
  5. `deepseek.streamChat(contextMessages)` → stream to client as `text/plain; charset=utf-8`, chunked, with `X-Chat-Id` header.
  6. On stream end, persist assistant message + `logUsage`.
- Errors → 500 JSON `{ error }`.

### 4.6 POST /api/chat/image
- Auth required. Rate limit IP 10/min (`image:${ip}`).
- Body: `{ image (base64 data URL), mimeType, message?, preferredLanguage?, chatId? }` (zod `chatImageSchema`).
- Flow: create/resolve chat (user message stored as `[Image] <text>`), build vision context with hardcoded English system prompt, POST to `${BASE_URL}/chat/completions` with `{ type:"image_url" }` content parts, stream SSE text back, persist assistant message + usage.
- Vision model = `OPENAI_COMPATIBLE_VISION_MODEL` || `OPENAI_COMPATIBLE_MODEL` || `deepseek-v4-flash`. Timeout 120s.

### 4.7 GET /api/chats
- Auth required (401). Optional `?q=` search.
- Returns `{ chats: [{ id, title, timestamp (created_at), preview (preview||title), topic, isPinned, messages: [] }] }`.
- Ordering: `is_pinned DESC, updated_at DESC`.

### 4.8 POST /api/chats
- Auth required. Body: `{ title, preview? }` (zod `createChatSchema`). Creates chat, 201 `{ chat }` (full row).

### 4.9 GET /api/chats/[id]
- Auth + ownership (403 if not owner, 404 if missing). Returns `{ chat, messages }` (raw rows; messages ordered by `created_at ASC`).

### 4.10 PATCH /api/chats/[id]
- Auth + ownership. Body: `{ title?, preview?, topic? }` (zod `updateChatSchema`). Returns `{ chat }`.

### 4.11 DELETE /api/chats/[id]
- Auth + ownership. Deletes chat (cascade messages). Returns `{ success: true }`.

### 4.12 GET /api/progress
- Auth required. Aggregates: `totalChats`, `totalMessages`, `topics` (topic → count, desc), `recentChats` (last 10 by updated_at), `dailyActivity` (last 30 days, `DATE(created_at)` → count, desc), `memberSince` (first chat created_at), `longestStreak` (computed from dailyActivity set, counts back from today, breaks on first missing day after day 0).

## 5. Database Schema (SQLite)

Versioned via `_migrations` table. Current version = 2.

- `users`: id (TEXT PK), email (TEXT UNIQUE NOT NULL), name (TEXT NOT NULL), password_hash (TEXT NOT NULL), avatar_url (TEXT), preferred_language (TEXT DEFAULT 'en'), math_level (TEXT DEFAULT 'intermediate'), created_at, updated_at.
- `sessions`: id (TEXT PK), user_id → users.id, token (TEXT UNIQUE NOT NULL), expires_at (TEXT NOT NULL), created_at.
- `chat_sessions`: id (TEXT PK), user_id → users.id, title (TEXT NOT NULL), preview (TEXT), topic (TEXT), is_archived (INTEGER DEFAULT 0), is_pinned (INTEGER DEFAULT 0), created_at, updated_at. (topic added in v2.)
- `chat_messages`: id (TEXT PK), chat_session_id → chat_sessions.id ON DELETE CASCADE, role (TEXT CHECK IN ('user','assistant')), content (TEXT NOT NULL), token_count (INTEGER DEFAULT 0), created_at.
- `usage_logs`: id (TEXT PK), user_id → users.id, chat_session_id (TEXT), request_tokens (INTEGER DEFAULT 0), response_tokens (INTEGER DEFAULT 0), model (TEXT DEFAULT 'deepseek-v4-flash'), created_at.
- `user_preferences`: user_id (TEXT PK) → users.id, theme (DEFAULT 'system'), font_size (DEFAULT 'medium'), message_density (DEFAULT 'comfortable'), sound_enabled (INTEGER DEFAULT 1), keyboard_shortcuts_enabled (INTEGER DEFAULT 1), animations_enabled (INTEGER DEFAULT 1).

Indexes: sessions.token, sessions.user_id, chat_sessions.user_id, chat_messages.chat_session_id, usage_logs.user_id, usage_logs.created_at.

Timestamps are stored as SQLite `datetime('now')` (UTC). DB file defaults to `./data/math-tutor.db`; WAL journal + foreign keys ON.

## 6. Authentication Model

- JWT HS256 signed with `SESSION_SECRET` (env; required at runtime, throws if missing). Claims: sub (userId), email, iat, exp (7 days).
- Session cookie `session_token`, HttpOnly, Path=/, SameSite=Lax, Secure in prod, Max-Age 2592000 (remember) or 86400.
- Password hashing: PBKDF2-SHA256, 100k iterations, 32-byte key, format `salt:iterations:keylen:hash`. Legacy 2-part `salt:hash` (SHA-256) is still verified for backward compatibility.
- Session persistence: DB `sessions` table; `getSession` validates JWT signature + expiry + DB row + user existence on every request.

## 7. AI Layer

- `src/lib/ai/client.ts`: `AIModel` interface `{ name, streamChat(messages) }`.
- `src/lib/ai/deepseek.ts`: 
  - Env: `OPENAI_COMPATIBLE_API_KEY` (required), `OPENAI_COMPATIBLE_BASE_URL` (default `https://api.deepseek.com`), `OPENAI_COMPATIBLE_MODEL` (default `deepseek-v4-flash`).
  - One retry on 5xx (2s delay) and on network failure (1s delay). 429 returned as-is.
  - Request body: `{ model, messages, stream: true, temperature: 0.7, max_tokens: 5000, thinking: { type: "disabled" } }`.
  - `streamSSEContent`: parses `data: ` SSE lines, extracts `choices[0].delta.content`, closes on `[DONE]`, tolerates malformed JSON chunks.
- `src/lib/ai/prompts.ts`:
  - `TOPIC_KEYWORDS`: maps topics (algebra, geometry, calculus, trigonometry, statistics, arithmetic, linear algebra, number theory, differential equations, word problems) to multi-language keyword lists.
  - `extractTopic(message)`: scores keyword hits, returns best topic or null.
  - `getSystemPrompt(language)`: reads `src/app/api/chat/prompts/prompt-<code>.txt` with in-memory cache; language→file map covers zh, zh-hans, zh-hant, bo, mn-cyrl, mn-mong, es, fr, de, ja, en. Fallback English prompt on read failure.
- `src/lib/ai/context.ts`: `MAX_CONTEXT_MESSAGES = 20`, `buildContext` prepends system prompt, appends history (last 20) and the new user message.

Prompt files: prompt-bo.txt, prompt-de.txt, prompt-en-us.txt, prompt-es.txt, prompt-fr.txt, prompt-ja.txt, prompt-mn-cyrl.txt, prompt-mn-mong.txt, prompt-zh-hans.txt, prompt-zh-hant.txt.

## 8. Frontend Structure

- **Pages**: `/` (chat, `src/app/page.tsx`), `/login`, `/signup`, `/progress`, `/settings`, `/topics/[topic]`.
- **Contexts**:
  - `LanguageContext`: 12 languages (en, zh-hans, zh-hant, mn-cyrl, mn-mong, bo, es, fr, de, ja, ar, he); persists to localStorage `preferred-language`; `t(key)` falls back to English; RTL set in layout for ar/he via `HtmlAttributes`.
  - `AuthContext`: user state, `login/signup/logout/refreshUser`, calls `/api/auth/*`.
  - `ChatContext`: `chatHistory`, `currentChat`, CRUD against `/api/chats`, `syncChatId`.
  - `ConceptContext`: loads Mongolian/Tibetan concept JSON from `context_json/`; `searchConcepts`, `getConceptById`, `getConceptsByCategory`, `setCulture`.
  - `ToastContext`: toast notifications.
- **Main chat page** (`useChatMessages` + `useChatUI`):
  - `sendMessage`: POST `/api/chat/message` with `{ message, preferredLanguage, chatId }`; 30s abort timeout; reads `X-Chat-Id` header to register new chats; streams via `response.body.getReader()`; appends chunks to assistant message; on error appends error text as an assistant message; on timeout appends "Request timed out. Please try again.".
  - `sendImage`: POST `/api/chat/image` with base64 image; same streaming/error handling.
  - `handleRegenerate`: truncates to last user message and re-sends it.
  - `handleEdit`: truncates to edited message and pre-fills input.
  - `handleExport`: exports markdown/txt via Blob download.
  - `handleStopGeneration`: aborts the AbortController.
  - UI: welcome screen with prompt buttons, message list (virtualized), input bar, scroll-to-bottom button, sidebar, command palette, keyboard shortcuts, bottom sheet on mobile.
- **Rendering**: `MarkdownRenderer` handles markdown + LaTeX + code highlighting; per-message fallback if KaTeX throws.

## 9. i18n

- `src/lib/translations.ts` defines ~195 keys with full translations for: en, zh-hans, zh-hant, mn-cyrl, mn-mong, bo, es, fr, de, ja (ar/he use English fallback for UI strings).
- System prompt per language drives AI tone/content language.

## 10. Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_COMPATIBLE_API_KEY` | Yes | - | AI API key |
| `OPENAI_COMPATIBLE_BASE_URL` | No | `https://api.deepseek.com` | AI API base URL |
| `OPENAI_COMPATIBLE_MODEL` | No | `deepseek-v4-flash` | Chat model |
| `OPENAI_COMPATIBLE_VISION_MODEL` | No | chat model | Vision model |
| `SESSION_SECRET` | Yes | - | JWT signing secret (throws if missing) |
| `DATABASE_PATH` | No | `./data/math-tutor.db` | SQLite file path |
| `NEXT_PUBLIC_SITE_URL` | No | `https://math-tutor.ai` | Site URL (SEO) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | No | - | Google Search Console |

## 11. Rate Limiting

In-memory `Map` keyed by bucket (`chat:ip:${ip}`, `chat:user:${id}`, `login:${ip}`, `signup:${ip}`, `image:${ip}`) with sliding reset. Cleanup interval every 5 min. Not persisted across restarts. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`; 429s also carry `Retry-After`.

## 12. Tests

- `__tests__/auth.test.ts`: covers `hashPassword`, `comparePassword` (incl. legacy format + malformed), `signToken`/`verifyToken` (valid, expired, tampered).
- Vitest config: node env, globals, alias `@` → `src`, env `SESSION_SECRET=test-secret-key-for-vitest`, include `**/__tests__/**/*.test.ts`.
- Run: `npm run test` / `npm run typecheck` / `npm run lint`.

## 13. Security Posture (current)

- Passwords: PBKDF2-SHA256 100k iterations, salted, timing-safe compare.
- JWT: HS256 with env secret, expiry checked, signature verified.
- Cookies: HttpOnly, SameSite=Lax, Secure in prod.
- SQL: parameterized prepared statements throughout; column allow-lists on dynamic updates.
- Validation: zod schemas on all body inputs; message length caps.
- Headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy; poweredByHeader disabled.
- Rate limiting on auth + chat + image endpoints.

## 14. Feature Checklist (parity targets)

1. Sign up / login / logout / session restore.
2. Streamed chat with history, 20-message context window.
3. Multi-language system prompts (10 prompt files) + 12-language UI.
4. Chat CRUD: list (with search), create, get, rename, delete, pin, archive flags.
5. Topic extraction & topic-based progress stats.
6. Image chat (vision) with base64 upload.
7. Export chat as Markdown / plain text.
8. Regenerate / edit / stop generation.
9. Progress page (counts, topics, streaks, recent activity, 30-day activity).
10. Settings page (account, appearance/theme, language, shortcuts).
11. Theme toggle (light/dark/system), RTL for ar/he.
12. Keyboard shortcuts, command palette, mobile bottom sheet.
13. Rate limiting and auth protection on every API.
14. ARIA live regions, skip link, focus trap, error boundary.
15. Concept context (Mongolian/Tibetan knowledge base) — used on topic pages.
