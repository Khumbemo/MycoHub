import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the production build (`npm run build` first).
// The feature tests run on a phone; layout.spec.js runs on every form factor.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    {
      name: 'phone-landscape',
      testMatch: /layout\.spec\.js/,
      use: { ...devices['Pixel 7 landscape'] },
    },
    {
      name: 'tablet',
      testMatch: /layout\.spec\.js/,
      // iPad Mini viewport and touch, rendered with Chromium
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
    },
    {
      name: 'desktop',
      testMatch: /layout\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
