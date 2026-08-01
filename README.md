# MathTutor AI

AI-powered math education platform that adapts to students' cultural backgrounds and native languages. This interactive tutor provides personalized math instruction with real-time chat, multi-language support, and culturally relevant examples.

## Architecture

MathTutor AI has been migrated from a monolithic Next.js application into three independent components:

```
┌─────────────────────┐      ┌──────────────────────────────┐
│  Modern Next.js 16  │      │  Legacy IE6 Client          │
│  Client (React 19)  │      │  (jQuery 1.12.4, IE6-safe)  │
│  / (this repo root) │      │  /frontend-legacy           │
└──────────┬──────────┘      └──────────────┬───────────────┘
           │ browser API calls              │ same-origin /legacy/**
           ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Spring Boot 4.1 Backend                    │
│                 /backend (Maven, Java 25)                  │
│  • POST /api/auth/{signup,login,logout}  • GET /api/auth/me│
│  • POST /api/chat/message (streaming)                      │
│  • POST /api/chat/image   (vision, streaming)              │
│  • GET/POST /api/chats, GET/PATCH/DELETE /api/chats/{id}   │
│  • GET /api/progress                                       │
│  • GET /legacy/**   (serves the IE6 client static files)   │
└──────────────┬───────────────────────┬─────────────────────┘
               ▼                       ▼
┌───────────────────────┐  ┌──────────────────────────────┐
│  OpenAI-compatible AI │  │  SQLite (better-sqlite3 /    │
│  API (DeepSeek), SSE  │  │  xerial sqlite-jdbc)         │
└───────────────────────┘  └──────────────────────────────┘
```

### Components

| Component | Location | Stack | Port |
| --- | --- | --- | --- |
| Modern client | repository root | Next.js 16, React 19, Tailwind CSS, GSAP | 3000 |
| Legacy client | `frontend-legacy/` | jQuery 1.12.4, ES3, IE6-compatible | served by backend at `/legacy/**` |
| Backend | `backend/` | Spring Boot 4.1, Java 25, Maven, SQLite | 8080 |

The two frontends provide **identical functionality** (auth, streaming chat,
chat history, image analysis, progress, settings, 12 languages, RTL, export).
They differ only in the UI layer.

## Features

- **AI-Powered Tutoring**: Real-time streaming chat with an OpenAI-compatible API (DeepSeek)
- **Multi-Language Support**: English, Simplified/Traditional Chinese, Mongolian (Cyrillic & script), Tibetan, Spanish, French, German, Japanese, Arabic, Hebrew
- **Subject Coverage**: Arithmetic, algebra, geometry, calculus, trigonometry, statistics, and more
- **Interactive Chat**: Streamed responses with markdown and LaTeX rendering (modern); safe plain-text rendering (legacy)
- **Image Analysis**: Attach a photo of a math problem for AI analysis
- **Session Management**: Save, resume, rename, pin, search, and delete chat conversations
- **Progress Tracking**: Built-in analytics for learning progress
- **Authentication**: Email/password sign-up and sign-in with JWT-based sessions
- **Dark/Light Theme**: System-aware theme with manual override
- **IE6 Support**: Full-featured legacy client for old browsers

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Java 25 (JDK) and Maven 3.9+
- An OpenAI-compatible API key (for AI functionality)

### 1. Backend (Spring Boot)

```bash
cd backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
# set env vars (or edit application.properties placeholders)
export SESSION_SECRET="$(openssl rand -base64 32)"
export OPENAI_COMPATIBLE_API_KEY=your_api_key_here
mvn spring-boot:run
```

The backend listens on `http://localhost:8080` and also serves the legacy
client at `http://localhost:8080/legacy/`.

### 2. Modern Client (Next.js)

```bash
cd <repo root>
cp .env.example .env
# set NEXT_PUBLIC_API_BASE_URL to point at the backend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Legacy Client (IE6)

No build step. When the backend runs with the default
`LEGACY_STATIC_DIR=../frontend-legacy`, open:

[http://localhost:8080/legacy/](http://localhost:8080/legacy/)

The legacy client can also be served as static files by any web server; set
`API_BASE_URL` in `frontend-legacy/js/config.js` if the backend is hosted
separately. See `frontend-legacy/README.md` for details.

## Environment Variables

### Modern client (`.env`)

| Variable                        | Description                                | Required | Default                     |
| ------------------------------- | ------------------------------------------ | -------- | --------------------------- |
| `OPENAI_COMPATIBLE_API_KEY`     | AI API key (used by legacy Next.js routes) | No*      | -                           |
| `OPENAI_COMPATIBLE_BASE_URL`    | AI API base URL                            | No       | `https://api.deepseek.com`  |
| `OPENAI_COMPATIBLE_MODEL`       | Model to use                               | No       | `deepseek-v4-flash`         |
| `SESSION_SECRET`                | JWT signing secret (legacy routes)         | No*      | -                           |
| `DATABASE_PATH`                 | SQLite path (legacy routes)                | No       | `./data/math-tutor.db`      |
| `NEXT_PUBLIC_API_BASE_URL`      | Spring Boot backend URL                    | Yes      | empty (same origin)         |
| `NEXT_PUBLIC_SITE_URL`          | Public URL for SEO                         | No       | `https://math-tutor.ai`     |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console token         | No       | -                           |

\* Only required when `NEXT_PUBLIC_API_BASE_URL` is empty (client uses the
built-in Next.js API routes).

### Backend (`application.properties` / env)

| Variable                        | Description                                | Required | Default                     |
| ------------------------------- | ------------------------------------------ | -------- | --------------------------- |
| `SESSION_SECRET`                | JWT signing secret (>= 256 bits)           | Yes      | -                           |
| `OPENAI_COMPATIBLE_API_KEY`     | OpenAI-compatible API key                  | Yes      | -                           |
| `OPENAI_COMPATIBLE_BASE_URL`    | AI API base URL                            | No       | `https://api.deepseek.com`  |
| `OPENAI_COMPATIBLE_MODEL`       | Chat model                                 | No       | `deepseek-v4-flash`         |
| `OPENAI_COMPATIBLE_VISION_MODEL`| Vision model                               | No       | falls back to MODEL         |
| `DATABASE_PATH`                 | SQLite database file                       | No       | `./data/math-tutor.db`      |
| `SERVER_PORT`                   | HTTP port                                  | No       | `8080`                      |
| `CORS_ALLOWED_ORIGINS`          | Comma-separated allowed origins            | No       | `http://localhost:3000`     |
| `LEGACY_STATIC_DIR`             | Filesystem dir served at `/legacy/**`      | No       | `../frontend-legacy`        |
| `PROMPTS_CLASSPATH_DIR`         | Classpath dir with prompt-*.txt files      | No       | `prompts`                   |

## API Documentation

All endpoints require authentication (except `POST /api/auth/login` and
`POST /api/auth/signup`). Authentication uses an `HttpOnly` cookie named
`session_token`.

### Auth

| Method | Endpoint                  | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| POST   | `/api/auth/signup`        | Create an account                    |
| POST   | `/api/auth/login`         | Sign in                              |
| POST   | `/api/auth/logout`        | Sign out / revoke session            |
| GET    | `/api/auth/me`            | Get the current session user         |

### Chat

| Method | Endpoint          | Description                                   |
| ------ | ----------------- | --------------------------------------------- |
| POST   | `/api/chat/message` | Streamed AI response (`text/plain`, `X-Chat-Id`) |
| POST   | `/api/chat/image`   | Streamed vision response (base64 image)         |

### Chats

| Method | Endpoint         | Description                               |
| ------ | ---------------- | ----------------------------------------- |
| GET    | `/api/chats`     | List the user's chats (`?q=` for search)  |
| POST   | `/api/chats`     | Create a chat manually                    |
| GET    | `/api/chats/:id` | Get a chat with its messages              |
| PATCH  | `/api/chats/:id` | Update title/preview/topic/pin/archive    |
| DELETE | `/api/chats/:id` | Delete a chat                             |

### Progress

| Method | Endpoint      | Description                             |
| ------ | ------------- | --------------------------------------- |
| GET    | `/api/progress` | Aggregated stats, topics, streaks      |

## Project Structure

```
math-tutor-website/
├── backend/                 # Spring Boot 4.1 API (Java 25, Maven)
│   ├── src/main/java/com/mathtutor/
│   │   ├── controller/     # Auth, Chats, ChatMessage, ChatImage, Progress
│   │   ├── service/        # Business logic, AI client, rate limiting, prompts
│   │   ├── repo/           # SQLite data access
│   │   ├── security/       # JWT, password hashing, session resolution
│   │   ├── config/         # App properties, DB, web/CORS, schema init
│   │   ├── dto/            # Request records + validation
│   │   └── web/            # Global exception handling
│   └── src/main/resources/ # application.properties(.example), prompts/
├── frontend-legacy/         # IE6-compatible client (jQuery 1.12.4)
├── scripts/                 # Build helpers (legacy i18n generator)
├── src/                     # Modern Next.js 16 client
├── data/                    # SQLite databases (gitignored)
└── docs/                    # Migration analysis
```

## Development

### Backend

```bash
cd backend
mvn test          # run unit tests
mvn package       # build the boot jar
java -jar target/math-tutor-backend-1.0.0.jar
```

### Modern client

```bash
npm run dev       # dev server (Turbopack)
npm run build     # production build
npm run start     # production server
npm run lint      # ESLint
npm run typecheck # TypeScript type checking
npm run test      # Vitest unit tests
```

### Legacy client

No build step. Regenerate translations from the modern client with:

```bash
node scripts/generate-legacy-i18n.js
```

### Adding New Languages

1. Add a system prompt file in `backend/src/main/resources/prompts/` and
   `src/app/api/chat/prompts/` named `prompt-<code>.txt`
2. Register the file in `PromptService.LANGUAGE_FILE_MAP` and
   `src/lib/ai/prompts.ts`
3. Add translation keys to `src/lib/translations.ts`
4. Regenerate the legacy client translations (see above)
5. Add the language to the language list in both frontends

## Migration Notes

The migration from the monolithic Next.js app to the Spring Boot backend +
two frontends is documented in `docs/phase-0-analysis.md`. The modern client
retains the built-in Next.js API routes as a fallback when
`NEXT_PUBLIC_API_BASE_URL` is empty; when set, all API calls route to the
Spring Boot backend.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or feature requests:

- Open an issue on [GitHub](https://github.com/richie-rich90454/math-tutor-website/issues)

---

**Happy Learning!**
