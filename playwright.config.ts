import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the PRODUCTION build served by `vite preview`, so what is tested is
// what ships (hashed assets, the generated service worker and manifest). Chromium only for now.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    locale: 'ar',
    timezoneId: 'Asia/Riyadh',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
