# MathTutor AI

AI-powered math education platform that adapts to students' cultural backgrounds and native languages. This interactive tutor provides personalized math instruction with real-time chat, multi-language support, and culturally relevant examples.

## Features

- **AI-Powered Tutoring**: Real-time chat with OpenAI GPT models for instant math help
- **Multi-Language Support**: English and Chinese with cultural adaptation
- **Subject Coverage**: Arithmetic, algebra, geometry, calculus, and more
- **Personalized Learning**: Adaptive explanations based on student level
- **Interactive Chat**: Streamed responses with markdown and LaTeX rendering
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **Session Management**: Save and resume chat conversations
- **Progress Tracking**: Built-in analytics for learning progress

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐    │
│  │   Pages     │  │ Components  │  │   Context/State   │    │
│  │ (App Router)│  │  (React)    │  │   (React Hooks)   │    │
│  └─────────────┘  └─────────────┘  └───────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Next.js API Routes)            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              /api/chat/message (Edge Runtime)         │  │
│  │  • OpenAI API Integration                             │  │
│  │  • Streaming Responses                                │  │
│  │  • Multi-language Prompt Management                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐    │
│  │   OpenAI    │  │  Supabase   │  │     Vercel        │    │
│  │    API      │  │ (PostgreSQL)│  │   (Hosting)       │    │
│  └─────────────┘  └─────────────┘  └───────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router) with TypeScript
- **UI Library**: React 19 with Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **AI Integration**: OpenAI API (GPT models)
- **Database**: Supabase PostgreSQL (planned)
- **Authentication**: (To be implemented)
- **Deployment**: Vercel
- **Code Quality**: ESLint, TypeScript
- **Markdown Processing**: React Markdown with LaTeX support

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- OpenAI API key (for AI functionality)

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/richie-rich90454/math-tutor-website.git
    cd math-tutor-website
    ```

2. **Install dependencies**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3. **Set up environment variables**

    ```bash
    cp .env.local.example .env.local
    ```

    Edit `.env.local` and add your OpenAI API key:

    ```
    OPENAI_API_KEY=your_openai_api_key_here
    OPENAI_BASE_URL=https://api.openai.com/v1
    OPENAI_MODEL=gpt-4o-mini
    ```

4. **Run the development server**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

| Variable              | Description                   | Required | Default                     |
| --------------------- | ----------------------------- | -------- | --------------------------- |
| `OPENAI_API_KEY`      | Your OpenAI API key           | Yes      | -                           |
| `OPENAI_BASE_URL`     | OpenAI API base URL           | No       | `https://api.openai.com/v1` |
| `OPENAI_MODEL`        | OpenAI model to use           | No       | `gpt-4o-mini`               |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | No       | `http://localhost:3000`     |

## API Documentation

### Chat Endpoint

**POST** `/api/chat/message`

Send a message to the AI math tutor and receive a streamed response.

**Request Body:**

```json
{
    "message": "Explain the Pythagorean theorem",
    "preferredLanguage": "en"
}
```

**Parameters:**

- `message` (string): The user's question or message
- `preferredLanguage` (string): Language code (`en` for English, `zh` for Chinese)

**Response:**

- Streamed text response with markdown and LaTeX formatting
- Content-Type: `text/plain; charset=utf-8`

**Example Usage:**

```javascript
const response = await fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        message: "How do I solve quadratic equations?",
        preferredLanguage: "en",
    }),
});

// Read streamed response
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
}
```

## Development

### Project Structure

```
math-tutor-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── chat/         # Chat API endpoints
│   │   │       └── message/  # Main chat endpoint
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── chat/            # Chat interface components
│   │   └── ui/              # UI components
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utility libraries
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── ...config files
```

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Languages

1. Add translation keys to `src/lib/translations.ts`
2. Update `LanguageSwitcher` component
3. Add language-specific prompts in `src/app/api/chat/prompts/`

## Deployment

### Deploy to Vercel

The easiest way to deploy this application is using [Vercel](https://vercel.com):

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frichie-rich90454%2Fmath-tutor-website)

### Manual Deployment

1. Build the application:

    ```bash
    npm run build
    ```

2. Start the production server:
    ```bash
    npm run start
    ```

## Backend Logic Implementation Opportunities

### Current Backend Structure

- **Primary API**: `src/app/api/chat/message/route.ts` - Handles AI chat with streaming
- **Edge Runtime**: Optimized for low-latency responses
- **Error Handling**: Basic error handling for API failures

### Recommended Backend Extensions

1. **Database Integration** (`src/lib/db/` or `src/app/api/db/`)
    - Store user sessions and chat history
    - Implement Supabase/PostgreSQL with Prisma or Drizzle
    - Create CRUD operations for user data

2. **Authentication** (`src/app/api/auth/`)
    - User registration and login
    - JWT-based session management
    - Protected API routes with middleware

3. **Enhanced Prompt Management** (`src/app/api/chat/prompts/`)
    - Dynamic prompt loading from database
    - Subject-specific prompt templates
    - Cultural adaptation engine

4. **Analytics & Progress Tracking** (`src/app/api/analytics/`)
    - Track user learning patterns
    - Generate progress reports
    - Learning analytics dashboard

5. **File Processing** (`src/app/api/upload/`)
    - Math problem image upload
    - OCR for handwritten problems
    - PDF math worksheet processing

6. **Caching Layer** (`src/lib/cache/`)
    - Redis for frequent AI responses
    - In-memory caching for prompt templates
    - Response caching to reduce API costs

7. **Rate Limiting** (`src/middleware.ts`)
    - Protect against API abuse
    - IP-based request limiting
    - User-tier based rate limits

8. **Background Jobs** (`src/lib/workers/`)
    - Async email notifications
    - Report generation
    - Data processing tasks

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
- [Next.js](https://nextjs.org) for the React framework
- [Vercel](https://vercel.com) for hosting
- [Tailwind CSS](https://tailwindcss.com) for styling utilities

## Support

For questions, issues, or feature requests:

- Open an issue on [GitHub](https://github.com/richie-rich90454/math-tutor-website/issues)
- Check the [discussions](https://github.com/richie-rich90454/math-tutor-website/discussions) page

---

**Happy Learning!**
