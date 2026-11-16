import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.mjs', workers: 1, timeout: 30000,
  reporter: [['list'], ['json', { outputFile: process.env.LIVE ? 'output/playwright/live-results.json' : 'output/playwright/results.json' }]],
  use: { headless: true, viewport: { width: 1280, height: 900 }, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium', channel: process.env.PW_CHANNEL || 'chrome' } }],
});
