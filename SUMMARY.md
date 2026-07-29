# Math Tutor Website — Summary

## Overview

Single-page AI math tutoring app (Next.js 16 App Router). Student types a problem, the app streams a step-by-step solution from DeepSeek (V3/R1), persists conversations in SQLite, and tracks topics covered. ~3000 lines of app code + 4000 lines of custom CSS.

---

## Tech Stack

| Layer       | Choice                                                  |
| ----------- | ------------------------------------------------------- |
| Runtime     | Node.js, Next.js 16.2.9 (Turbopack)                     |
| Language    | TypeScript 6.0                                          |
| Database    | SQLite via better-sqlite3 (synchronous)                 |
| AI          | DeepSeek via raw `fetch()` (OpenAI-compatible endpoint) |
| Auth        | Custom JWT (HMAC-SHA256) + session cookies, no NextAuth |
| Styling     | Custom CSS (globals.css, 4008 lines), no Tailwind       |
| Animations  | GSAP 3.15 + @gsap/react (heavy use)                     |
| Markdown    | react-markdown 10 + KaTeX + rehype/remark plugins       |
| Testing     | Jest 30 + ts-jest, 1 test file                          |
| Lint/Format | ESLint 9 + Prettier 3.8                                 |

---

## Architecture

**Routing**: App Router with `(auth)/` route group for login/signup, 15 API routes under `app/api/`.

**Data flow**: User input → `InputArea` → `page.tsx` `sendMessage()` → `POST /api/chat/message` → DB context assembly + DeepSeek streaming SSE → `ReadableStream` → client appends chunks to state → on complete, assistant message saved to SQLite.

**State**: 5 React Contexts (Auth, Chat, Language, Concept, Toast). No external state lib.

**Auth flow**: Login hashes password (PBKDF2-SHA256) → verifies against SQLite `users` table → creates session row + JWT → sets `session_token` httpOnly cookie. Middleware checks cookie on API routes.

**DB**: Single `data/math-tutor.db` file. Tables: `users`, `sessions`, `chats`, `messages`, `user_usage`. All queries are synchronous (blocking).

---

## Issues

### Critical

- **API key committed in `.env`** — live DeepSeek `sk-76d4…` is in the repo. Not in `.gitignore`. Rotate immediately.
- **`SESSION_SECRET` fallback** — `"dev-secret-change-in-production"` hardcoded in `auth.ts:3`. If unset in prod, tokens are trivially forgeable.
- **SQL injection in dynamic SQL** — `updateUser` and `updateChat` concatenate column names into queries. Typed keys limit surface but not safe.
- **better-sqlite3 is synchronous** — every DB call blocks the event loop. Under load, severe latency.
- **Rate limiter is in-memory** — resets on restart, doesn't scale across instances.

### High

- **page.tsx: 1078 lines** — chat logic, streaming, animations, keyboard shortcuts all in one file.
- **Sidebar.tsx: 999 lines** — search, pinning, context menus, rename, delete, date grouping, GSAP, avatar. Needs extraction.
- **translations.ts ~72KB** — 12 languages loaded fully for every user. Never lazy-loaded.
- **8 exportable components never imported** — `SlashCommandMenu`, `VirtualizedMessages`, `BottomSheet`, `AnimatedCounter`, `Sparkles`, `RippleEffect`, `MessageSkeleton`, `Skeleton`. All dead code.
- **~15 GSAP helpers never called** — `glitchText`, `typewriterText`, `parallaxScroll`, `staggerCards`, etc. Exported but imported only within `gsap.ts`.
- **14 `any` types** — `error: any`, `msg: any`, `e: any`, `event: any`, `props: any`, `values: any[]`.
- **No CSRF protection** — `SameSite=Lax` only.
- **No rate limiting on login/signup** — open to brute force.
- **openai npm package unused** — ~800KB dead weight. App uses raw `fetch()`.
- **sitemap.ts lists `/topics/:topic` routes** — no such pages exist (404).
- **No CI/CD** — no workflows, no Dockerfile.

### Medium

- **translations.ts always fully imported** — 72KB, 12 languages, no code splitting.
- **No loading state in Sidebar before auth resolves** — renders empty.
- **`extractTopic` keyword scoring weak** — matches "angle" for both geometry and trig.
- **`pbkdf2Sync` blocks event loop** — every login/signup.
- **`deleteUserSessions` on login without "remember me"** — logs out all devices.
- **`session_token` cookie missing `__Secure-` prefix** in production.
- **No bundle analysis** — no `@next/bundle-analyzer`.
- **Empty PostCSS config** — `plugins: []`.
- **`prettier-plugin-tailwindcss` installed but no Tailwind** — zero benefit.

### Low

- `ConceptContext.tsx` eagerly loads ~140 concepts on mount.
- Expired session rows accumulate in DB (no cleanup).
- `--fg-tertiary` referenced in CSS but never defined.
- No integration or E2E tests (only 1 unit test file).
- `^` version ranges in `package.json` — no lock on breaking upgrades.

---

## Testing

1 Jest test file (`__tests__/auth.test.ts`) covering 4 auth functions. Zero tests for: 15 API routes, 23 components, 5 contexts, 8 DB modules, stream parsing, rate limiting, chat send/regenerate, image upload. 0% coverage.

---

## Key Actions

1. Rotate leaked DeepSeek API key, add `.env` to `.gitignore`.
2. Remove `"dev-secret-change-in-production"` fallback, enforce `SESSION_SECRET`.
3. Delete 8 dead components + `openai` dep + `prettier-plugin-tailwindcss`.
4. Prune `gsap.ts` — remove ~15 unreferenced helpers.
5. Split `page.tsx` and `Sidebar.tsx` into smaller modules.
6. Lazy-load translations (dynamic `import()` per locale).
7. Fix 14 `any` types.
8. Add rate limiting to login/signup.
9. Replace synchronous `better-sqlite3` calls or add connection queue.
10. Fix SQL injection surface in `updateUser`/`updateChat` (use whitelist or switch to parameterized column queries).
11. Set up CI/CD (GitHub Actions + lint + typecheck + test).
12. Add `/topics/` routes or remove from sitemap.
