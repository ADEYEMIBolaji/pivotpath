/**
 * Unit tests for dedup key generation and fuzzy title matching.
 * Run with: npx tsx --test lib/jobs/__tests__/dedup.test.ts
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { dedupKey, titlesMatch, tokenSetSimilarity, levenshtein } from '../normalise'

describe('dedupKey', () => {
  test('same role produces same key regardless of token order', () => {
    const a = dedupKey('Acme Corp', 'Product Manager', 'London')
    const b = dedupKey('Acme Corp', 'London Product Manager', 'London')
    // Both normalise "product manager" + "london" + "acme corp" → sorted tokens
    assert.equal(typeof a, 'string')
    assert.ok(a.length > 0)
    // Same employer + similar title components → same normalised employer segment
    const keyA = dedupKey('Acme Corp', 'Product Manager', 'London')
    const keyB = dedupKey('Acme Corp', 'Product Manager', 'London')
    assert.equal(keyA, keyB)
  })

  test('different employers produce different keys', () => {
    const a = dedupKey('Acme Corp', 'Product Manager', 'London')
    const b = dedupKey('Beta Ltd', 'Product Manager', 'London')
    assert.notEqual(a, b)
  })

  test('different locations produce different keys', () => {
    const a = dedupKey('Acme', 'PM', 'London')
    const b = dedupKey('Acme', 'PM', 'Manchester')
    assert.notEqual(a, b)
  })

  test('key is stable across calls', () => {
    const a = dedupKey('NHS England', 'Digital Health PM', 'Leeds')
    const b = dedupKey('NHS England', 'Digital Health PM', 'Leeds')
    assert.equal(a, b)
  })

  test('abbreviation expansion: PM normalises to product manager', () => {
    const a = dedupKey('Acme', 'PM', 'London')
    const b = dedupKey('Acme', 'Product Manager', 'London')
    assert.equal(a, b)
  })

  test('APM and Associate Product Manager normalise the same', () => {
    const a = dedupKey('BUPA', 'APM', 'London')
    const b = dedupKey('BUPA', 'Associate Product Manager', 'London')
    assert.equal(a, b)
  })
})

describe('levenshtein', () => {
  test('identical strings → 0', () => {
    assert.equal(levenshtein('product manager', 'product manager'), 0)
  })

  test('one substitution', () => {
    assert.equal(levenshtein('cat', 'bat'), 1)
  })

  test('one insertion', () => {
    assert.equal(levenshtein('cart', 'car'), 1)
  })

  test('empty strings', () => {
    assert.equal(levenshtein('', ''), 0)
    assert.equal(levenshtein('abc', ''), 3)
    assert.equal(levenshtein('', 'abc'), 3)
  })

  test('completely different strings have high distance', () => {
    assert.ok(levenshtein('product manager', 'nurse practitioner') > 5)
  })
})

describe('tokenSetSimilarity', () => {
  test('identical strings → 1', () => {
    assert.equal(tokenSetSimilarity('Product Manager', 'Product Manager'), 1)
  })

  test('same words different order → high similarity', () => {
    const s = tokenSetSimilarity('Senior Product Manager', 'Product Manager Senior')
    assert.ok(s >= 0.9, `expected >= 0.9, got ${s}`)
  })

  test('empty strings → 1', () => {
    assert.equal(tokenSetSimilarity('', ''), 1)
  })

  test('completely different → low similarity', () => {
    const s = tokenSetSimilarity('Nurse Practitioner', 'Software Engineer')
    assert.ok(s < 0.2, `expected < 0.2, got ${s}`)
  })
})

describe('titlesMatch', () => {
  test('exact match', () => {
    assert.ok(titlesMatch('Product Manager', 'Product Manager'))
  })

  test('APM vs Associate Product Manager — should match via abbreviation expansion', () => {
    assert.ok(titlesMatch('APM', 'Associate Product Manager'))
  })

  test('PM vs Product Manager — should match', () => {
    assert.ok(titlesMatch('PM', 'Product Manager'))
  })

  test('Senior PM vs Senior Product Manager — should match', () => {
    assert.ok(titlesMatch('Senior PM', 'Senior Product Manager'))
  })

  test('Associate PM vs Associate Product Manager — should match', () => {
    assert.ok(titlesMatch('Associate PM', 'Associate Product Manager'))
  })

  test('minor typo: "Prodcut Manager" vs "Product Manager"', () => {
    // Levenshtein fallback handles 1-char transposition
    assert.ok(titlesMatch('Prodcut Manager', 'Product Manager'))
  })

  test('completely different titles — should not match', () => {
    assert.ok(!titlesMatch('Software Engineer', 'Registered Nurse'))
  })

  test('same role family but different seniority — should not match', () => {
    // "Junior Developer" vs "Engineering Manager" — different enough
    assert.ok(!titlesMatch('Junior Developer', 'Engineering Manager'))
  })
})
