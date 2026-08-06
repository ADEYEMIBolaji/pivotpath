import { defineConfig } from '@playwright/test'

/**
 * Runs the Discovery Mode regression suite (tests/discovery.spec.ts) against
 * a real dev server. DATABASE_URL is forced empty so this never touches
 * Postgres — the file-based store is the point: a CI run shouldn't need
 * (or risk writing to) a real database.
 *
 * Real Claude + Adzuna API calls are made — this is a smoke suite, not a
 * unit suite; expect it to take a couple of minutes and to cost a small
 * amount of API usage per run.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3200',
  },
  webServer: {
    command: 'npx next dev --port 3200',
    url: 'http://localhost:3200',
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DISCOVERY_MODE: 'on',
      DATABASE_URL: '',
      NEXT_DIST_DIR: '.next-test',
    },
  },
})
