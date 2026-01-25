import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    turbopack: {
        // Resolve the root directory to the current project
        root: __dirname,
    },
};

export default nextConfig;
