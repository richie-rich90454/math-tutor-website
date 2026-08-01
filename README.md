# MathTutor AI

AI-powered math education platform that adapts to students' cultural backgrounds and native languages. This interactive tutor provides personalized math instruction with real-time chat, multi-language support, and culturally relevant examples.

> **Migration status:** This project is currently a monolithic Next.js application. It is being migrated to a Spring Boot backend with two independent frontends (a modern Next.js client and an IE6-compatible legacy client). See the migration plan for details.

## Features

- **AI-Powered Tutoring**: Real-time streaming chat with an OpenAI-compatible API (DeepSeek)
- **Multi-Language Support**: English, Simplified/Traditional Chinese, Mongolian (Cyrillic & script), Tibetan, Spanish, French, German, Japanese, Arabic, Hebrew
- **Subject Coverage**: Arithmetic, algebra, geometry, calculus, trigonometry, statistics, and more
- **Personalized Learning**: Adaptive explanations based on student level
- **Interactive Chat**: Streamed responses with markdown and LaTeX rendering
- **Image Analysis**: Attach a photo of a math problem for AI analysis
- **Modern UI**: Clean, responsive interface with Tailwind CSS and GSAP animations
- **Session Management**: Save, resume, rename, pin, search, and delete chat conversations
- **Progress Tracking**: Built-in analytics for learning progress
- **Authentication**: Email/password sign-up and sign-in with JWT-based sessions
- **Dark/Light Theme**: System-aware theme with manual override

## Architecture (current)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐    │
│  │   Pages     │  │ Components  │  │   Context/State   │    │
│  │ (App Router)│  │  (React 19) │  │   (React Hooks)   │    │
│  └─────────────┘  └─────────────┘  └───────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Backend API (Next.js API Routes)              │
│  • /api/auth/{login,signup,logout,me}                       │
│  • /api/chat/message (streaming)                            │
│  • /api/chat/image   (vision analysis, streaming)           │
│  • /api/chats, /api/chats/[id]                              │
│  • /api/progress                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐    │
│  │   OpenAI-   │  │  SQLite          │  │   (Hosting)  │    │
│  │  compatible │  │  (better-sqlite3)│  │              │    │
│  │  API        │  │  local file DB   │  │              │    │
│  └─────────────┘  └──────────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend Framework**: Next.js 16 (App Router) with TypeScript
- **UI Library**: React 19 with Tailwind CSS
- **Backend**: Next.js API Routes (Node runtime)
- **AI Integration**: OpenAI-compatible API (DeepSeek), streaming via SSE
- **Database**: SQLite via better-sqlite3, WAL mode, file at `./data/math-tutor.db`
- **Auth**: Custom JWT (HS256) + sessions table; PBKDF2-SHA256 password hashing
- **Code Quality**: ESLint, TypeScript, Vitest

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- An OpenAI-compatible API key (for AI functionality)

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/richie-rich90454/math-tutor-website.git
    cd math-tutor-website
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**

    ```bash
    cp .env.example .env
    ```

    Edit `.env` and add your API key:

    ```
    OPENAI_COMPATIBLE_API_KEY=your_api_key_here
    OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com
    OPENAI_COMPATIBLE_MODEL=deepseek-v4-flash
    ```

4. **Run the development server**

    ```bash
    npm run dev
    ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable                        | Description                                | Required | Default                     |
| ------------------------------- | ------------------------------------------ | -------- | --------------------------- |
| `OPENAI_COMPATIBLE_API_KEY`     | Your OpenAI-compatible API key             | Yes      | -                           |
| `OPENAI_COMPATIBLE_BASE_URL`    | OpenAI-compatible API base URL             | No       | `https://api.deepseek.com`  |
| `OPENAI_COMPATIBLE_MODEL`       | Model to use                               | No       | `deepseek-v4-flash`         |
| `OPENAI_COMPATIBLE_VISION_MODEL`| Vision-capable model for image analysis    | No       | falls back to MODEL         |
| `SESSION_SECRET`                | JWT signing secret (>= 256 bits)           | Yes      | -                           |
| `DATABASE_PATH`                 | Path to the SQLite database file           | No       | `./data/math-tutor.db`      |
| `NEXT_PUBLIC_SITE_URL`          | Public URL of the application              | No       | `https://math-tutor.ai`     |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console token         | No       | -                           |

## API Documentation

All endpoints require authentication (except `POST /api/auth/login` and `POST /api/auth/signup`). Authentication uses an `HttpOnly` cookie named `session_token`.

### Auth

| Method | Endpoint                  | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| POST   | `/api/auth/signup`        | Create an account                    |
| POST   | `/api/auth/login`         | Sign in                              |
| POST   | `/api/auth/logout`        | Sign out / revoke session            |
| GET    | `/api/auth/me`            | Get the current session user         |

**Request Body (signup):**

```json
{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "super-secret-password"
}
```

**Request Body (login):**

```json
{
    "email": "jane@example.com",
    "password": "super-secret-password",
    "remember": true
}
```

### Chat Endpoint

**POST** `/api/chat/message`

Send a message to the AI math tutor and receive a streamed response.

**Request Body:**

```json
{
    "message": "Explain the Pythagorean theorem",
    "preferredLanguage": "en",
    "chatId": null
}
```

**Parameters:**

- `message` (string): The user's question or message (1-4000 chars)
- `preferredLanguage` (string): Language code (e.g. `en`, `zh-hans`, `mn-cyrl`)
- `chatId` (string | null): Existing chat to continue, or `null` for a new chat

**Response:**

- Streamed plain-text response with markdown and LaTeX formatting
- Content-Type: `text/plain; charset=utf-8`
- Header `X-Chat-Id`: the active chat id (new chats return a freshly generated id)

### Image Chat Endpoint

**POST** `/api/chat/image`

Send a message with a base64-encoded image for AI analysis.

**Request Body:**

```json
{
    "image": "data:image/png;base64,...",
    "mimeType": "image/png",
    "message": "Solve this problem",
    "preferredLanguage": "en",
    "chatId": null
}
```

### Chats Endpoint

| Method | Endpoint         | Description                               |
| ------ | ---------------- | ----------------------------------------- |
| GET    | `/api/chats`     | List the user's chats (`?q=` for search)  |
| POST   | `/api/chats`     | Create a chat manually                    |
| GET    | `/api/chats/:id` | Get a chat with its messages              |
| PATCH  | `/api/chats/:id` | Update title/preview/topic/pin/archive    |
| DELETE | `/api/chats/:id` | Delete a chat                             |

### Progress Endpoint

| Method | Endpoint      | Description                             |
| ------ | ------------- | --------------------------------------- |
| GET    | `/api/progress` | Aggregated user stats, topics, streaks |

## Development

### Project Structure

```
math-tutor-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (auth, chat, chats, progress)
│   │   ├── (auth)/            # Login and signup pages
│   │   ├── progress/          # Progress page
│   │   ├── settings/          # Settings page
│   │   ├── topics/[topic]/    # Topic pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home (chat) page
│   ├── components/           # React components
│   │   ├── chat/            # Chat interface components
│   │   ├── sidebar/         # Sidebar components
│   │   └── ui/              # UI components
│   ├── contexts/            # React contexts
│   │   ├── context_json/    # Mongolian/Tibetan math concept data
│   ├── hooks/               # Custom hooks (useChatMessages, useChatUI, useSidebar)
│   ├── lib/                 # Utility libraries
│   │   ├── ai/              # AI client, prompts, context building
│   │   ├── db/              # SQLite data access (users, sessions, chats, messages, usage)
│   │   └── ...
│   └── types/               # TypeScript type definitions
├── data/                     # SQLite database (gitignored)
├── public/                   # Static assets
└── ...config files
```

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run Vitest unit tests

### Adding New Languages

1. Add a system prompt file in `src/app/api/chat/prompts/` named `prompt-<code>.txt`
2. Register the file in `LANGUAGE_FILE_MAP` in `src/lib/ai/prompts.ts`
3. Add translation keys to `src/lib/translations.ts`
4. Add the language to the `languages` array in `src/contexts/LanguageContext.tsx`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

Note: the SQLite database file is local to the server instance and is not shared across serverless function invocations. For production scale, use a managed database or a persistent volume.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com) for the AI API
- [DeepSeek](https://deepseek.com) for the OpenAI-compatible API used by default
- [Next.js](https://nextjs.org) for the React framework
- [Tailwind CSS](https://tailwindcss.com) for styling utilities

## Support

For questions, issues, or feature requests:

- Open an issue on [GitHub](https://github.com/richie-rich90454/math-tutor-website/issues)
- Check the [discussions](https://github.com/richie-rich90454/math-tutor-website/discussions) page

---

**Happy Learning!**
