/**
 * Per-IP rate limiting for Discovery Mode's Claude-calling routes — TEST BUILD.
 *
 * This feature is free-tier and unauthenticated, so unlike
 * lib/subscription.ts's checkPivotQuota (which gates a signed-in user's paid
 * usage by user id) there's no account to key off. Keys off the caller's IP
 * instead — the only lever available against someone scripting repeated
 * calls to rack up Claude spend.
 *
 * Postgres-backed (migration 011) when DATABASE_URL is set; an in-memory,
 * per-process counter otherwise. The in-memory fallback is intentionally
 * still enforced in dev/file mode (unlike checkPivotQuota's dev bypass) —
 * this is abuse protection, not a paid-feature gate, so there's no reason to
 * turn it off locally, and it's the only way to exercise this code path
 * without a real database.
 */

import { createHash } from 'crypto'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
}

type Route = 'skills' | 'roles' | 'compare'

// Per IP, per route. `compare` is uncached (see the TODO in pipeline.ts) and
// re-costs a full Claude call on every visit to the comparison screen, so it
// gets a tighter effective ceiling relative to how often a real user would
// hit it (once per shortlist, maybe a handful of times on revisits).
const LIMITS: Record<Route, { limit: number; windowMs: number }> = {
  skills: { limit: 10, windowMs: 60 * 60 * 1000 },
  roles: { limit: 10, windowMs: 60 * 60 * 1000 },
  compare: { limit: 20, windowMs: 60 * 60 * 1000 },
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

/** Best-effort client IP from the headers Vercel (and most proxies) set. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

// ─── In-memory fallback (dev / file mode) ─────────────────────────────────────

const memoryCounters = new Map<string, { count: number; resetAt: number }>()

function checkMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = memoryCounters.get(key)
  if (!entry || entry.resetAt <= now) {
    memoryCounters.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, limit }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit }
  }
  entry.count += 1
  return { allowed: true, remaining: limit - entry.count, limit }
}

// ─── Postgres-backed (production) ─────────────────────────────────────────────

async function checkPostgres(
  ipHash: string,
  route: Route,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const { getPool } = await import('../db')
  const pool = getPool()
  const windowStart = new Date(Date.now() - windowMs)

  // One row per (ip_hash, route). Reset the window once it's fully elapsed
  // rather than keeping a row per request — cheap to query, cheap to store.
  const { rows } = await pool.query<{ count: number }>(
    `INSERT INTO discovery_rate_limit (ip_hash, route, window_start, count)
     VALUES ($1, $2, NOW(), 1)
     ON CONFLICT (ip_hash, route) DO UPDATE SET
       count = CASE
         WHEN discovery_rate_limit.window_start < $3 THEN 1
         ELSE discovery_rate_limit.count + 1
       END,
       window_start = CASE
         WHEN discovery_rate_limit.window_start < $3 THEN NOW()
         ELSE discovery_rate_limit.window_start
       END
     RETURNING count`,
    [ipHash, route, windowStart],
  )
  const count = rows[0]?.count ?? 1
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), limit }
}

export async function checkRateLimit(ip: string, route: Route): Promise<RateLimitResult> {
  const { limit, windowMs } = LIMITS[route]
  const ipHash = hashIp(ip)
  if (!process.env.DATABASE_URL) {
    return checkMemory(`${ipHash}:${route}`, limit, windowMs)
  }
  return checkPostgres(ipHash, route, limit, windowMs)
}
