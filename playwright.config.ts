import { defineConfig } from '@playwright/test'

// E2E runs against a production build made with NEXT_PUBLIC_E2E=1 (enables /lab) and dummy env:
//   npm run test:e2e        parity, cancel race, app flows (about 15 s)
//   npm run test:perf       4K main-thread numbers, worker vs v1 (about 6 min, prints PERF lines)
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.(spec|bench)\.ts/,
  testIgnore: process.env.PERF ? /app\.spec|engine\.spec/ : /perf\.bench/,
  timeout: 180_000,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:3100', browserName: 'chromium' },
  webServer: {
    command: 'npx next start -p 3100',
    url: 'http://127.0.0.1:3100/lab',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
