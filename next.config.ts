import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const backendUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
    reactStrictMode: true,
    compiler: {
        removeConsole:
            process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },
    compress: true,
    productionBrowserSourceMaps: false,
    poweredByHeader: false,
    onDemandEntries: {
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 2,
    },
    turbopack: {
        root: __dirname,
        resolveAlias: {
            "react/jsx-runtime": "react/jsx-runtime",
        },
    },
    images: {
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 604800,
    },
    experimental: {
        optimizePackageImports: [
            "react-syntax-highlighter",
            "react-markdown",
            "gsap",
            "rehype-katex",
            "remark-gfm",
            "remark-math",
        ],
        optimizeCss: true,
        cssChunking: true,
        scrollRestoration: true,
        webpackBuildWorker: true,
        parallelServerBuildTraces: true,
        parallelServerCompiles: true,
        optimizeServerReact: true,
        useCache: true,
    },
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: "/api/auth/:path*",
                    destination: `${backendUrl}/api/auth/:path*`,
                },
                {
                    source: "/api/chats/:path*",
                    destination: `${backendUrl}/api/chats/:path*`,
                },
                {
                    source: "/api/progress/:path*",
                    destination: `${backendUrl}/api/progress/:path*`,
                },
                {
                    source: "/api/usage",
                    destination: `${backendUrl}/api/usage`,
                },
                {
                    source: "/api/problems/:path*",
                    destination: `${backendUrl}/api/problems/:path*`,
                },
                {
                    source: "/api/problem-of-day",
                    destination: `${backendUrl}/api/problem-of-day`,
                },
                {
                    source: "/api/review",
                    destination: `${backendUrl}/api/review`,
                },
                {
                    source: "/api/sheets",
                    destination: `${backendUrl}/api/sheets`,
                },
                {
                    source: "/api/study-plan/:path*",
                    destination: `${backendUrl}/api/study-plan/:path*`,
                },
                {
                    source: "/api/public/chat/:path*",
                    destination: `${backendUrl}/api/public/chat/:path*`,
                },
                {
                    source: "/api/culture/:path*",
                    destination: `${backendUrl}/api/culture/:path*`,
                },
                {
                    source: "/api/chat/translate",
                    destination: `${backendUrl}/api/chat/translate`,
                },
                {
                    source: "/legacy",
                    destination: `${backendUrl}/legacy/index.html`,
                },
                {
                    source: "/legacy/:path*",
                    destination: `${backendUrl}/legacy/:path*`,
                },
            ],
        };
    },
    async headers() {
        return [
            {
                source: "/((?!_next/static|_next/image|favicon).*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Content-Security-Policy",
                        value:
                            "default-src 'self'; script-src 'self' 'unsafe-inline'" +
                            (isDev ? " 'unsafe-eval'" : "") +
                            "; style-src 'self' 'unsafe-inline'; " +
                            "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; " +
                            "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
                    },
                ],
            },
            {
                source: "/fonts/(.*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/api/chats/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "private, max-age=0, stale-while-revalidate=60",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
