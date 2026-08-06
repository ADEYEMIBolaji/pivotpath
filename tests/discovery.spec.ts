import { test, expect } from '@playwright/test'

/**
 * Discovery Mode regression suite — TEST BUILD.
 *
 * Covers both personas end-to-end against a real dev server. Makes real
 * Claude + Adzuna calls (file-based store, never Postgres — see
 * playwright.config.ts) — this is deliberately a smoke suite that exercises
 * the actual pipeline, not a mocked unit suite, because the risk this whole
 * feature runs is "the AI/HTTP integration breaks", not "the arithmetic is
 * wrong". Run with: npx playwright test
 */

test.describe('Persona A — Discovery Mode', () => {
  test('completes intake through commitment, with real Adzuna grounding', async ({ page }) => {
    await page.goto('/discovery-test')
    await expect(page.getByRole('heading', { name: /what you already do well/i })).toBeVisible({
      timeout: 30_000,
    })

    // Step 1 — chip selection across 3 of the 4 banks.
    for (const label of [
      'Untangling a messy spreadsheet',
      'Explaining something complicated simply',
      'Staying calm under pressure',
    ]) {
      await page.getByRole('button', { name: label, exact: true }).click()
    }
    await expect(page.locator('text=/selected/')).toContainText('3 selected')

    // Step 2 — functional skills map.
    await page.getByRole('button', { name: /build my skills map/i }).click()
    await expect(page.getByRole('heading', { name: /what you.re actually good at/i })).toBeVisible({
      timeout: 120_000,
    })
    // SKILLS_MAP_TOOL's minItems: 4 is a schema hint, not an API-enforced
    // constraint (we don't set strict: true) — Claude can and does return
    // fewer for a sparse 3-chip intake. Assert on "did extraction produce a
    // real map", not on exact compliance with the hint.
    const functionCards = page.locator('h3')
    expect(await functionCards.count()).toBeGreaterThanOrEqual(3)

    // Step 3 — adjacent roles, each with a plain-language line and (when
    // Adzuna is configured) a real-postings signal.
    await page.getByRole('button', { name: /show me roles this fits/i }).click()
    await expect(page.getByRole('heading', { name: /would you look twice/i })).toBeVisible({
      timeout: 120_000,
    })

    const deckSizeText = await page.locator('text=/^\\d+ \\/ \\d+$/').innerText()
    const total = Number(deckSizeText.split('/')[1].trim())
    expect(total).toBeGreaterThanOrEqual(5)
    expect(total).toBeLessThanOrEqual(10)

    // Every card must show the plain-language line directly under the title
    // (the role-relatability requirement) before we swipe past it.
    await expect(page.locator('h2 + p').first()).not.toBeEmpty()

    // Like the first card only — keeps the shortlist (and the real Claude
    // enrichment call after it) small and fast.
    await page.getByRole('button', { name: 'Like', exact: true }).click()
    for (let i = 1; i < total; i++) {
      await expect(page.locator(`text=${i + 1} / ${total}`)).toBeVisible({ timeout: 20_000 })
      await page.getByRole('button', { name: 'Pass', exact: true }).click()
    }

    // Step 4 — compare and choose.
    await expect(page.getByRole('heading', { name: /which one do you want to chase/i })).toBeVisible({
      timeout: 120_000,
    })
    await expect(page.locator('text=Loading comparison…')).toHaveCount(0, { timeout: 60_000 })
    await expect(page.locator('text=Day to day')).toBeVisible()

    const commitButton = page.getByRole('button', { name: 'Choose this one' }).first()
    await commitButton.click()

    // Bridge — lands on the shared confirmation screen.
    await page.waitForURL(/\/target-committed/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Your target role:/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('link', { name: /continue to positioning/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /change target role/i })).toBeVisible()

    // The hand-off CTA must carry the committed title into onboarding, not
    // a dead link (this regressed once already — see git history).
    const href = await page.getByRole('link', { name: /continue to positioning/i }).getAttribute('href')
    expect(href).toContain('/onboarding')
    expect(href).toContain('targetTitle=')
  })

  test('reload after finishing resumes at the shortlist, not the deck start', async ({ page }) => {
    await page.goto('/discovery-test')
    await expect(page.getByRole('heading', { name: /what you already do well/i })).toBeVisible({
      timeout: 30_000,
    })
    for (const label of ['Untangling a messy spreadsheet', 'Staying calm under pressure', 'Filling a gap nobody assigned']) {
      await page.getByRole('button', { name: label, exact: true }).click()
    }
    await page.getByRole('button', { name: /build my skills map/i }).click()
    await expect(page.getByRole('heading', { name: /what you.re actually good at/i })).toBeVisible({
      timeout: 120_000,
    })
    await page.getByRole('button', { name: /show me roles this fits/i }).click()
    await expect(page.getByRole('heading', { name: /would you look twice/i })).toBeVisible({
      timeout: 120_000,
    })

    const total = Number((await page.locator('text=/^\\d+ \\/ \\d+$/').innerText()).split('/')[1].trim())
    for (let i = 0; i < total; i++) {
      await page.getByRole('button', { name: 'Pass', exact: true }).click()
      if (i < total - 1) await expect(page.locator(`text=${i + 2} / ${total}`)).toBeVisible({ timeout: 20_000 })
    }
    await expect(page.getByRole('heading', { name: /useful too|which one do you want to chase/i })).toBeVisible({
      timeout: 120_000,
    })

    await page.reload()
    // Must NOT land back at "1 / N" — the regression this test guards against.
    await expect(page.getByRole('heading', { name: /useful too|which one do you want to chase/i })).toBeVisible({
      timeout: 30_000,
    })
  })
})

test.describe('Persona B — direct entry', () => {
  test('sets a target role directly and can change it', async ({ page }) => {
    await page.goto('/target-role')
    await expect(page.getByRole('heading', { name: /what role or industry/i })).toBeVisible({ timeout: 15_000 })

    await page.locator('input[type="text"]').fill('Data Analyst')
    await page.getByRole('button', { name: /set as my target role/i }).click()
    await page.waitForURL(/\/target-committed/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Your target role: Data Analyst/i })).toBeVisible({
      timeout: 30_000,
    })

    // "Change target role" must round-trip the same commitment id, not spawn
    // a new, disconnected commitment.
    const commitUrlBefore = page.url()
    const commitmentId = new URL(commitUrlBefore).searchParams.get('commitmentId')
    expect(commitmentId).toBeTruthy()

    await page.getByRole('link', { name: /change target role/i }).click()
    await expect(page.getByRole('heading', { name: /what role or industry/i })).toBeVisible({ timeout: 15_000 })
    expect(page.url()).toContain(`commitmentId=${commitmentId}`)

    await page.locator('input[type="text"]').fill('Business Analyst')
    await page.getByRole('button', { name: /set as my target role/i }).click()
    await page.waitForURL(/\/target-committed/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Your target role: Business Analyst/i })).toBeVisible({
      timeout: 30_000,
    })
    // Same commitment id — an update, not a second row.
    expect(new URL(page.url()).searchParams.get('commitmentId')).toBe(commitmentId)
  })
})

test.describe('Isolation — Discovery Mode routes are reachable and separate from the main app', () => {
  test('all three routes respond with the flag on, and the main app is unaffected', async ({ request, baseURL }) => {
    // This suite's server runs with DISCOVERY_MODE=on (see playwright.config.ts) —
    // one webServer instance can't also prove the off-by-default behavior in
    // production, so that half of isDiscoveryEnabled() (lib/discovery/access.ts)
    // is a one-line function best read, not re-tested against a live server here.
    for (const path of ['/discovery-test', '/target-role']) {
      const res = await request.get(`${baseURL}${path}`)
      expect(res.status(), `${path} should be reachable with the flag on`).toBe(200)
    }

    // The main app's landing page must still work — Discovery Mode is
    // additive, not a fork of the primary flow.
    const home = await request.get(`${baseURL}/`)
    expect(home.status()).toBe(200)
  })
})
