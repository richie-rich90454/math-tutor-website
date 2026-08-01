# MathTutor AI - Legacy Client (IE6-compatible)

An IE6-compatible frontend for the MathTutor AI platform. It provides the same
functionality as the modern Next.js client, with a UI that works in legacy
browsers (Internet Explorer 6 and up).

## Stack

- jQuery 1.12.4 (vendored in `js/`) - AJAX and basic DOM manipulation only
- `json2.js` (vendored in `js/`) - JSON polyfill for legacy browsers
- Plain HTML tables + CSS (`css/style.css`) - no CSS3/flexbox/grid
- ES3-compatible JavaScript (no `fetch`, no `Promise`, no arrow functions)

## Security Rules

This client is built against a very old version of jQuery (1.12.4) which has
known vulnerabilities. Strict rules are followed:

- **Never** insert user-supplied or API-returned data via `.html()`. All
  dynamic content is inserted with `.text()` or manually HTML-escaped via
  `MathTutor.escapeHtml()` before any `innerHTML` assignment.
- Message bodies are rendered with `MathTutor.renderMarkdownSafe()`, which
  HTML-escapes first, then applies a tiny safe subset (headings, bold, code).
  LaTeX delimiters are preserved as plain text.
- All POST bodies use `JSON.stringify`.
- No `$.getScript`, `$.load` with untrusted URLs, or client-side template
  evaluation.
- No secrets or API keys are embedded in this client. Configuration comes
  from `js/config.js` (`API_BASE_URL`, empty = same origin).
- All inputs and responses are treated as potentially malicious.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Main chat interface (sidebar, history, streaming chat) |
| `login.html` | Sign in |
| `signup.html` | Create account |
| `progress.html` | Progress stats, topics, activity heatmap |
| `settings.html` | Account, theme, language |

## Configuration

The legacy client is served by the Spring Boot backend at `/legacy/**`
(same origin, so IE6 cookies work without CORS). The static directory is
configurable:

```
LEGACY_STATIC_DIR=../frontend-legacy
```

Override `window.API_BASE_URL` in `js/config.js` before `common.js` loads if
the client is hosted separately from the backend.

## Language Support

All 12 languages (en, zh-hans, zh-hant, mn-cyrl, mn-mong, bo, es, fr, de, ja,
ar, he) with RTL support for Arabic and Hebrew. Translations are generated from
`src/lib/translations.ts` into `js/i18n.js`. Re-generate with:

```
node scripts/generate-legacy-i18n.js
```

## API Endpoints Used

Same API surface as the modern client:

- POST `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/chat/message` (streaming), `/api/chat/image` (streaming)
- GET/POST `/api/chats`, GET/PATCH/DELETE `/api/chats/{id}`, `?q=` search
- GET `/api/progress`
