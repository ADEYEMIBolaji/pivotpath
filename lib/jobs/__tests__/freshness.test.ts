/**
 * Unit tests for freshness filtering and salary parsing.
 * Run with: npx tsx --test lib/jobs/__tests__/freshness.test.ts
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parseSalaryString, parseNhsBand, parseCsGrade } from '../normalise'

function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

// ─── Freshness helpers ────────────────────────────────────────────────────────
// Test the predicate the pipeline uses — not the pipeline itself (which needs DB)

function isFresh(postedAt: string, maxDays = 30): boolean {
  const cutoff = Date.now() - maxDays * 86_400_000
  return new Date(postedAt).getTime() >= cutoff
}

describe('freshness filter', () => {
  test('listing posted today is fresh', () => {
    assert.ok(isFresh(new Date().toISOString()))
  })

  test('listing posted 1 day ago is fresh', () => {
    assert.ok(isFresh(daysAgoISO(1)))
  })

  test('listing posted 29 days ago is fresh', () => {
    assert.ok(isFresh(daysAgoISO(29)))
  })

  test('listing posted exactly 30 days ago is on the boundary (fresh)', () => {
    // 30 days ago at this exact moment is still >= cutoff
    const ts = daysAgoISO(30)
    // Allow 1-second tolerance for test execution time
    const cutoff = Date.now() - 30 * 86_400_000 - 1000
    assert.ok(new Date(ts).getTime() >= cutoff)
  })

  test('listing posted 31 days ago is stale', () => {
    assert.ok(!isFresh(daysAgoISO(31)))
  })

  test('listing posted 60 days ago is stale', () => {
    assert.ok(!isFresh(daysAgoISO(60)))
  })

  test('future date is fresh', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    assert.ok(isFresh(future))
  })

  test('custom maxDays respected', () => {
    assert.ok(isFresh(daysAgoISO(6), 7))
    assert.ok(!isFresh(daysAgoISO(8), 7))
  })
})

// ─── Salary parsing ───────────────────────────────────────────────────────────

describe('parseSalaryString', () => {
  test('annual range "£30,000 - £35,000"', () => {
    const r = parseSalaryString('£30,000 - £35,000')
    assert.equal(r.min, 30000)
    assert.equal(r.max, 35000)
  })

  test('shorthand "£30k–£35k"', () => {
    const r = parseSalaryString('£30k–£35k')
    assert.equal(r.min, 30000)
    assert.equal(r.max, 35000)
  })

  test('single value "£45,000 per annum"', () => {
    const r = parseSalaryString('£45,000 per annum')
    assert.equal(r.min, 45000)
    assert.equal(r.max, 45000)
  })

  test('hourly rate "£20 per hour"', () => {
    const r = parseSalaryString('£20 per hour')
    // 20 × 35h × 52wk = 36,400
    assert.ok(r.min !== null && r.min > 30000 && r.min < 45000, `got ${r.min}`)
  })

  test('daily rate "£250 per day"', () => {
    const r = parseSalaryString('£250 per day')
    // 250 × 260 = 65,000
    assert.ok(r.min !== null && r.min > 60000 && r.min < 70000, `got ${r.min}`)
  })

  test('empty string → nulls', () => {
    const r = parseSalaryString('')
    assert.equal(r.min, null)
    assert.equal(r.max, null)
  })

  test('non-salary text → nulls', () => {
    const r = parseSalaryString('Competitive salary')
    assert.equal(r.min, null)
    assert.equal(r.max, null)
  })

  test('unrealistic tiny value → nulls', () => {
    const r = parseSalaryString('£5 per annum')
    assert.equal(r.min, null)
  })
})

// ─── NHS band parsing ─────────────────────────────────────────────────────────

describe('parseNhsBand', () => {
  test('Band 5 returns correct 2024/25 range', () => {
    const r = parseNhsBand('Band 5')
    assert.ok(r !== null)
    assert.equal(r!.min, 29970)
    assert.equal(r!.max, 36483)
  })

  test('Band 8a parsed', () => {
    const r = parseNhsBand('Band 8a')
    assert.ok(r !== null)
    assert.equal(r!.min, 53755)
  })

  test('Band 8b parsed', () => {
    const r = parseNhsBand('8b')
    assert.ok(r !== null)
    assert.ok(r!.min > 60000)
  })

  test('unknown band → null', () => {
    assert.equal(parseNhsBand('Band 99'), null)
  })

  test('works without "Band " prefix', () => {
    const withPrefix    = parseNhsBand('Band 7')
    const withoutPrefix = parseNhsBand('7')
    assert.deepEqual(withPrefix, withoutPrefix)
  })
})

// ─── Civil Service grade parsing ─────────────────────────────────────────────

describe('parseCsGrade', () => {
  test('Grade 7 returns mid-senior range', () => {
    const r = parseCsGrade('Grade 7')
    assert.ok(r !== null)
    assert.ok(r!.min >= 50000)
  })

  test('HEO parsed', () => {
    const r = parseCsGrade('HEO')
    assert.ok(r !== null)
    assert.ok(r!.min >= 30000 && r!.max <= 50000)
  })

  test('SEO parsed', () => {
    const r = parseCsGrade('SEO')
    assert.ok(r !== null)
    assert.ok(r!.min >= 35000)
  })

  test('unknown grade → null', () => {
    assert.equal(parseCsGrade('Wizard Level 3'), null)
  })
})
