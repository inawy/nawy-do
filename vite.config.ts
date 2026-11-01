import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

// base './' lets the build run under a sub-path (GitHub Pages, nawy.to/do).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Material Symbols files become components (`?react`): colour from the text, hidden from AT.
    svgr({
      svgrOptions: {
        svgProps: { fill: 'currentColor', 'aria-hidden': 'true', focusable: 'false' },
      },
    }),
    VitePWA({
      // `prompt`: a new version never reloads the page under an open edit sheet (D-012).
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'ناوي دو',
        short_name: 'ناوي دو',
        description: 'ناوي تعمل إيه؟ مهامك على جهازك، وتشتغل بلا إنترنت.',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,png,ico,webmanifest}'],
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
