import { test, expect } from '@playwright/test'
import { checkRateLimit } from '../lib/discovery/rate-limit'

/**
 * Pure logic test — no server, no browser, no network. Runs against the
 * in-memory fallback path (DATABASE_URL is unset for the whole suite; see
 * playwright.config.ts), which is the same counting/window logic the
 * Postgres path uses.
 */
test.describe('lib/discovery/rate-limit', () => {
  test('blocks exactly after the configured limit, per IP and per route', async () => {
    const ip = '203.0.113.55' // TEST-NET-3 (RFC 5737) — never a real caller
    const results: boolean[] = []
    for (let i = 0; i < 22; i++) {
      results.push((await checkRateLimit(ip, 'compare')).allowed)
    }
    expect(results.filter(Boolean).length).toBe(20)
    expect(results.slice(20)).toEqual([false, false])
  })

  test('does not leak across IPs or routes', async () => {
    const ip = '203.0.113.56'
    for (let i = 0; i < 20; i++) await checkRateLimit(ip, 'skills')

    const blocked = await checkRateLimit(ip, 'skills')
    expect(blocked.allowed).toBe(false)

    const otherIp = await checkRateLimit('198.51.100.20', 'skills')
    expect(otherIp.allowed).toBe(true)

    const otherRoute = await checkRateLimit(ip, 'roles')
    expect(otherRoute.allowed).toBe(true)
  })
})
