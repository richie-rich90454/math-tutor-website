import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },
    compress: true,
    productionBrowserSourceMaps: false,
    onDemandEntries: {
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 2,
    },
    turbopack: {
        root: __dirname,
    },
    images: {
        formats: ["image/avif", "image/webp"],
    },
    experimental: {
        optimizePackageImports: [
            "react-syntax-highlighter",
            "react-markdown",
            "gsap",
        ],
        optimizeCss: true,
    },
    async headers() {
        return [
            {
                source: "/((?!_next/static).*)",
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
            {
                source: "/_next/static/(.*)",
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