# Operations & Runbook

How to run, deploy, and operate MathTutor AI. See `docs/api-contract.md` for the API
reference and the repo `README.md` for the architecture overview.

## Architecture

- **Modern client** — Next.js 16 + React 19 at repo root, port 3000. Same-origin proxy to the
  backend via `next.config.ts` rewrites; streaming chat routes pipe the backend stream.
- **Backend** — Spring Boot 4.1 + Java 25 + Maven + SQLite, `backend/`, port 8080.
- **Legacy client** — IE6-compatible jQuery (ES3) in `frontend-legacy/`, served by the backend
  at `/legacy/**`.

## Local development

```bash
npm install
npm run dev        # starts frontend (Turbopack) + backend together
npm run build      # production build (frontend + backend)
npm run test       # vitest + backend mvn test
npm run format     # oxfmt --write .
```

The npm frontend scripts regenerate the gitignored minified JSON copies
(`src/contexts/context_json_min/`) and, after an i18n edit, you must also run:

```bash
node scripts/generate-legacy-i18n.js
node scripts/minify-json.js
```

## Environment variables

Backend config lives in `backend/src/main/resources/application.properties` (gitignored); the
tracked template is `application.properties.example`. Key variables:

| Variable                                                   | Purpose                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `SESSION_SECRET`                                           | **Required.** Long random string for session/JWT signing.        |
| `DATABASE_PATH`                                            | SQLite file path (default `./data/math-tutor.db`).               |
| `OPENAI_COMPATIBLE_API_KEY`                                | LLM provider key.                                                |
| `OPENAI_COMPATIBLE_BASE_URL` / `MODEL` / `VISION_MODEL`    | Provider endpoints.                                              |
| `LEGACY_STATIC_DIR`                                        | Directory served as `/legacy/**` (default `../frontend-legacy`). |
| `APP_QUOTA_DAILY_TOKENS` / `SOFT_RATIO` / `MONTHLY_TOKENS` | Token quota.                                                     |
| `CORS_ALLOWED_ORIGINS`                                     | Allowed origins for browser access.                              |

## Health checks

- Backend liveness: `GET /api/health` → `{"status":"ok"}`.
- The modern client's availability is verified by a successful HTTP response on `/`.

## Answer cache behavior

- Reuses answers for the same or highly similar question within the user's current
  conversation plus their 5 most recent conversations.
- Entries expire after 7 days (`pruneExpired` runs on each store).
- Only generic concept questions are cached (`shouldCache` skips trivial and specific
  computations with ≥3 numeric tokens, and answers under 40 chars).
- Responses served from cache set `X-Cache: hit`; clients tag the message "Asked before" and
  offer a **get fresh answer** action that re-sends with `bypassCache: true`.

## Deploying

1. Build: `npm run build` (produces `.next/` and `backend/target/*.jar`).
2. Run the backend jar with `SESSION_SECRET` and `OPENAI_COMPATIBLE_API_KEY` set.
3. Run the frontend with `NEXT_PUBLIC_API_BASE_URL` unset (same-origin) or pointed at the
   backend; `next start` proxies `/api/*` to the backend.
4. The legacy client is served by the backend from `LEGACY_STATIC_DIR` — deploy
   `frontend-legacy/` alongside the jar.

## Troubleshooting

- **Legacy shows the wrong favicon/logo** — ensure `frontend-legacy/img/` contains
  `logo.png` + `favicon.png` and the pages link `/legacy/img/favicon.png`.
- **i18n keys out of sync** — run `node scripts/generate-legacy-i18n.js`; the
  `__tests__/translations.test.ts` contract test fails if any language pack misses keys.
- **Streaming chat appears buffered** — the backend compression excludes `text/plain`; if a
  reverse proxy gzips it, disable compression for `/api/chat/*`.
- **DB migration errors** — `backend/src/main/java/com/mathtutor/db/SchemaInitializer.java`
  applies idempotent migrations on boot; check `_migrations` for the applied versions.
