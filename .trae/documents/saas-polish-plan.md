# SaaS Polish Plan: AI Math Tutor — Production-Ready UX & Animation Overhaul

## Summary

The foundational infrastructure (DB, auth, API routes, component stubs, CSS design system) is built. This plan focuses on **integrating and polishing** everything into a stunning, production-grade SaaS application with professional GSAP animations, exceptional mobile UX, peak performance, and visual delight. The app should feel premium — like ChatGPT or Claude-level quality.

## Current State (What Exists)

**Infrastructure (done):**
- Next.js 16 + React 19 + TypeScript, all dependencies installed
- Database layer: better-sqlite3 with migrations, users/sessions/chats/messages/usage tables
- Auth: JWT auth with login/signup/logout/me routes, AuthContext
- DeepSeek API: client with streaming, chat CRUD API routes
- GSAP: setup file with animation presets (fadeInUp, fadeInScale, staggerChildren, slideInLeft/Right, useAnimateOnMount)
- SEO: metadata, sitemap, robots, structured data
- CSS: 2500+ line design system with theme toggle, responsive, skeleton, auth pages, markdown

**Component stubs exist but NOT integrated into main page:**
- `InputArea.tsx` — auto-resize textarea with stop button, char counter
- `MessageActions.tsx` — copy/regenerate/feedback buttons with GSAP
- `SlashCommandMenu.tsx` — slash command dropdown
- `ErrorBoundary.tsx` — React error boundary
- `Skeleton.tsx` — shimmer loading placeholders
- `ThemeToggle.tsx` — light/dark/system toggle with GSAP rotation
- `ShortcutHelp.tsx` — keyboard shortcuts modal
- `PageTransition.tsx` — page transition wrapper
- `AnimatedCounter.tsx` — number counting animation
- `ToastContext.tsx` — toast notification system
- `export.ts` — chat export utilities

**Major gaps:**
- `page.tsx` is a monolith — doesn't use InputArea, MessageActions, or any new components
- ChatContext still has hardcoded demo data, not API-backed
- No middleware (auth guard, rate limiting)
- No settings page
- No share functionality
- No React performance optimizations (memo/useCallback)
- GSAP animations only on welcome section — not on messages, sidebar, or interactions
- Mobile: CSS exists but mobile menu button, backdrop, swipe gestures not wired up in page.tsx
- No InputArea/ThemeToggle CSS classes in globals.css
- No keyboard shortcuts registry file

---

## Phase 1: CSS Foundation — Missing Component Styles

### 1.1 Add InputArea styles to globals.css

**File:** `src/app/globals.css`

Add CSS classes:
- `.input-area` — flex-shrink-0 container with border-top, backdrop-blur
- `.input-area-inner` — max-width 768px centered
- `.input-area-row` — flex row
- `.input-textarea-wrapper` — relative, flex-1
- `.input-textarea` — rounded-2xl, border, resize-none, focus ring animation
- `.input-send-btn` — absolute positioned send button with hover scale
- `.input-stop-btn` — absolute positioned stop button (red square icon)
- `.input-area-bottom` — flex row with hint text and char counter
- `.input-hint` — small muted text
- `.input-char-count` — small warning-colored text

### 1.2 Add ThemeToggle styles

**File:** `src/app/globals.css`

- `.theme-toggle-btn` — icon button with hover bg
- `.theme-toggle-icon` — centered icon container

### 1.3 Add Toast styles

**File:** `src/app/globals.css`

- `.toast-container` — fixed top-right, z-50, flex-col gap
- `.toast-item` — rounded-xl, shadow-lg, padding, max-width 380px, slide-in animation
- `.toast-item.is-success` / `.is-error` / `.is-warning` / `.is-info` — color variants
- `.toast-progress` — bottom progress bar that shrinks

### 1.4 Add ShortcutHelp modal styles

**File:** `src/app/globals.css`

- `.shortcut-modal-backdrop` — fixed inset, bg-black/50, backdrop-blur
- `.shortcut-modal` — centered card, max-width 480px
- `.shortcut-table` — grid layout for shortcut rows
- `.shortcut-kbd` — keyboard key styling (small rounded bg)

### 1.5 Add mobile-specific styles

**File:** `src/app/globals.css`

- `.mobile-menu-btn` — hamburger button (already defined but verify)
- `.sidebar-backdrop` — overlay backdrop for mobile sidebar (already defined but verify)
- Ensure `.app-sidebar-wrapper` uses `transform: translateX()` for slide-in on mobile

### 1.6 Add scroll-to-bottom button styles

**File:** `src/app/globals.css`

- `.scroll-bottom-btn` — floating circle button at bottom-center with arrow icon, fade-in animation

---

## Phase 2: page.tsx Refactor — Use All New Components

### 2.1 Replace inline input with InputArea component

**File:** `src/app/page.tsx`

- Remove the inline `<input>` and `<button>` JSX in both welcome and chat sections
- Use `<InputArea>` component with proper props: `value`, `onChange`, `onSend`, `isLoading`, `isStreaming`, `onStop`, `placeholder`
- Add `isStreaming` state tracking
- Add `handleStopGeneration` that aborts the fetch

### 2.2 Integrate MessageActions on hover

**File:** `src/app/page.tsx`

- Wrap each assistant message bubble in a container that shows `<MessageActions>` on hover
- Pass `content`, `onRegenerate`, `onFeedback` props
- Track feedback state per message (Map<id, 'up' | 'down' | null>)

### 2.3 Add ThemeToggle to header

**File:** `src/app/page.tsx`

- Import and render `<ThemeToggle>` in the header area alongside LanguageSwitcher

### 2.4 Wrap with ErrorBoundary

**File:** `src/app/page.tsx`

- Wrap the main content area with `<ErrorBoundary>` component

### 2.5 Add ToastProvider and show toasts

**File:** `src/app/page.tsx`

- Use `useToast()` to show success/error toasts on:
  - Message copied ("Copied to clipboard")
  - Message sent error
  - Chat exported

### 2.6 Add keyboard shortcut listener

**File:** `src/app/page.tsx`

- `Ctrl+B` — toggle sidebar
- `Ctrl+N` — new chat (clear messages + currentChat)
- `Ctrl+/` — show ShortcutHelp modal
- `Ctrl+Enter` — send message
- `Escape` — close sidebar on mobile, blur input

### 2.7 Mobile: add hamburger menu + backdrop

**File:** `src/app/page.tsx`

- Add hamburger button (visible on mobile only via CSS)
- Add backdrop overlay that appears when sidebar is open on mobile
- Close sidebar on backdrop tap
- Close sidebar when a chat is selected

---

## Phase 3: GSAP Animation Integration — Make It Premium

### 3.1 Message bubble entrance animations

**File:** `src/app/page.tsx`

- Each new message animates in with `gsap.from()`:
  - User messages: slide in from right → `x: 30, opacity: 0`
  - Assistant messages: slide in from left → `x: -20, opacity: 0`
- Use `useRef` array or callback refs to target new messages
- Use `gsap.context()` for cleanup

### 3.2 Send button micro-interaction

**File:** `src/components/chat/InputArea.tsx` (modify)

- On click: `gsap.to()` scale down to 0.9, then spring back to 1
- Arrow icon rotates 45deg briefly
- On hover: subtle scale up 1.05

### 3.3 Sidebar toggle animation

**File:** `src/components/ui/Sidebar.tsx` (modify)

- Replace CSS transition with GSAP `to()` for smoother width animation
- Toggle icon rotates 180deg with elastic easing
- Chat items stagger in from left when sidebar opens

### 3.4 Sidebar chat item hover animation

**File:** `src/components/ui/Sidebar.tsx` (modify)

- On hover: background slides in from left with GSAP
- Active chat: accent bar on left edge slides in (already has dot, enhance to bar)
- Delete button scales in on hover (GSAP from 0.6 scale)

### 3.5 Loading dots — GSAP timeline

**File:** `src/app/page.tsx`

- Replace CSS pulse animation with GSAP timeline
- 3 dots bounce in sequence: `y: -6`, stagger 0.2s, repeat
- More organic feel than CSS keyframes

### 3.6 Input focus glow animation

**File:** `src/app/page.tsx` or via CSS

- On input focus: subtle border glow with GSAP `to()` on box-shadow
- On blur: glow fades out
- (Alternative: pure CSS `transition` on `box-shadow`)

### 3.7 Scroll-to-bottom button animation

**File:** `src/app/page.tsx`

- Button fades in with GSAP when user scrolls up > 150px
- Pulse animation to draw attention
- Smooth scroll on click

### 3.8 Welcome empty state — enhanced

**File:** `src/app/page.tsx`

- Add floating animated math symbols (+, -, ×, ÷, =, π, √) using GSAP
- Each symbol floats with random subtle movement
- Add a subtle gradient orb that slowly moves in the background (CSS animation + GSAP)

### 3.9 Page transition between auth and main

**File:** Wrap the app with `PageTransition`

- When navigating between login/signup and main page, fade + slide transition
- Use GSAP timeline: old page out → new page in

---

## Phase 4: Sidebar UX Overhaul

### 4.1 GSAP sidebar open/close

**File:** `src/components/ui/Sidebar.tsx`

- Replace CSS `transition: width` with GSAP `to()` for sidebar expand/collapse
- Use `power3.inOut` easing for premium feel
- Width: 280px ↔ 0px

### 4.2 Context menu on right-click

**File:** `src/components/ui/Sidebar.tsx`

- Create context menu component (or inline logic)
- Options: Rename, Pin to top, Archive, Delete
- GSAP: menu scales in from cursor position
- Position calculation based on click coordinates

### 4.3 User section at bottom

**File:** `src/components/ui/Sidebar.tsx`

- Replace footer text with user avatar + name + settings gear
- If not authenticated: show "Sign In" button
- Avatar: initials fallback circle
- Click avatar → dropdown: Settings, Keyboard Shortcuts, Logout
- GSAP: dropdown scales in from bottom-right corner

### 4.4 Chat list item enhancements

**File:** `src/components/ui/Sidebar.tsx`

- Pinned chats section at top (if any pins exist)
- Pin icon on hover for each chat item
- Archive section (collapsible)
- Smooth delete animation: item shrinks + fades out via GSAP

---

## Phase 5: ChatContext Refactor — API-Backed Data

### 5.1 Remove hardcoded demo data

**File:** `src/contexts/ChatContext.tsx`

- Initialize `chatHistory` as empty array `[]`
- Add `isLoading` and `error` states

### 5.2 Add API methods to ChatContext

**File:** `src/contexts/ChatContext.tsx`

- `fetchChats()` — GET `/api/chats`, called on mount
- `createChat(title, preview?)` — POST `/api/chats` + optimistic update
- `deleteChat(id)` — DELETE `/api/chats/[id]` + remove from state
- `renameChat(id, title)` — PATCH `/api/chats/[id]`
- `fetchMessages(chatId)` — GET `/api/chats/[id]` for messages
- `pinChat(id, pinned)` — PATCH for pin state
- `archiveChat(id, archived)` — PATCH for archive state

### 5.3 Wire up to page.tsx

**File:** `src/app/page.tsx`

- On mount: `fetchChats()` if authenticated
- When creating new chat: call `createChat()` via API
- When deleting: call `deleteChat()` via API
- Sidebar reads from API-backed chatHistory

---

## Phase 6: Performance Optimization

### 6.1 React memoization

**File:** `src/components/ui/Sidebar.tsx` (modify)

- Wrap `ChatItem` in `React.memo()`
- Memoize `filteredChats`, `chatGroups` with `useMemo` (already done)
- Add `useCallback` on handlers: `handleChatSelect`, `handleNewChat`, `onHover`

**File:** `src/app/page.tsx` (modify)

- Wrap message rendering in `React.memo()` for individual message items
- Extract `MessageBubble` as separate memoized component
- Memoize callback handlers

### 6.2 Dynamic imports

**File:** `src/components/ui/MarkdownRenderer.tsx` (modify)

- Dynamic import SyntaxHighlighter: `dynamic(() => import('react-syntax-highlighter'), { ssr: false })`
- Dynamic import KaTeX components if possible

**File:** `src/app/page.tsx` (modify)

- Dynamic import heavy components: `ShortcutHelp`, `ThemeToggle` if needed

### 6.3 CSS performance

**File:** `src/app/globals.css` (modify)

- Keep `content-visibility: auto` on `.chat-messages-list` (already there)
- Add `will-change: transform` on elements that GSAP animates (sidebar, message rows)
- Ensure `prefers-reduced-motion` disables all animations (already there)

### 6.4 Bundle optimization

**File:** `next.config.ts` (modify)

- Verify `optimizePackageImports` includes all heavy packages
- Add `react-syntax-highlighter/dist/esm/styles/prism` to optimizePackageImports if possible

---

## Phase 7: Middleware & API Polish

### 7.1 Create middleware.ts

**File:** `src/middleware.ts` (new if not exists)

- Auth guard: redirect unauthenticated users from `/settings` to `/login`
- Rate limiting on `/api/chat/message`: simple in-memory Map with sliding window (30 req/min per user)
- Return 429 with `Retry-After` header and JSON error
- CORS headers on API routes

### 7.2 ChatContext API wiring

**File:** `src/lib/db/chats.ts` — verify all functions work
**File:** `src/lib/db/messages.ts` — verify all functions work

- Test: create chat, add messages, fetch chat list, delete chat
- Ensure proper error handling in API routes

---

## Phase 8: Settings Page

### 8.1 Create settings page

**File:** `src/app/(dashboard)/settings/page.tsx` (new)
**File:** `src/app/(dashboard)/layout.tsx` (new)

- Sidebar navigation: General, Appearance, Account, Data
- **General**: Preferred language (dropdown), math level (radio cards)
- **Appearance**: Theme toggle (already in ThemeToggle), font size (small/medium/large), message density (compact/comfortable), animations toggle
- **Account**: Name (editable), email (read-only), change password (old + new + confirm)
- **Data**: Export all chats (downloads a .zip or .md), delete account (double confirm dialog)

### 8.2 Settings API routes

**File:** `src/app/api/settings/route.ts` (new)

- GET: return user preferences
- PATCH: update preferences (theme, font_size, message_density, animations_enabled)

**File:** `src/app/api/settings/password/route.ts` (new)

- PATCH: change password (verify old, set new)

### 8.3 Preferences context

**File:** `src/contexts/PreferencesContext.tsx` (new)

- State: theme, fontSize, messageDensity, animationsEnabled
- Persist to DB for logged-in users, localStorage for guests
- Sync across tabs via `storage` event listener

---

## Phase 9: Visual Delight — Eye Candy Features

### 9.1 Floating math particles on welcome screen

**File:** `src/components/ui/MathParticles.tsx` (new)

- Canvas-based or SVG-based floating math symbols
- Symbols: +, -, ×, ÷, =, π, √, ∑, ∫, ∞, α, β, θ
- GSAP: each particle has random position, duration, and drift
- Gentle opacity (0.1-0.3) so they don't distract
- Only on welcome/empty state

### 9.2 Typing cursor during streaming

**File:** `src/app/page.tsx`

- Add a blinking `|` cursor at the end of streaming text
- CSS animation: blinking 1s step-end infinite
- Remove cursor when streaming ends

### 9.3 Glassmorphism on input card

**File:** `src/app/globals.css`

- Add subtle glass effect to `.welcome-input-card` and `.chat-input-card`:
  ```css
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  ```
- Dark mode: `rgba(26, 26, 26, 0.8)`

### 9.4 Success/failure micro-animations

**File:** `src/app/page.tsx` and `src/contexts/ToastContext.tsx`

- Toast entrance: slides in from right with bounce easing
- Toast exit: slides out to right, fades
- Success checkmark: draws itself with SVG stroke-dasharray animation
- Error: gentle horizontal shake on the toast item

### 9.5 Smooth number transitions

**File:** Use `AnimatedCounter` component

- Show animated message count in sidebar footer
- Animate from 0 to N when chat list loads

### 9.6 Hover card previews

**File:** `src/components/ui/Sidebar.tsx`

- On long hover over sidebar chat item: show preview card with first 3 lines of the conversation
- GSAP: card fades in + slides up slightly

### 9.7 Dark mode transition

**File:** `src/app/globals.css`

- Add smooth transition on `html` for `background-color` and `color`
  ```css
  html {
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  ```

---

## Phase 10: Mobile Excellence

### 10.1 Swipe-to-close sidebar

**File:** `src/components/ui/Sidebar.tsx`

- Add touch event handlers: `touchstart`, `touchmove`, `touchend`
- If swipe right > 80px: close sidebar with GSAP animation
- GSAP: sidebar slides out, backdrop fades simultaneously

### 10.2 Pull-to-refresh prevention

**File:** `src/app/page.tsx`

- Add `overscroll-behavior: contain` on chat messages area (via CSS)
- Prevent accidental page refresh on mobile

### 10.3 Safe area handling

**File:** `src/app/globals.css` (verify)

- Chat input bar: `padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px))`
- Auth pages: `padding: env(safe-area-inset-top) var(--space-4) env(safe-area-inset-bottom)`

### 10.4 Touch-friendly tap targets

**File:** Globally verify

- All interactive elements: minimum 44x44px tap target (iOS HIG)
- Send button, sidebar toggle, language switcher, theme toggle
- Increase padding on mobile via media queries

### 10.5 Virtual keyboard handling

**File:** `src/app/page.tsx`

- On mobile, when keyboard opens: scroll to bottom of messages
- Use `visualViewport` API to detect keyboard
- Prevent input from being hidden behind keyboard

---

## Phase 11: Advanced Features

### 11.1 Keyboard shortcuts registry

**File:** `src/lib/shortcuts.ts` (new)

- Central shortcut registry with key combo → handler mapping
- `useEffect` keyboard listener in a `useShortcuts()` hook
- Shortcuts: `Ctrl+K` (search), `Ctrl+B` (sidebar), `Ctrl+N` (new chat), `Ctrl+Enter` (send), `Escape` (close modals), `Ctrl+/` (help)

### 11.2 Math equation enhancements

**File:** `src/components/ui/MarkdownRenderer.tsx` (modify)

- Wrap KaTeX blocks with click handler to copy LaTeX source
- Show toast "LaTeX copied!"
- Error boundaries around KaTeX blocks (render raw text on failure)

### 11.3 Share functionality

**File:** `src/app/api/share/route.ts` (new)

- POST: create share link with a token
- Share token stored in a `shared_chats` table or in chat_sessions with a `share_token` column

**File:** `src/app/share/[token]/page.tsx` (new)

- Public read-only chat view (no auth required)
- Renders messages with KaTeX
- "Try AI Math Tutor yourself" CTA button at bottom
- SEO metadata per shared page

### 11.4 Chat export integration

**File:** `src/app/page.tsx` (modify)

- Add export button in chat header or message actions area
- Dropdown: Export as Markdown, Export as Plain Text
- Uses `src/lib/export.ts` functions
- Triggers browser download

---

## Phase 12: SEO & Accessibility Final Pass

### 12.1 Semantic HTML audit

**Files:** `src/app/page.tsx`, `src/components/ui/Sidebar.tsx`, `src/app/layout.tsx`

- Ensure `<main>`, `<nav>`, `<article>` tags are used correctly
- Proper heading hierarchy (h1 → h2 → h3, never skip)
- Add `aria-label` to all icon-only buttons
- Add `role="navigation"` to sidebar, `role="main"` to chat area
- Add `aria-live="polite"` on streaming message container
- Tab index management for keyboard navigation

### 12.2 Open Graph image

**File:** `src/app/layout.tsx` (modify)

- Add `og:image` and `twitter:image` metadata (generate a simple math-themed SVG/PNG)
- Or create a simple API route that generates an OG image

### 12.3 Canonical URLs

**File:** `src/app/layout.tsx` (modify)

- Add `alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL }`

---

## Phase 13: Final Polish & Verification

### 13.1 Build verification

- `npm run build` — must pass with zero errors
- `npm run lint` — must pass with zero warnings
- All TypeScript types must be strict (no `any` unless necessary)

### 13.2 Visual QA checklist

- [ ] Welcome screen: floating particles, GSAP staggered entrance, glassmorphism input
- [ ] Messages: GSAP slide-in animations, hover reveals actions, timestamps
- [ ] Streaming: blinking cursor, smart scroll, stop button
- [ ] Sidebar: smooth GSAP open/close, context menu, user section, pin/archive
- [ ] Mobile: hamburger menu, swipe-to-close, backdrop overlay, safe areas
- [ ] Theme: light/dark/system toggle with no FOUC, smooth color transition
- [ ] Auth: login/signup pages with GSAP animations, multi-step signup
- [ ] Settings: full page with all sections
- [ ] Performance: 60fps animations, no layout shifts, lazy-loaded heavy components
- [ ] Accessibility: keyboard navigation, screen reader support, focus indicators

### 13.3 Functional QA checklist

- [ ] Signup → login → chat → logout flow
- [ ] DeepSeek V4 Flash streaming works
- [ ] Chat history persists across page refresh (API-backed)
- [ ] Rate limiting: 30+ requests → 429
- [ ] Export: downloads valid .md and .txt files
- [ ] Share: creates working share link
- [ ] Keyboard shortcuts: all functional
- [ ] Mobile: sidebar overlay, touch gestures working

---

## Files Summary

### New files (~10)
| File | Purpose |
|------|---------|
| `src/middleware.ts` | Auth guard + rate limiting |
| `src/lib/shortcuts.ts` | Keyboard shortcut registry |
| `src/components/ui/MathParticles.tsx` | Floating math symbol particles |
| `src/app/(dashboard)/settings/page.tsx` | Settings page |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout with sidebar nav |
| `src/app/api/settings/route.ts` | Settings GET/PATCH API |
| `src/app/api/settings/password/route.ts` | Password change API |
| `src/app/api/share/route.ts` | Share chat API |
| `src/app/share/[token]/page.tsx` | Shared chat view |
| `src/contexts/PreferencesContext.tsx` | User preferences state |

### Modified files (~12)
| File | Changes |
|------|---------|
| `src/app/page.tsx` | **Major refactor**: use InputArea/MessageActions/ThemeToggle/ErrorBoundary/ToastContext, GSAP message animations, mobile menu+backdrop, keyboard shortcuts, smart scroll, streaming cursor, welcome particles, glassmorphism |
| `src/app/globals.css` | Add styles for InputArea, ThemeToggle, Toast, ShortcutHelp, scroll-to-bottom button, glassmorphism, dark mode transition |
| `src/components/ui/Sidebar.tsx` | GSAP animations, context menu, user section, pin/archive, mobile swipe, enhanced chat items |
| `src/components/chat/InputArea.tsx` | GSAP send button micro-interaction |
| `src/contexts/ChatContext.tsx` | Remove demo data, add API methods, loading/error states |
| `src/components/ui/MarkdownRenderer.tsx` | Dynamic imports, click-to-copy LaTeX |
| `src/app/layout.tsx` | Add ToastProvider, PreferencesProvider, OG image, canonical URL |
| `next.config.ts` | Verify optimizePackageImports |
| `src/components/ui/LanguageSwitcher.tsx` | Keyboard shortcut integration |
| `src/app/api/chat/message/route.ts` | Rate limit headers, better error handling |
| `src/lib/db/chats.ts` | Add pin/archive fields if not present |
| `src/lib/db/messages.ts` | Verify query functions |

---

## Assumptions & Decisions

1. **GSAP for all animations** — CSS transitions only for simple things (hover states, color changes). GSAP for anything that moves.
2. **No new dependencies** — All eye candy (particles, glassmorphism) implemented with existing tools (GSAP, CSS, SVG).
3. **Mobile-first** — Base styles target mobile; `@media (min-width: 769px)` adds desktop features.
4. **60fps target** — All GSAP animations use `will-change` sparingly, `gsap.context()` for cleanup, `prefers-reduced-motion` respected.
5. **Single tier, no monetization** — No payment system, single model `deepseek-v4-flash`.
6. **Rate limiting: in-memory Map** — Simple sliding window, sufficient for single-server deployment.
7. **Settings page accessible only when logged in** — Middleware redirects unauthenticated users.

## Verification

1. `npm run build` — zero errors
2. `npm run lint` — zero errors
3. Visual: open app → see beautiful welcome with floating particles, type a message, see smooth GSAP animations
4. Mobile: open on phone → hamburger menu works, swipe sidebar, keyboard doesn't break layout
5. Theme: toggle light/dark/system, no FOUC, smooth transitions
6. Auth: signup (3 steps with animations) → login → chat persists → logout
7. Performance: Lighthouse score > 90 on mobile and desktop
8. Keyboard: Ctrl+B, Ctrl+N, Ctrl+Enter, Ctrl+/, Escape all work
9. Streaming: blinking cursor, smart scroll, stop button works
10. Export: downloads chat as .md and .txt