# SaaS Upgrade Plan v2: AI Math Tutor — Production-Ready Platform (\~78 atomic-sized commits that are written in a human like way and commited on the go during implementation instead of at the end)

## Summary

Transform the math tutor into a polished, production-grade platform with professional UX, GSAP animations, full authentication, SEO optimization, mobile responsiveness, and performance excellence. Single tier using DeepSeek V4 Flash (`deepseek-v4-flash`), raw SQL (better-sqlite3), JWT auth, no monetization.

***

## Current State Analysis

**What exists:**

* Next.js 16 App Router + React 19 + TypeScript 6

* Single chat page (`src/app/page.tsx`) with streaming AI responses

* Sidebar with chat history (hardcoded demo data)

* Language switcher (8 languages)

* Markdown renderer with KaTeX math + code highlighting

* Vanilla CSS design system with custom properties (no Tailwind)

* OpenAI-compatible API route at `/api/chat/message`

* 3 contexts: LanguageContext, ChatContext, ConceptContext

**What's missing:**

* Authentication (no login/signup)

* Database persistence (everything in-memory)

* Rate limiting

* SEO (basic title only)

* Proper mobile experience (basic media queries only)

* Professional animations (only basic CSS fadeIn)

* Settings page

* Error boundaries, toasts, loading skeletons

* Keyboard shortcuts

* Export/share functionality

* File upload

* Dark/light theme toggle (only system-level `prefers-color-scheme`)

* Security headers

**Dependencies to add:**

* `better-sqlite3`, `@types/better-sqlite3` — database

* `gsap` — professional animations

* `uuid`, `@types/uuid` — ID generation

**Existing deps we keep:**

* `next`, `react`, `react-dom`, `react-markdown`, `react-syntax-highlighter`, `rehype-katex`, `remark-gfm`, `remark-math`, `openai` (for DeepSeek via OpenAI-compatible API)

***

## Phase 1: Project Infrastructure & Dependencies

### 1.1 Install dependencies

```bash
npm install better-sqlite3 gsap uuid
npm install -D @types/better-sqlite3 @types/uuid
```

### 1.2 Next.js config — security + performance

**File:** `next.config.ts` (modify)

Add:

* Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

* `images` config for optimization

* `experimental.optimizePackageImports` for tree-shaking

### 1.3 Environment

**File:** `.env.example` (new)

```
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
SESSION_SECRET=your-random-secret-here
```

**File:** `.env.local` (create from example, gitignored)

***

## Phase 2: Database Foundation (Raw SQL)

### 2.1 Database singleton + migrations

**File:** `src/lib/db.ts` (new)

* Singleton `getDb()` with WAL mode

* Auto-create `data/` directory

* Call `migrate(db)` on init

**File:** `src/lib/db/migrations.ts` (new)

* `migrate(db)` — checks `_migrations` table, runs pending SQL

* Version 1 schema (see below)

### 2.2 Schema (V1)

```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'en',
    math_level TEXT DEFAULT 'intermediate',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    preview TEXT,
    is_archived INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    chat_session_id TEXT,
    request_tokens INTEGER DEFAULT 0,
    response_tokens INTEGER DEFAULT 0,
    model TEXT DEFAULT 'deepseek-v4-flash',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    theme TEXT DEFAULT 'system',
    font_size TEXT DEFAULT 'medium',
    message_density TEXT DEFAULT 'comfortable',
    sound_enabled INTEGER DEFAULT 1,
    keyboard_shortcuts_enabled INTEGER DEFAULT 1,
    animations_enabled INTEGER DEFAULT 1
);
```

### 2.3 Query modules

**File:** `src/lib/db/users.ts` (new)

* `createUser(email, name, passwordHash)` → user

* `getUserByEmail(email)` → user | null

* `getUserById(id)` → user | null

* `updateUser(id, fields)` → void

**File:** `src/lib/db/sessions.ts` (new)

* `createSession(userId)` → session

* `getSessionByToken(token)` → session | null

* `deleteSession(token)` → void

* `deleteUserSessions(userId)` → void

**File:** `src/lib/db/chats.ts` (new)

* `createChat(userId, title, preview?)` → chat

* `getUserChats(userId)` → chats\[]

* `getChatById(chatId)` → chat | null

* `updateChat(chatId, fields)` → void

* `deleteChat(chatId)` → void

* `searchChats(userId, query)` → chats\[]

**File:** `src/lib/db/messages.ts` (new)

* `addMessage(chatSessionId, role, content, tokenCount?)` → message

* `getChatMessages(chatSessionId)` → messages\[]

* `deleteMessages(chatSessionId)` → void

**File:** `src/lib/db/usage.ts` (new)

* `logUsage(userId, chatSessionId?, requestTokens?, responseTokens?)` → void

* `getUserUsage(userId, since?)` → usage\[]

***

## Phase 3: Authentication (JWT, No External Libraries)

### 3.1 Auth core

**File:** `src/lib/auth.ts` (new)

* `hashPassword(password)` → `salt:hash` using `crypto.createHash('sha256')`

* `comparePassword(password, hash)` → boolean

* `signToken(payload)` → JWT string (HMAC-SHA256, no external lib)

* `verifyToken(token)` → payload | null (checks exp)

### 3.2 Auth middleware helpers

**File:** `src/lib/auth-middleware.ts` (new)

* `getSession(request: NextRequest)` → `{ user, session } | null`

  * Reads `session_token` cookie

  * Verifies JWT, checks DB session exists + not expired

  * Returns user + session or null

### 3.3 Auth API routes

**File:** `src/app/api/auth/signup/route.ts` (new)

* POST: validate email (regex), password (≥8 chars), name (≥2 chars)

* Check email not taken → 409

* Hash password → create user + session → set cookie → 201

**File:** `src/app/api/auth/login/route.ts` (new)

* POST: find user by email → compare password → create session → set cookie → 200

* Invalid → 401 with generic message

**File:** `src/app/api/auth/logout/route.ts` (new)

* POST: delete session from DB → clear cookie → 200

**File:** `src/app/api/auth/me/route.ts` (new)

* GET: getSession → return user data (no password hash) → 200

* No session → 401

### 3.4 Auth pages (UX-focused)

**File:** `src/app/(auth)/login/page.tsx` (new)

* Centered card with GSAP entrance animation (fade + slide up, stagger children)

* Email + password fields with real-time validation

* Show/hide password toggle with eye icon animation

* "Remember me" checkbox

* Submit button with loading spinner state

* Error shake animation on invalid credentials

* Link to signup

* Responsive: full-width on mobile, centered card on desktop

* GSAP: card scales in with elastic ease, fields stagger in

**File:** `src/app/(auth)/signup/page.tsx` (new)

* Multi-step flow (not separate pages, animated transitions):

  1. Name + Email (slide right → left transition)
  2. Password + Confirm (slide right → left)
  3. Math Level selection (slide right → left)

* Progress dots at top (animated fill)

* Password strength meter (weak/medium/strong with color bar)

* GSAP: smooth step transitions with directional slides, progress bar fill animation

* Success: checkmark animation → auto-redirect to chat

### 3.5 Auth context

**File:** `src/contexts/AuthContext.tsx` (new)

* State: `user`, `isLoading`, `isAuthenticated`

* Methods: `login(email, password)`, `signup(name, email, password, mathLevel)`, `logout()`

* Auto-fetch `/api/auth/me` on mount (if cookie exists)

* Provider wraps the app in layout

***

## Phase 4: DeepSeek AI Integration

### 4.1 DeepSeek client

**File:** `src/lib/deepseek.ts` (new)

* `streamChatCompletion(messages)` → ReadableStream

* Model: `deepseek-v4-flash`

* Base URL: `https://api.deepseek.com/v1` (OpenAI-compatible)

* Streaming via SSE parsing

* Temperature: 0.7, max\_tokens: 4096

### 4.2 Update chat message API

**File:** `src/app/api/chat/message/route.ts` (modify)

* Replace OpenAI direct calls with `streamChatCompletion`

* Add `getSession()` auth check → 401 if unauthenticated

* Save user message to DB before streaming

* Stream response, accumulate full content

* After stream ends: save assistant message to DB, log usage

* Add rate-limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

* Rate limit: 30 requests per minute per user (in-memory Map, simple sliding window)

### 4.3 System prompt enhancement

**File:** `src/app/api/chat/prompts/prompt-en-us.txt` (modify)
**File:** `src/app/api/chat/prompts/prompt-zh-hans.txt` (modify)
**File:** `src/app/api/chat/prompts/prompt-zh-hant.txt` (modify)

* Enhanced for DeepSeek V4 Flash capabilities

* Better step-by-step reasoning instructions

* Structured output guidance (use headers, lists, tables)

* Cultural adaptation notes preserved

### 4.4 Chat CRUD API routes

**File:** `src/app/api/chats/route.ts` (new)

* GET: list user's chats (ordered by updated\_at DESC)

* POST: create new chat session

**File:** `src/app/api/chats/[id]/route.ts` (new)

* GET: get chat with messages

* PATCH: rename chat title

* DELETE: delete chat and all messages

***

## Phase 5: GSAP Animations — Professional Motion Design

### 5.1 GSAP setup

**File:** `src/lib/gsap.ts` (new)

* Register GSAP plugins: ScrollTrigger (optional, for landing page)

* Export configured `gsap` instance

* Export `useGSAP` hook wrapper for React 19 compatibility

* Export animation presets: `fadeInUp`, `fadeInScale`, `staggerChildren`, `slideInLeft`, `slideInRight`

### 5.2 Page entrance animations

**File:** `src/app/page.tsx` (modify)

* **Welcome section**: Logo/title animates in with `gsap.from()` — scale 0.8→1 with elastic easing, opacity 0→1. Subtitle staggers 200ms after. Prompt buttons stagger in from bottom with 100ms delay each, spring physics.

* **Sidebar**: Smooth width transition with GSAP `to()` for sidebar toggle (replaces CSS transition for smoother feel). Chat items stagger in from left when sidebar opens.

* **Chat messages**: Each message bubble animates in with `gsap.from()` — slide up 20px, opacity 0→1, stagger 50ms. User messages from right, assistant from left.

* **Loading dots**: GSAP timeline with repeating bounce on 3 dots, staggered 200ms.

### 5.3 Micro-interactions

**File:** `src/app/page.tsx` (modify)
**File:** `src/components/chat/ChatInterface.tsx` (modify)

* **Send button**: Scales down to 0.9 on press, springs back. Hover: slight scale up 1.05.

* **Input focus**: Border glow animation with GSAP `to()` on focus/blur.

* **Message hover**: Subtle lift (translateY -2px) with shadow increase.

* **Copy feedback**: Button text fades to "Copied!" and back with GSAP timeline.

* **Theme toggle**: Sun/moon icon morphs with rotation animation (360deg spin + scale).

* **Sidebar toggle**: Icon rotates 180deg smoothly, sidebar width animates with custom easing.

### 5.4 Advanced animations

**File:** `src/components/ui/AnimatedCounter.tsx` (new)

* Number counting animation (e.g., message count, token usage)

* `gsap.to()` from 0 to target number with ease

**File:** `src/components/ui/PageTransition.tsx` (new)

* Wrapper for page transitions using GSAP

* `in` and `out` animations for route changes

### 5.5 Scroll-triggered animations

**File:** `src/app/page.tsx` (modify)

* Chat messages fade in as they scroll into view (if scrolling through long history)

* "Scroll to bottom" button fades in when scrolled up > 200px

***

## Phase 6: Mobile Optimization — Responsive Excellence

### 6.1 Mobile-first responsive CSS

**File:** `src/app/globals.css` (modify)

* Base styles target mobile (< 640px), then scale up via `@media (min-width: ...)`

* Breakpoints: `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl)

* Add CSS custom properties for responsive spacing:

  ```css
  --container-padding: var(--space-4); /* mobile */
  @media (min-width: 768px) { --container-padding: var(--space-8); }
  ```

### 6.2 Sidebar — mobile behavior

**File:** `src/components/ui/Sidebar.tsx` (modify)

* On mobile (< 768px): sidebar slides in as overlay with backdrop blur

* GSAP: sidebar slides in from left with `gsap.to(x, 0)` on open, `gsap.to(x, -100%)` on close

* Backdrop fades in/out simultaneously

* Swipe-to-close: touch event listener for swipe-right gesture (threshold 80px)

* Close on backdrop tap

* Close on chat selection (auto-close on mobile)

* Hamburger menu button in header for mobile trigger

### 6.3 Chat input — mobile optimization

**File:** `src/app/page.tsx` (modify)
**File:** `src/components/chat/ChatInterface.tsx` (modify)

* Input bar fixed to bottom on mobile with safe area padding (`env(safe-area-inset-bottom)`)

* Touch-friendly tap targets (minimum 44px)

* Input does NOT auto-focus on mobile (prevents keyboard popup on load)

* Send button larger on mobile (48px)

* Keyboard-aware: adjust viewport when virtual keyboard opens

### 6.4 Touch gestures

**File:** `src/app/page.tsx` (modify)

* Pull-to-refresh disabled on chat area (prevents accidental refresh)

* Long-press on message → shows message actions (copy, etc.)

* Double-tap on message bubble to select text

### 6.5 Responsive typography

**File:** `src/app/globals.css` (modify)

* Use `clamp()` for fluid typography:

  ```css
  --font-size-h1: clamp(1.5rem, 4vw, 2.5rem);
  --font-size-body: clamp(0.875rem, 2vw, 1rem);
  ```

* Code blocks: horizontal scroll on mobile, no text wrap

### 6.6 Mobile performance

* Reduce animation complexity on mobile (use `prefers-reduced-motion` check + device width)

* GSAP: disable heavy animations on < 768px or when `prefers-reduced-motion`

***

## Phase 7: SEO Optimization

### 7.1 Metadata overhaul

**File:** `src/app/layout.tsx` (modify)

* Full metadata object:

  ```ts
  metadata: {
    title: { template: '%s | AI Math Tutor', default: 'AI Math Tutor — Learn Math with AI' },
    description: 'Personalized AI-powered math tutoring. Get step-by-step explanations, practice problems, and instant help with algebra, geometry, calculus, and more.',
    keywords: ['math tutor', 'AI math', 'learn math', 'math help', 'algebra', 'geometry', 'calculus', 'online tutor'],
    authors: [{ name: 'AI Math Tutor' }],
    creator: 'AI Math Tutor',
    openGraph: { type: 'website', locale: 'en_US', siteName: 'AI Math Tutor', ... },
    twitter: { card: 'summary_large_image', ... },
    robots: { index: true, follow: true },
    alternates: { canonical: 'https://...' },
  }
  ```

* JSON-LD structured data: `WebApplication` schema with AI features, educational application type

### 7.2 Sitemap & robots

**File:** `src/app/sitemap.ts` (new)

* Dynamic sitemap: homepage + auth pages + shared chat pages

* `changeFrequency: 'weekly'`, `priority` values

**File:** `src/app/robots.ts` (new)

* Allow all, point to sitemap

### 7.3 Semantic HTML

**File:** `src/app/layout.tsx` (modify)

* `<html lang="en">` (dynamic based on user language)

* `<main>`, `<nav>`, `<article>` tags where appropriate

* Proper heading hierarchy (h1 → h2 → h3)

### 7.4 Performance for SEO (Core Web Vitals)

* LCP optimization: font `display: swap`, preload critical fonts

* FID/INP: no heavy JS blocking main thread

* CLS: explicit width/height on images, stable layout

* See Phase 10 for detailed performance work

***

## Phase 8: UX Overhaul — Core Chat Experience

### 8.1 Message bubbles redesign

**File:** `src/app/globals.css` (modify)

* User bubbles: right-aligned, blue-tinted, with subtle shadow

* Assistant bubbles: left-aligned, neutral bg, full-width for math content

* Consecutive same-role messages grouped with reduced gap

* Timestamps appear on hover (GSAP: fade in from 0 opacity)

* Message status indicators: sending (pulse), sent (check), error (red dot)

### 8.2 Message actions

**File:** `src/components/chat/MessageActions.tsx` (new)

* Copy content (with "Copied!" GSAP feedback: text swap + green flash)

* Regenerate response (re-send last user message)

* Thumbs up / thumbs down feedback (toggle, GSAP: scale bounce on click)

* Appear on hover (desktop) or long-press (mobile)

* GSAP: actions bar slides in from right edge with stagger

### 8.3 Input area improvements

**File:** `src/app/page.tsx` (modify)
**File:** `src/components/chat/InputArea.tsx` (new, extracted from page.tsx)

* Auto-resize textarea (grows to max 6 lines, then scrolls)

* Slash commands: `/explain`, `/solve`, `/practice`, `/quiz` — dropdown on `/` key

* File attachment button (paperclip icon) — Phase 11 for upload

* Send button with GSAP: scales on press, arrow icon animates

* Shift+Enter for newline, Enter to send

* Character counter (appears after 1000 chars)

* Draft auto-save to localStorage (debounced 500ms)

* Stop generation button during streaming

**File:** `src/components/chat/SlashCommandMenu.tsx` (new)

* Animated dropdown triggered by `/`

* Keyboard navigation: ↑↓ arrows + Enter, Escape to close

* GSAP: menu scales in from top-left origin, options stagger

### 8.4 Chat header improvements

**File:** `src/components/chat/ChatInterface.tsx` (modify)

* Editable title: click title → inline input → Enter to save, Esc to cancel

* Action buttons: rename, export, delete (with confirm dialog)

* Message count and date display

* Back button to home

### 8.5 Streaming UX

**File:** `src/app/page.tsx` (modify)

* Blinking cursor at end of streaming text

* Smart auto-scroll: stick to bottom UNLESS user scrolled up > 100px

* "↓ Scroll to bottom" floating button (GSAP: fades in from bottom when scrolled up)

* Stop generation button (GSAP: fades out smoothly)

### 8.6 Empty state redesign

**File:** `src/app/page.tsx` (modify)

* Animated math-themed illustration (CSS/SVG animation, no external images)

* Centered welcome heading with GSAP staggered text reveal

* 4 suggestion cards with categories: Algebra, Geometry, Calculus, Word Problems

* Cards have hover lift effect (GSAP: translateY -4px, shadow increase)

* Recent chats quick-access row (if any exist)

***

## Phase 9: UX Overhaul — Sidebar & Navigation

### 9.1 Sidebar redesign

**File:** `src/components/ui/Sidebar.tsx` (modify)

* GSAP smooth width animation (280px ↔ 0px) with custom ease

* Chat items have hover lift + background reveal (GSAP)

* Context menu on right-click: Rename, Pin to top, Archive, Delete

* Pinned chats section at top with pin icon

* Active chat highlighted with accent bar on left edge (GSAP: bar slides in)

* Delete confirmation with GSAP shake + fade-out

### 9.2 Search improvements

**File:** `src/components/ui/Sidebar.tsx` (modify)

* Search across titles AND message content (API-backed when DB is implemented)

* Debounced 200ms

* Highlight matching text in results

* Keyboard shortcut: `Ctrl+K` focuses search

* Recent searches saved (top 5, localStorage)

* Empty state: "No chats match your search"

### 9.3 User section

**File:** `src/components/ui/Sidebar.tsx` (modify)

* Bottom section: user avatar (initials fallback) + name + settings gear

* Click avatar → dropdown: Settings, keyboard shortcuts, logout

* GSAP: dropdown scales in from bottom-right

***

## Phase 10: Performance Optimization

### 10.1 Bundle optimization

**File:** `next.config.ts` (modify)

* `experimental.optimizePackageImports`: tree-shake heavy packages

**File:** `src/components/ui/MarkdownRenderer.tsx` (modify)

* Dynamic import for SyntaxHighlighter: `const SyntaxHighlighter = dynamic(() => import('react-syntax-highlighter'), { ssr: false })`

* Already using PrismLight — good, keep this

### 10.2 Image & font optimization

**File:** `src/app/layout.tsx` (modify)

* `display: 'swap'` on all fonts (already configured)

* Preload critical font files in `<head>`

### 10.3 CSS performance

**File:** `src/app/globals.css` (modify)

* `content-visibility: auto` on chat message list (renders off-screen messages lazily)

* `will-change: transform` on animated elements (sparingly, only what GSAP animates)

* Remove unused CSS (no Tailwind purge needed — vanilla CSS is already minimal)

### 10.4 React performance

* `memo()` on ChatItem, MessageBubble, SidebarItem components

* `useCallback` on event handlers passed as props

* `useMemo` on filtered chat lists, grouped chats

* Avoid anonymous functions in render if passed as props

### 10.5 Network

* API responses gzipped (Next.js default)

* Streaming responses with `Transfer-Encoding: chunked`

* Cache-Control headers on static assets

***

## Phase 11: Advanced Features

### 11.1 Keyboard shortcuts

**File:** `src/lib/shortcuts.ts` (new)

* Global shortcut registry with `useEffect` keyboard listener

* `Ctrl+K` — focus search

* `Ctrl+B` — toggle sidebar

* `Ctrl+N` — new chat

* `Ctrl+Enter` — send message

* `Escape` — close modals, blur input

* `Ctrl+/` — show shortcut help modal

**File:** `src/components/ui/ShortcutHelp.tsx` (new)

* Modal overlay showing all shortcuts in categories

* GSAP: backdrop fades in, modal scales up

* Escape to close

### 11.2 Toast notification system

**File:** `src/components/ui/Toast.tsx` (new)
**File:** `src/contexts/ToastContext.tsx` (new)

* Toast types: success (green), error (red), warning (amber), info (blue)

* Auto-dismiss after 4s with progress bar (GSAP: bar shrinks from 100%→0% width)

* Stack multiple toasts (max 3 visible)

* GSAP: slides in from right, slides out to right

* Swipe to dismiss on mobile

### 11.3 Error boundary

**File:** `src/components/ui/ErrorBoundary.tsx` (new)

* React class component error boundary

* Friendly fallback UI: "Something went wrong" + retry button + error details toggle

* GSAP: error card fades in with gentle shake

### 11.4 Loading skeletons

**File:** `src/components/ui/Skeleton.tsx` (new)

* Skeleton variants: text line, circle (avatar), rectangle (card)

* Shimmer animation (CSS keyframes: gradient sweep)

* Used in: chat loading, sidebar loading, settings loading

### 11.5 Theme toggle

**File:** `src/components/ui/ThemeToggle.tsx` (new)

* 3 modes: Light, Dark, System

* GSAP: sun/moon icon swap with rotation

* Persist in localStorage + `data-theme` attribute on `<html>`

* Smooth background-color transition (CSS `transition: background-color 0.3s`)

**File:** `src/app/globals.css` (modify)

* Change dark mode from `@media (prefers-color-scheme: dark)` to `[data-theme="dark"]` class-based

* Add `[data-theme="light"]` for explicit light mode

* Add system theme detection JS in `<head>` to prevent FOUC

### 11.6 Math equation improvements

**File:** `src/components/ui/MarkdownRenderer.tsx` (modify)

* Click equation → copy LaTeX source to clipboard

* Toast: "LaTeX copied!"

* Error boundaries around KaTeX blocks (show raw text on render failure)

* Larger display math font size on desktop

### 11.7 Share functionality

**File:** `src/app/api/share/route.ts` (new)

* POST: create share link with optional expiration

* Share token stored in DB

**File:** `src/app/share/[token]/page.tsx` (new)

* Public read-only chat view (no auth required)

* Renders messages with KaTeX

* "Try AI Math Tutor yourself" CTA button

* SEO metadata per shared page

### 11.8 Export functionality

**File:** `src/lib/export.ts` (new)

* `exportChatAsMarkdown(messages)` → string

* `exportChatAsText(messages)` → string

* `downloadFile(content, filename, mimeType)` → triggers browser download

* Export button in chat header dropdown

***

## Phase 12: Settings Page

### 12.1 Settings page

**File:** `src/app/(dashboard)/settings/page.tsx` (new)
**File:** `src/app/(dashboard)/layout.tsx` (new)

* Sidebar navigation: General, Appearance, Account, Data

* **General**: Preferred language, math level (beginner/intermediate/advanced)

* **Appearance**: Theme, font size (small/medium/large), message density, animations toggle

* **Account**: Name, email (read-only), change password

* **Data**: Export all chats, delete account (with double confirm)

### 12.2 Preferences context

**File:** `src/contexts/PreferencesContext.tsx` (new)

* Theme, fontSize, animationsEnabled

* Persist to DB for logged-in users, localStorage for guests

* Sync across tabs via `storage` event listener

### 12.3 API routes for settings

**File:** `src/app/api/settings/route.ts` (new)

* GET: return user preferences

* PATCH: update preferences

**File:** `src/app/api/settings/password/route.ts` (new)

* PATCH: change password (verify old, set new)

***

## Phase 13: Middleware & API Polish

### 13.1 Middleware

**File:** `src/middleware.ts` (new)

* Auth guard: redirect `/settings` → `/login` if no session

* Rate limiting on `/api/chat/*`: simple in-memory sliding window (30 req/min/user)

* Rate limit exceeded: 429 + `Retry-After` header + JSON error

* CORS headers on API routes

### 13.2 ChatContext refactor

**File:** `src/contexts/ChatContext.tsx` (modify)

* Remove all hardcoded demo data

* Add `isLoading`, `error` states

* `fetchChats()` — calls `/api/chats` on mount

* `createChat(title)` — API call + optimistic update

* `deleteChat(id)` — API call + remove from state

* `selectChat(id)` — fetches messages from API

* Proper loading/empty/error state handling

***

## Phase 14: Polish & Launch Readiness

### 14.1 Accessibility

* All interactive elements have focus indicators (`:focus-visible` ring)

* ARIA labels on icon-only buttons

* `role="navigation"` on sidebar, `role="main"` on chat area

* `aria-live="polite"` on streaming message container

* Keyboard navigation: Tab through chat history, Enter to select, Delete to remove

* `prefers-reduced-motion`: disable GSAP animations, use instant transitions

### 14.2 Error states

* API errors show toast notification

* Network offline: detect with `navigator.onLine`, show banner

* Session expired: auto-redirect to login with message

### 14.3 Empty states

* No chats: friendly illustration + "Start your first math conversation"

* No search results: "No chats matching '{query}'"

* No messages in chat: prompt suggestions

### 14.4 Final verification checklist

* [ ] `npm run build` passes with no errors

* [ ] `npm run lint` passes

* [ ] Database creates + migrates on first `dev` run

* [ ] Signup → login → chat → logout flow works end-to-end

* [ ] DeepSeek V4 Flash streaming works

* [ ] Chat history persists across page refresh

* [ ] Chat history survives server restart

* [ ] GSAP animations smooth (no jank, 60fps)

* [ ] Theme toggle cycles: light → dark → system

* [ ] Mobile: sidebar overlay, touch gestures, safe areas

* [ ] Keyboard shortcuts all functional

* [ ] SEO: sitemap.xml accessible, metadata renders

* [ ] Rate limiting: 30+ requests in 1 min → 429

* [ ] All existing UI renders correctly (no regressions)

***

## Files Summary

### New files (\~45)

| File                                       | Purpose                        |
| ------------------------------------------ | ------------------------------ |
| `src/lib/db.ts`                            | Database initialization        |
| `src/lib/db/migrations.ts`                 | Schema migrations              |
| `src/lib/db/users.ts`                      | User queries                   |
| `src/lib/db/chats.ts`                      | Chat queries                   |
| `src/lib/db/messages.ts`                   | Message queries                |
| `src/lib/db/usage.ts`                      | Usage queries                  |
| `src/lib/db/sessions.ts`                   | Session queries                |
| `src/lib/auth.ts`                          | JWT auth + password hashing    |
| `src/lib/auth-middleware.ts`               | Auth middleware helpers        |
| `src/lib/deepseek.ts`                      | DeepSeek API client            |
| `src/lib/gsap.ts`                          | GSAP setup + animation presets |
| `src/lib/shortcuts.ts`                     | Keyboard shortcut registry     |
| `src/lib/export.ts`                        | Chat export (MD/TXT)           |
| `src/contexts/AuthContext.tsx`             | Auth state                     |
| `src/contexts/PreferencesContext.tsx`      | User preferences               |
| `src/contexts/ToastContext.tsx`            | Toast notifications            |
| `src/middleware.ts`                        | Auth + rate limiting           |
| `src/app/api/auth/signup/route.ts`         | Signup API                     |
| `src/app/api/auth/login/route.ts`          | Login API                      |
| `src/app/api/auth/logout/route.ts`         | Logout API                     |
| `src/app/api/auth/me/route.ts`             | Current user API               |
| `src/app/api/chats/route.ts`               | Chat list/create               |
| `src/app/api/chats/[id]/route.ts`          | Chat get/delete/rename         |
| `src/app/api/share/route.ts`               | Share chat                     |
| `src/app/api/settings/route.ts`            | Settings get/update            |
| `src/app/api/settings/password/route.ts`   | Password change                |
| `src/app/(auth)/login/page.tsx`            | Login page                     |
| `src/app/(auth)/signup/page.tsx`           | Signup page                    |
| `src/app/(auth)/layout.tsx`                | Auth layout                    |
| `src/app/(dashboard)/settings/page.tsx`    | Settings page                  |
| `src/app/(dashboard)/layout.tsx`           | Dashboard layout               |
| `src/app/share/[token]/page.tsx`           | Shared chat view               |
| `src/app/sitemap.ts`                       | SEO sitemap                    |
| `src/app/robots.ts`                        | Robots.txt                     |
| `src/components/chat/MessageActions.tsx`   | Message action buttons         |
| `src/components/chat/SlashCommandMenu.tsx` | Slash command menu             |
| `src/components/chat/InputArea.tsx`        | Chat input area (extracted)    |
| `src/components/ui/ThemeToggle.tsx`        | Theme toggle                   |
| `src/components/ui/ShortcutHelp.tsx`       | Keyboard shortcuts modal       |
| `src/components/ui/Toast.tsx`              | Toast notifications            |
| `src/components/ui/ErrorBoundary.tsx`      | Error boundary                 |
| `src/components/ui/Skeleton.tsx`           | Skeleton loading               |
| `src/components/ui/AnimatedCounter.tsx`    | Number count animation         |
| `src/components/ui/PageTransition.tsx`     | Page transition wrapper        |
| `.env.example`                             | Environment docs               |

### Modified files (\~10)

| File                                     | Changes                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/app/layout.tsx`                     | Add providers, SEO metadata, structured data, FOUC prevention                       |
| `src/app/page.tsx`                       | UX overhaul — GSAP animations, message bubbles, input, empty state, mobile gestures |
| `src/app/globals.css`                    | Dark/light theme classes, responsive typography, mobile-first, animation styles     |
| `src/components/chat/ChatInterface.tsx`  | UX overhaul — header, actions, editable title, mobile optimization                  |
| `src/components/ui/Sidebar.tsx`          | UX overhaul — GSAP animations, search, context menu, mobile overlay, user section   |
| `src/components/ui/MarkdownRenderer.tsx` | Dynamic import, better math, click-to-copy LaTeX                                    |
| `src/app/api/chat/message/route.ts`      | DeepSeek V4 Flash, auth, usage logging, rate limits, DB save                        |
| `src/contexts/ChatContext.tsx`           | Remove demo data, API-backed, loading/error states                                  |
| `next.config.ts`                         | Security headers, package optimization                                              |
| `package.json`                           | Dependencies                                                                        |

***

## Assumptions & Decisions

1. **better-sqlite3** — synchronous, fast, zero-config. Data stored in `data/math-tutor.db`
2. **JWT auth (no external libs)** — Node.js `crypto` is sufficient for HMAC-SHA256 signing
3. **DeepSeek V4 Flash** — single model, `deepseek-v4-flash`, OpenAI-compatible endpoint
4. **No monetization** — single tier, no payment system
5. **No email service** — signup doesn't require email verification (can add later)
6. **GSAP v3** — for professional animations, tree-shakable imports
7. **Vanilla CSS** — all new styles extend existing design token system
8. **Single-page app pattern** — main chat stays on `/`, settings on `/settings`, auth on `/login` and `/signup`
9. **Rate limiting** — simple in-memory Map, not Redis (sufficient for single-server deployment)
10. **Mobile-first responsive** — base styles target mobile, `@media` queries add desktop features

## Verification

1. `npm run build` — zero errors
2. `npm run lint` — zero errors
3. `npm run dev` — app starts, DB migrates on first run
4. Signup → login → chat → logout → re-login → see chat history
5. DeepSeek V4 Flash streaming works with proper error handling
6. GSAP animations: page entrance, message bubbles, sidebar, theme toggle, toasts
7. Mobile: sidebar overlay, touch gestures, safe areas, responsive typography
8. Dark/light/system theme toggle with no FOUC
9. Keyboard shortcuts: Ctrl+K, Ctrl+B, Ctrl+N, Ctrl+Enter, Ctrl+/, Escape
10. SEO: sitemap.xml, robots.txt, OpenGraph meta tags, structured data
11. Rate limiting: 30 req/min returns 429
12. All existing translations and language switching work
13. Chat export as Markdown and plain text
14. Shareable chat links with read-only view

