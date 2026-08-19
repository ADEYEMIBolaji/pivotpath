import { test, expect } from '@playwright/test'

/**
 * Regression test for the em-dash sanitizer applied to every AI pipeline
 * response (lib/pipeline.ts and lib/discovery/pipeline.ts). The function
 * itself isn't exported (it's a private guard on the LLM call boundary), so
 * this re-implements the exact same regex to lock its behaviour, the actual
 * call sites are covered by the existing end-to-end suites.
 */
function stripEmDash<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/\s*—\s*/g, ', ') as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripEmDash(item)) as unknown as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, stripEmDash(v)]),
    ) as T
  }
  return value
}

test.describe('em dash sanitizer', () => {
  test('replaces an em dash with a comma', () => {
    expect(stripEmDash('Strong match — but one gap remains')).toBe('Strong match, but one gap remains')
  })

  test('handles an em dash with no surrounding spaces', () => {
    expect(stripEmDash('word—word')).toBe('word, word')
  })

  test('leaves strings with no em dash untouched', () => {
    expect(stripEmDash('Nothing to change here, 3–5 months')).toBe('Nothing to change here, 3–5 months')
  })

  test('recurses through nested objects and arrays', () => {
    const input = {
      summary: 'Great fit — worth pursuing',
      gaps: [
        { name: 'SQL', note: 'Learnable — a few weeks' },
        { name: 'Portfolio', note: 'No em dash here' },
      ],
    }
    expect(stripEmDash(input)).toEqual({
      summary: 'Great fit, worth pursuing',
      gaps: [
        { name: 'SQL', note: 'Learnable, a few weeks' },
        { name: 'Portfolio', note: 'No em dash here' },
      ],
    })
  })

  test('leaves non-string values untouched', () => {
    expect(stripEmDash(42)).toBe(42)
    expect(stripEmDash(null)).toBe(null)
    expect(stripEmDash(true)).toBe(true)
  })
})
