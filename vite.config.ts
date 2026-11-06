import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

// base './' lets the build run under a sub-path (GitHub Pages, nawy.to/do).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
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
        id: './',
        start_url: './',
        scope: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        categories: ['productivity'],
        shortcuts: [
          {
            name: 'نية جديدة',
            short_name: 'نية جديدة',
            url: './?new=1',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        // Sharing text from any Android app (GET, so it works with the offline-first shell).
        share_target: {
          action: './',
          method: 'GET',
          params: { title: 'share_title', text: 'share_text', url: 'share_url' },
        },
        screenshots: [
          {
            src: 'screenshots/narrow-main.png',
            sizes: '1082x2202',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'نواياي: قائمة النوايا والإضافة السريعة',
          },
          {
            src: 'screenshots/narrow-details.png',
            sizes: '1082x2202',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'تفاصيل النية: التاريخ والتكرار والخطوات',
          },
          {
            src: 'screenshots/narrow-starred.png',
            sizes: '1082x2202',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'المفضلة',
          },
          {
            src: 'screenshots/wide-main.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'نواياي على الشاشة العريضة',
          },
          {
            src: 'screenshots/wide-details.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'تفاصيل النية',
          },
        ],
        theme_color: '#f7f8fa',
        background_color: '#f7f8fa',
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
        // Store screenshots are for the install dialog only: not worth precaching.
        globIgnores: ['screenshots/**'],
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
