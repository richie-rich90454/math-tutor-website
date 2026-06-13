import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
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
        ];
    },
};

export default nextConfig;