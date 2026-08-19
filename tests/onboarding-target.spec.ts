import { test, expect } from '@playwright/test'
import { canContinueStep2, resolveEffectiveTitle } from '../lib/onboarding-target'

/**
 * Pure logic test — no server, no browser, no database. This is the actual
 * regression test for the bug where a Discovery Mode hand-off with a title
 * that doesn't match lib/role-taxonomy.ts left onboarding Step 2's
 * "Continue" disabled forever, because it required industry + function +
 * role all filled — exactly what Discovery Mode exists to let someone skip.
 */
test.describe('lib/onboarding-target', () => {
  test('a fresh entry with no hand-off still requires all three fields', () => {
    expect(canContinueStep2({ industry: '', func: '', role: '' })).toBe(false)
    expect(canContinueStep2({ industry: 'Technology', func: '', role: '' })).toBe(false)
    expect(canContinueStep2({ industry: 'Technology', func: 'Product', role: '' })).toBe(false)
    expect(canContinueStep2({ industry: 'Technology', func: 'Product', role: 'Product Manager' })).toBe(true)
  })

  test('an unmatched Discovery Mode title enables Continue with no dropdowns filled — the bug', () => {
    const initialTarget = { title: 'Implementation Consultant', description: 'Implementation Consultant', unmatched: true }
    // This is the exact state Step 2 is in right after landing from the hand-off:
    // `role` was seeded from initialTarget.title; industry/func are untouched.
    const state = { industry: '', func: '', role: 'Implementation Consultant' }

    expect(canContinueStep2(state, initialTarget)).toBe(true)
    expect(resolveEffectiveTitle(state, initialTarget)).toBe('Implementation Consultant')
  })

  test('a matched Discovery Mode title behaves the same as a normal, fully-filled entry', () => {
    const initialTarget = { industry: 'Technology', function: 'Product', title: 'Product Manager', description: 'Product Manager' }
    const state = { industry: 'Technology', func: 'Product', role: 'Product Manager' }

    expect(canContinueStep2(state, initialTarget)).toBe(true)
    expect(resolveEffectiveTitle(state, initialTarget)).toBe('Product Manager')
  })

  test('opening the optional dropdowns without finishing them does not discard the hand-off title', () => {
    const initialTarget = { title: 'Implementation Consultant', unmatched: true }
    // handleIndustryChange resets `role` to '' the moment an industry is picked,
    // before a function/role has been chosen — this is the state in between.
    const midExploration = { industry: 'Technology', func: '', role: '' }

    expect(resolveEffectiveTitle(midExploration, initialTarget)).toBe('Implementation Consultant')
    expect(canContinueStep2(midExploration, initialTarget)).toBe(true)
  })

  test('once a specific role is picked from the dropdowns, that takes over from the hand-off title', () => {
    const initialTarget = { title: 'Implementation Consultant', unmatched: true }
    const afterPickingSpecificRole = { industry: 'Technology', func: 'Product', role: 'Product Manager' }

    expect(resolveEffectiveTitle(afterPickingSpecificRole, initialTarget)).toBe('Product Manager')
  })

  test('no hand-off and nothing filled in never accidentally enables Continue', () => {
    expect(canContinueStep2({ industry: '', func: '', role: '' }, null)).toBe(false)
    expect(canContinueStep2({ industry: '', func: '', role: '' }, undefined)).toBe(false)
    expect(canContinueStep2({ industry: '', func: '', role: '' }, {})).toBe(false)
  })
})
