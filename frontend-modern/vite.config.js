import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
    plugins: [
        preact(),
        legacy({
            targets: ['ie >= 9'],
            additionalLegacyPolyfills: ['whatwg-fetch'],
        }),
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: '../backend/src/main/resources/static',
        emptyOutDir: true,
    },
});
