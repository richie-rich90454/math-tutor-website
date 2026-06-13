# SaaS Upgrade Plan: AI Math Tutor — UX-First

## Summary

Transform the math tutor into a polished, professional platform with a dramatic UX overhaul. Focus on smooth interactions, professional interface, and delightful details. Use raw SQL (better-sqlite3) for the database, JWT auth, and DeepSeek V4 Flash for AI. Single tier, no monetization.

***

## Phase 1: Database Foundation (Raw SQL)

### 1.1 Install dependencies

```bash
npm install better-sqlite3 bcryptjs uuid
npm install -D @types/better-sqlite3 @types/bcryptjs @types/uuid
```

### 1.2 Database setup

**File:** `src/lib/db.ts` (new)

* Initialize better-sqlite3 database

* Singleton pattern

* Migration runner

* WAL mode for performance

**File:** `src/lib/db/migrations.ts` (new)

* Schema creation on first run

* Versioned migrations

### 1.3 Raw SQL query helpers

**File:** `src/lib/db/users.ts` (new)
**File:** `src/lib/db/chats.ts` (new)
**File:** `src/lib/db/messages.ts` (new)
**File:** `src/lib/db/usage.ts` (new)

### 1.4 Schema

```sql
CREATE TABLE users (
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

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    preview TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    chat_session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE TABLE usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chat_session_id TEXT,
    request_tokens INTEGER DEFAULT 0,
    response_tokens INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT DEFAULT 'system',
    font_size TEXT DEFAULT 'medium',
    message_density TEXT DEFAULT 'comfortable',
    sound_enabled INTEGER DEFAULT 1,
    keyboard_shortcuts_enabled INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

***

## Phase 2: Authentication (JWT)

### 2.1 Auth system

**File:** `src/lib/auth.ts` (new)

* JWT-based auth using Node.js `crypto`

* `signToken`, `verifyToken`, `hashPassword`, `comparePassword`

* Session stored in database for revocability

* Cookie-based session management

**File:** `src/lib/auth-middleware.ts` (new)

* `getSession` — read session from cookie, verify in DB

* `requireAuth` — redirect to login if unauthenticated

* `getCurrentUser` — convenience helper

### 2.2 Auth API routes

**File:** `src/app/api/auth/signup/route.ts` (new)

* Validate email, password

* Hash password with bcryptjs

* Create user + session, set cookie

* Return user data

**File:** `src/app/api/auth/login/route.ts` (new)

* Verify credentials, create session, set cookie

* Return user data

**File:** `src/app/api/auth/logout/route.ts` (new)

* Delete session, clear cookie

**File:** `src/app/api/auth/me/route.ts` (new)

* Get current user from session

### 2.3 Auth pages (UX-focused)

**File:** `src/app/(auth)/login/page.tsx` (new)

* Clean centered card layout

* Animated form transitions

* Real-time validation

* "Show password" toggle

* Loading state on submit button

* Error shake animation

* Link to signup

**File:** `src/app/(auth)/signup/page.tsx` (new)

* Multi-step form (name/email → password → math level)

* Progress indicator

* Password strength meter

* Animated step transitions

* Success animation → redirect to chat

### 2.4 Auth context

**File:** `src/contexts/AuthContext.tsx` (new)

* `user`, `isAuthenticated`, `isLoading`

* `login`, `signup`, `logout` functions

* Auto-fetch session on mount

***

## Phase 3: DeepSeek AI Integration

### 3.1 DeepSeek client

**File:** `src/lib/deepseek.ts` (new)

* OpenAI-compatible client pointed at DeepSeek API

* Model: `deepseek-v4-flash`

* Streaming support

### 3.2 Update chat API

**File:** `src/app/api/chat/message/route.ts` (modify)

* Switch from OpenAI to DeepSeek with model `deepseek-v4-flash`

* Auth check via `getSession`

* Log usage to DB

* Save messages to DB after streaming

* Add `X-RateLimit-*` headers

### 3.3 System prompt

**File:** `src/app/api/chat/prompts/prompt-en-us.txt` (modify)

* Enhanced prompt for DeepSeek

* Better math formatting instructions

* Step-by-step reasoning guidance

***

## Phase 4: UX Overhaul — Core Chat Experience

### 4.1 Message bubbles redesign

**File:** `src/app/globals.css` (modify)

* Smooth slide-in animation for new messages

* Staggered animation for multi-message responses

* Better bubble grouping (consecutive same-role messages grouped)

* Animated typing indicator (3 bouncing dots)

* Message timestamp on hover

* Better spacing between message groups

### 4.2 Message actions

**File:** `src/components/chat/MessageActions.tsx` (new)

* Copy message content (with "Copied!" visual feedback)

* Regenerate response button

* Thumbs up/down feedback

* Appears on hover (desktop) or tap (mobile)

### 4.3 Input area improvements

**File:** `src/app/page.tsx` (modify)

* Auto-resize textarea (grows with content, max 6 lines)

* Slash commands menu: `/explain`, `/solve`, `/practice`, `/quiz`

* File attachment button with drag-drop zone

* Send button with animation

* Shift+Enter for newline, Enter to send

* Character counter

* Draft auto-save to localStorage

**File:** `src/components/chat/SlashCommandMenu.tsx` (new)

* Dropdown triggered by `/`

* Keyboard navigation (arrow keys + Enter)

* Animated appearance

### 4.4 Chat header improvements

**File:** `src/components/chat/ChatInterface.tsx` (modify)

* Editable chat title (click to edit inline)

* Quick actions: rename, export, share, delete

* Message count display

### 4.5 Streaming UX

**File:** `src/app/page.tsx` (modify)

* Smooth text streaming with blinking cursor

* Auto-scroll with smart "stick to bottom" detection

* "Scroll to bottom" floating button when scrolled up

* Stop generation button with fade-out animation

### 4.6 Empty state redesign

**File:** `src/app/page.tsx` (modify)

* Animated welcome illustration

* Suggested prompts with categories (Algebra, Geometry, Calculus, etc.)

* "Try asking" cards with example questions

* Recent chats quick access

***

## Phase 5: UX Overhaul — Sidebar & Navigation

### 5.1 Sidebar redesign

**File:** `src/components/ui/Sidebar.tsx` (modify)

* Smooth collapse/expand animation (300ms ease)

* Chat item context menu (right-click): rename, archive, delete

* Pin important chats to top

* Archive chats (soft delete with restore)

* Batch actions (select multiple, bulk delete/archive)

* Chat preview with syntax highlighting

### 5.2 Search improvements

**File:** `src/components/ui/Sidebar.tsx` (modify)

* Instant search as you type (debounced 200ms)

* Search across chat titles AND message content

* Highlight matching text in results

* Keyboard shortcut: Ctrl+K to focus search

* Recent searches saved

* No results state

### 5.3 Navigation improvements

**File:** `src/components/ui/Sidebar.tsx` (modify)

* User avatar + name at bottom

* Quick settings access

* Keyboard shortcut: Ctrl+B to toggle sidebar

* Sidebar overlay on mobile (with backdrop blur)

* Swipe to close on mobile

***

## Phase 6: UX Overhaul — Visual Polish

### 6.1 Animations & transitions

**File:** `src/app/globals.css` (modify)

* Page transition animations

* Micro-interactions on buttons (scale on press)

* Hover transitions (150ms ease)

* Loading skeleton shimmer animation

* Success/error feedback animations

* Smooth scroll behavior

### 6.2 Dark/Light mode toggle

**File:** `src/components/ui/ThemeToggle.tsx` (new)

* Manual toggle (light/dark/system)

* Animated sun/moon icon transition

* Persist preference in DB + localStorage

* Smooth theme transition

**File:** `src/app/globals.css` (modify)

* Add `[data-theme="dark"]` and `[data-theme="light"]` overrides

* `transition: background-color 0.3s, color 0.3s`

### 6.3 Typography & spacing

**File:** `src/app/globals.css` (modify)

* Refined font sizes and line heights

* Better reading rhythm (line-height: 1.7 for body)

* Improved heading hierarchy

* Better code block styling

* Responsive font scaling

### 6.4 Iconography

**File:** `src/components/ui/Icon.tsx` (new)

* Centralized SVG icon library

* Consistent sizing (16px, 20px, 24px)

* Replace all scattered inline SVGs

***

## Phase 7: UX Overhaul — Advanced Features

### 7.1 Keyboard shortcuts

**File:** `src/lib/shortcuts.ts` (new)

* Global shortcut registry

* `Ctrl+K` — search chats

* `Ctrl+B` — toggle sidebar

* `Ctrl+N` — new chat

* `Ctrl+Enter` — send message

* `Ctrl+Shift+C` — copy last message

* `Ctrl+/` — show shortcut help

* `Escape` — close modals

**File:** `src/components/ui/ShortcutHelp.tsx` (new)

* Modal showing all keyboard shortcuts

* Triggered by `Ctrl+/` or help button

### 7.2 Math equation improvements

**File:** `src/components/ui/MarkdownRenderer.tsx` (modify)

* Better KaTeX rendering (larger, clearer)

* Click equation to copy LaTeX

* Error fallback for broken equations

* Mobile-optimized display

### 7.3 Code & math blocks

**File:** `src/components/ui/MarkdownRenderer.tsx` (modify)

* Copy button on code blocks

* Language label

* Better math block styling

### 7.4 File upload

**File:** `src/components/chat/FileUpload.tsx` (new)

* Drag-drop zone in chat input

* Image preview before send

* PDF thumbnail preview

* File size validation (max 10MB)

* Upload progress bar

* Supported: PNG, JPG, PDF

### 7.5 Export functionality

**File:** `src/lib/export.ts` (new)

* Export chat as PDF (with math rendering)

* Export chat as Markdown

* Export chat as plain text

* Print-friendly styles

* "Export" button in chat header

### 7.6 Share functionality

**File:** `src/app/api/share/route.ts` (new)

* Generate shareable read-only link

* Optional expiration date

* View counter

**File:** `src/app/share/[id]/page.tsx` (new)

* Public read-only chat view

* "Try AI Math Tutor yourself" CTA

* Math rendered with KaTeX

***

## Phase 8: Settings & Preferences

### 8.1 Settings page

**File:** `src/app/(dashboard)/settings/page.tsx` (new)

* Tabs: General, Appearance, Account, Data

* **General**: Language, math level

* **Appearance**: Theme (light/dark/system), font size, message density, animation toggle

* **Account**: Name, email, password change, avatar upload

* **Data**: Export all data, delete account

### 8.2 Preference persistence

**File:** `src/contexts/PreferencesContext.tsx` (new)

* Theme, font size, shortcuts, sound

* Persist to DB for authenticated users

* Fallback to localStorage for guests

* Sync across tabs

***

## Phase 9: Middleware & API Routes

### 9.1 Middleware

**File:** `src/middleware.ts` (new)

* Auth guard: redirect unauthenticated → `/login`

* Basic rate limiting on `/api/chat/*`

* Return 429 with Retry-After header

### 9.2 Chat CRUD API

**File:** `src/app/api/chats/route.ts` (new)

* `GET` — list user's chats

* `POST` — create new chat session

**File:** `src/app/api/chats/[id]/route.ts` (new)

* `GET` — get chat with messages

* `DELETE` — delete chat

* `PATCH` — rename chat

**File:** `src/app/api/chats/[id]/messages/route.ts` (new)

* `POST` — add message to chat

### 9.3 Update ChatContext

**File:** `src/contexts/ChatContext.tsx` (modify)

* Remove hardcoded demo data

* Fetch chats from API on mount

* Loading/empty/error states

* Sync mutations to API

***

## Phase 10: Polish & Launch Readiness

### 10.1 Error handling

**File:** `src/components/ui/ErrorBoundary.tsx` (new)

* React error boundary with fallback UI

* Retry button

**File:** `src/components/ui/Toast.tsx` (new)

* Toast notification system

* Success, error, warning, info variants

* Auto-dismiss with progress bar

* Stack multiple toasts

* Swipe to dismiss on mobile

### 10.2 Loading states

**File:** `src/components/ui/Skeleton.tsx` (new)

* Skeleton loading for chat messages, sidebar, dashboard

* Shimmer animation

**File:** `src/components/ui/LoadingSpinner.tsx` (new)

* CSS-only spinner in sm, md, lg sizes

### 10.3 Accessibility

**File:** `src/app/globals.css` (modify)

* Focus indicators on all interactive elements

* ARIA labels throughout

* Skip to content link

* Keyboard navigation for all components

* `prefers-reduced-motion` support

* `prefers-contrast` support

### 10.4 Performance

**File:** `next.config.ts` (modify)

* Security headers (CSP, X-Frame-Options, etc.)

* Image optimization

* Dynamic imports for heavy components

**File:** `src/app/globals.css` (modify)

* `content-visibility: auto` for off-screen sections

* Font loading optimization (`font-display: swap`)

### 10.5 SEO & metadata

**File:** `src/app/layout.tsx` (modify)

* OpenGraph + Twitter card metadata

* JSON-LD structured data

* Canonical URLs

**File:** `src/app/sitemap.ts` (new)
**File:** `src/app/robots.ts` (new)

### 10.6 Environment

**File:** `.env.example` (new)

```
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DATABASE_PATH=./data/math-tutor.db
SESSION_SECRET=your-secret-here
```

***

## Files Summary

### New files (\~40)

| File                                       | Purpose                     |
| ------------------------------------------ | --------------------------- |
| `src/lib/db.ts`                            | Database initialization     |
| `src/lib/db/migrations.ts`                 | Schema migrations           |
| `src/lib/db/users.ts`                      | User queries                |
| `src/lib/db/chats.ts`                      | Chat queries                |
| `src/lib/db/messages.ts`                   | Message queries             |
| `src/lib/db/usage.ts`                      | Usage queries               |
| `src/lib/auth.ts`                          | JWT auth + password hashing |
| `src/lib/auth-middleware.ts`               | Auth middleware helpers     |
| `src/lib/deepseek.ts`                      | DeepSeek API client         |
| `src/lib/shortcuts.ts`                     | Keyboard shortcut registry  |
| `src/lib/export.ts`                        | Chat export (PDF/MD/TXT)    |
| `src/contexts/AuthContext.tsx`             | Auth state                  |
| `src/contexts/PreferencesContext.tsx`      | User preferences            |
| `src/middleware.ts`                        | Auth + rate limiting        |
| `src/app/api/auth/signup/route.ts`         | Signup API                  |
| `src/app/api/auth/login/route.ts`          | Login API                   |
| `src/app/api/auth/logout/route.ts`         | Logout API                  |
| `src/app/api/auth/me/route.ts`             | Current user API            |
| `src/app/api/chats/route.ts`               | Chat list/create            |
| `src/app/api/chats/[id]/route.ts`          | Chat get/delete/rename      |
| `src/app/api/chats/[id]/messages/route.ts` | Message add                 |
| `src/app/api/share/route.ts`               | Share chat                  |
| `src/app/(auth)/login/page.tsx`            | Login page                  |
| `src/app/(auth)/signup/page.tsx`           | Signup page                 |
| `src/app/(dashboard)/settings/page.tsx`    | Settings page               |
| `src/app/share/[id]/page.tsx`              | Shared chat view            |
| `src/app/sitemap.ts`                       | SEO sitemap                 |
| `src/app/robots.ts`                        | Robots.txt                  |
| `src/components/chat/MessageActions.tsx`   | Message action buttons      |
| `src/components/chat/SlashCommandMenu.tsx` | Slash command menu          |
| `src/components/chat/FileUpload.tsx`       | File upload                 |
| `src/components/ui/ThemeToggle.tsx`        | Theme toggle                |
| `src/components/ui/Icon.tsx`               | Icon library                |
| `src/components/ui/ShortcutHelp.tsx`       | Keyboard shortcuts modal    |
| `src/components/ui/Toast.tsx`              | Toast notifications         |
| `src/components/ui/ErrorBoundary.tsx`      | Error boundary              |
| `src/components/ui/Skeleton.tsx`           | Skeleton loading            |
| `src/components/ui/LoadingSpinner.tsx`     | Loading spinner             |
| `.env.example`                             | Environment docs            |

### Modified files (\~8)

| File                                     | Changes                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `src/app/layout.tsx`                     | Add providers, metadata, SEO                           |
| `src/app/page.tsx`                       | UX overhaul: input, messages, animations, empty state  |
| `src/components/chat/ChatInterface.tsx`  | UX overhaul: header, actions, interactions             |
| `src/components/ui/Sidebar.tsx`          | UX overhaul: animations, search, context menu          |
| `src/components/ui/MarkdownRenderer.tsx` | Better math rendering, code blocks, copy button        |
| `src/app/api/chat/message/route.ts`      | DeepSeek V4 Flash, auth, usage logging, DB save        |
| `src/app/globals.css`                    | Animations, themes, polish, accessibility, performance |
| `next.config.ts`                         | Security headers                                       |
| `package.json`                           | Dependencies                                           |

***

## UX Improvements Summary

| Area              | Before               | After                                                                    |
| ----------------- | -------------------- | ------------------------------------------------------------------------ |
| **Messages**      | Static bubbles       | Animated slide-in, grouped bubbles, hover timestamps, typing indicator   |
| **Input**         | Plain textarea       | Auto-resize, slash commands, file drag-drop, draft save, character count |
| **Sidebar**       | Basic list           | Smooth animations, context menu, pin, archive, batch actions             |
| **Search**        | Basic text filter    | Instant search, content search, highlight, recent searches, Ctrl+K       |
| **Theme**         | System only          | Manual toggle (light/dark/system), smooth transition                     |
| **Navigation**    | Basic                | Keyboard shortcuts, mobile overlay, swipe gestures                       |
| **Math**          | Basic KaTeX          | Click-to-copy LaTeX, error fallback, better sizing                       |
| **Auth**          | None                 | Login/signup with multi-step form, animated transitions, JWT sessions    |
| **Feedback**      | None                 | Toasts, loading skeletons, error boundaries                              |
| **Sharing**       | None                 | Shareable links, PDF/MD/TXT export, print styles                         |
| **Accessibility** | Minimal              | Full ARIA, focus indicators, screen reader, reduced motion               |
| **Data**          | In-memory, hardcoded | SQLite persistence, API-backed, loading/empty/error states               |

***

## Assumptions

1. **better-sqlite3** — synchronous, fast, no ORM overhead
2. **JWT + DB sessions** — no external auth library
3. **DeepSeek V4 Flash** — single model: `deepseek-v4-flash`
4. **No monetization** — single tier for all users
5. **No email service** — can be added later
6. **Vanilla CSS** — all new pages use existing design system
7. **Key focus: UX** — animations, micro-interactions, polish, accessibility

***

## Verification

1. `npm run build` passes
2. Database creates and migrates on first run
3. Signup → login → chat works end-to-end
4. DeepSeek V4 Flash streaming works
5. Chat history persists across refresh
6. Theme toggle works (light/dark/system)
7. Keyboard shortcuts functional
8. Mobile responsive
9. Animations smooth (no jank)
10. All existing UI renders identically

