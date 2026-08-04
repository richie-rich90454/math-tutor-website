# API Contract

Reference for the HTTP API shared between the Next.js client, the legacy IE6 client, and the
Spring Boot backend. Client-side wire types live in `src/contracts/chat.ts`; the backend Java
records mirror them (e.g. `ChatMessageRequest`, `ChatRepository.ChatRecord`). Keep both in sync
when changing a shape.

All endpoints are same-origin from the browser: Next.js `beforeFiles` rewrites proxy
`/api/*` to the backend, and streaming routes are Next route handlers that pipe the backend
stream. Legacy clients talk to the backend directly over `/api/*`.

## Auth

| Method | Path                            | Body / Notes                                                   |
| ------ | ------------------------------- | -------------------------------------------------------------- |
| POST   | `/api/auth/signup`              | `{ name, email, password, math_level, preferred_language }`    |
| POST   | `/api/auth/login`               | `{ email, password, remember }` → sets `session_token` cookie  |
| POST   | `/api/auth/logout`              |                                                                |
| GET    | `/api/auth/me`                  | current user (id, name, email, math_level, preferred_language) |
| POST   | `/api/auth/guest`               | create a guest session                                         |
| POST   | `/api/auth/change-password`     | `{ current_password, new_password }`                           |
| GET    | `/api/auth/sessions`            | active sessions                                                |
| POST   | `/api/auth/sessions/revoke-all` | sign out everywhere else                                       |

## Chat

| Method | Path                  | Notes                                                                                                                                                       |
| ------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/chat/message`   | **Streaming** (`text/plain`). Body `{ message, chatId?, preferredLanguage?, bypassCache? }`. Headers: `X-Chat-Id`, `X-Cache: hit\|miss`, `X-Quota-Warning`. |
| POST   | `/api/chat/image`     | Streaming vision turn. Body `{ image, mimeType, message, preferredLanguage, chatId? }`.                                                                     |
| POST   | `/api/chat/translate` | Translate a block.                                                                                                                                          |

### Streaming response contract

- Response is chunked plain text; the client appends each chunk to the assistant message.
- `X-Cache: hit` means the answer came from the smart answer cache (exact or similar
  question within the scoped conversations). Clients tag the message "Asked before" and offer
  a **get fresh answer** action, which re-sends with `bypassCache: true`.
- The answer cache only reuses answers from the current conversation plus the user's 5 most
  recent conversations, and entries expire after 7 days. `shouldCache` skips trivial and
  highly specific (≥3 numeric tokens) questions and answers under 40 characters.

## Chats

| Method | Path                                 | Notes                                                               |
| ------ | ------------------------------------ | ------------------------------------------------------------------- |
| GET    | `/api/chats`                         | list, `{ chats: [...] }`, ordered `is_pinned DESC, updated_at DESC` |
| POST   | `/api/chats`                         | create                                                              |
| GET    | `/api/chats/{id}`                    | detail `{ id, title, messages: ApiMessage[] }`                      |
| PATCH  | `/api/chats/{id}`                    | update fields (title, preview, topic, is_pinned, is_archived)       |
| DELETE | `/api/chats/{id}`                    |                                                                     |
| GET    | `/api/chats?q=`                      | search                                                              |
| POST   | `/api/chats/{id}/messages/{mid}/pin` | `{ pinned: bool }`                                                  |

`ApiMessage` wire shape: `{ id, content, role, created_at, is_pinned? }`.

## Practice / Review / Sheets

| Method | Path                          | Notes                       |
| ------ | ----------------------------- | --------------------------- |
| GET    | `/api/problems?topic=&grade=` | practice problem            |
| POST   | `/api/problems/check`         | check an answer             |
| GET    | `/api/problem-of-day`         |                             |
| GET    | `/api/review`                 | due review items            |
| GET    | `/api/sheets?topic=`          | formula/glossary sheets     |
| POST   | `/api/study-plan`             | generate a 7-day study plan |

## Progress / Usage

| Method | Path            | Notes                                             |
| ------ | --------------- | ------------------------------------------------- |
| GET    | `/api/progress` | conversations, messages, streak, topics, activity |
| GET    | `/api/usage`    | today's token usage + cache hits + est. cost      |

## Culture

| Method | Path                  | Notes                 |
| ------ | --------------------- | --------------------- |
| GET    | `/api/culture/{lang}` | culture keyword packs |

## Health

| Method | Path          | Notes                                |
| ------ | ------------- | ------------------------------------ |
| GET    | `/api/health` | `{"status":"ok"}` (backend liveness) |

## Conventions

- Errors are JSON `{ "error": "message" }` (or `{ "error": ..., "issues": [...] }` for
  validation).
- Session is authenticated via the `session_token` cookie (or `Authorization: Bearer`).
- Rate-limit headers: `X-RateLimit-Limit/Remaining/Reset`.
- Streaming responses are never gzip-compressed (`text/plain` is excluded from backend
  compression) to keep incremental delivery working.
