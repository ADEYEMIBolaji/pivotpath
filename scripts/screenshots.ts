/**
 * PivotPath automated screenshot script
 *
 * Usage:  npm run shots
 *
 * What it does:
 *  1. Seeds a fixture session into .sessions/ (no API calls needed)
 *  2. Boots Next.js dev on an available port
 *  3. Visits every route at 1440 / 834 / 390 px with deviceScaleFactor: 2
 *  4. Captures interactive variants (onboarding steps, resume diff, jobs filter)
 *  5. Writes screenshots/ cleared at the start
 *  6. Prints a summary table
 *  7. Writes screenshots/index.html contact sheet
 */

import { chromium, type Page, type BrowserContext } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import http from 'http'
import net from 'net'
import { execSync, spawn } from 'child_process'
import type { ChildProcess } from 'child_process'

// ─── Config ───────────────────────────────────────────────────────────────────

const WIDTHS = [1440, 834, 390] as const
const OUT_DIR = path.join(process.cwd(), 'screenshots')
const SESSIONS_DIR = path.join(process.cwd(), '.sessions')
const FIXTURE_SESSION_ID = 'screenshot-demo-session'

// ─── Fixture session data ─────────────────────────────────────────────────────

const FIXTURE_SESSION = {
  id: FIXTURE_SESSION_ID,
  userId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  profile: {
    name: 'Alex Johnson',
    headline: 'Registered Nurse with 7 years ICU & Emergency experience',
    source: 'paste',
    roles: [
      {
        title: 'Senior Staff Nurse',
        company: 'Royal London Hospital',
        dateRange: '2019 – present',
        bullets: [
          { text: 'Led triage assessments for 40+ patients daily across a 28-bed ICU ward' },
          { text: 'Trained and onboarded 12 newly qualified nurses over 3 years' },
          { text: 'Implemented a medication tracking protocol reducing errors by 30%' },
          { text: 'Coordinated cross-functional care plans with surgeons, physios and dietitians' },
        ],
      },
      {
        title: 'Staff Nurse',
        company: 'St. Thomas\' Hospital',
        dateRange: '2017 – 2019',
        bullets: [
          { text: 'Managed caseloads of 8–12 patients per shift in A&E' },
          { text: 'Participated in NHS system rollout for electronic patient records' },
        ],
      },
    ],
    skills: [
      'Clinical triage', 'Patient prioritisation', 'Care plan design',
      'Team leadership', 'Training & onboarding', 'Process improvement',
      'Stakeholder coordination', 'Data documentation', 'EPIC EMR',
    ],
    education: [
      { degree: 'BSc Nursing', institution: 'King\'s College London', year: '2017' },
    ],
  },
  target: {
    title: 'Product Manager',
    function: 'Product',
    industry: 'Health Technology',
    userDescription: 'I want to move into health tech product management',
  },
  translationMap: {
    summaryCopy: 'You have 8 of 12 core Product competencies — stronger than most career-switchers at this stage.',
    competenciesHave: 8,
    competenciesTotal: 12,
    readiness: {
      score: 68,
      confidence: 'medium',
      label: 'Medium confidence. Strong transferable skills but no formal PM experience yet.',
      strongestAsset: 'Clinical prioritisation maps directly to product triage and backlog management',
      biggestGap: 'No shipped digital product or PM portfolio to point to',
    },
    rows: [
      { from: 'ICU patient triage', to: 'Product backlog prioritisation', tier: 'high', note: 'Same framework: urgency × impact. Language swap only.' },
      { from: 'Medication error protocol', to: 'Process redesign / zero-defect shipping', tier: 'high', note: 'Demonstrates systems thinking with measurable outcome.' },
      { from: 'Cross-functional care coordination', to: 'Cross-functional squad leadership', tier: 'high', note: 'Surgeon = engineering lead; physio = designer — direct analogue.' },
      { from: 'Nurse onboarding & training', to: 'Stakeholder enablement & product education', tier: 'partial', note: 'Needs reframing as "enabling non-technical stakeholders".' },
      { from: 'EPIC EMR participation', to: 'Enterprise SaaS product knowledge', tier: 'partial', note: 'Shows product fluency but not ownership.' },
      { from: 'Clinical data documentation', to: 'Data-driven decision making', tier: 'frame', note: 'Needs a portfolio project to make this concrete.' },
    ],
  },
  gapScorecard: {
    cards: [
      {
        tier: 'disqualifying',
        color: '#C7553B',
        items: [
          { name: 'No shipped digital product', note: 'Most health tech PMs need at least one portfolio piece', timeToClose: '2–3 mo' },
        ],
      },
      {
        tier: 'closable',
        color: '#E8A838',
        items: [
          { name: 'Product management fundamentals', note: 'Structured PM certification fills this fast', timeToClose: '~3 wks' },
          { name: 'SQL / data querying', note: 'Health tech PMs are expected to self-serve analytics', timeToClose: '1–2 mo' },
        ],
      },
      {
        tier: 'nice-to-have',
        color: '#2E6B6B',
        items: [
          { name: 'Agile / Scrum certification', note: 'Useful signal but not a gate' },
          { name: 'HL7 / FHIR standards knowledge', note: 'Differentiated for health tech specifically' },
        ],
      },
    ],
  },
  resume: {
    summary: 'Clinical leader transitioning into health technology product management, with 7 years of experience designing, prioritising and improving care systems under real-world constraints. Proven ability to coordinate cross-functional teams, redesign flawed processes and train non-specialist stakeholders — the same skills that define effective product work in regulated health tech environments.',
    roles: [
      {
        title: 'Senior Staff Nurse → Clinical Product Specialist (framing)',
        meta: 'Royal London Hospital · 2019 – present',
        bullets: [
          { original: 'Led triage assessments for 40+ patients daily', repositioned: 'Managed a 40+ item live backlog daily, triaging by clinical urgency and downstream impact', rationale: 'Triage is backlog management — identical prioritisation framework.' },
          { original: 'Trained and onboarded 12 newly qualified nurses', repositioned: 'Designed and delivered onboarding programme for 12 team members, reducing time-to-competency by ~40%', rationale: 'Reframes training as a product-style enablement initiative with an outcome metric.' },
          { original: 'Implemented medication tracking protocol reducing errors by 30%', repositioned: 'Identified a high-severity process failure, designed a lightweight intervention and shipped it across the ward — resulting in a 30% error reduction within 60 days', rationale: 'Classic PM narrative: problem → solution → measurable outcome.' },
        ],
      },
    ],
    newSkills: ['Backlog prioritisation', 'Process redesign', 'Cross-functional coordination', 'Stakeholder enablement', 'Healthcare data systems'],
    oldSkills: ['Clinical triage', 'Patient care', 'Medication administration'],
    missingItems: [
      { tier: 'disqualifying', color: '#C7553B', timeToClose: '2–3 mo', name: 'Shipped digital product', note: 'Build one portfolio project', action: 'Complete a PM challenge or side project with a shipped output' },
      { tier: 'closable', color: '#E8A838', timeToClose: '3 wks', name: 'PM fundamentals', note: 'Google PM Certificate or equivalent', action: 'Enrol in Google Project Management Certificate (Coursera)' },
    ],
  },
  strategy: {
    bestFitCompanies: ['NHS Digital / NHS England', 'Babylon Health', 'EMIS Health', 'PatientAccess / Egton', 'Early-stage health tech startups'],
    bestFitRationale: 'These organisations value clinical credibility alongside PM skills — your background is a genuine differentiator, not a workaround.',
    avoidCompanies: ['Large enterprise software firms without health domain', 'Consumer tech companies with no healthcare focus'],
    bridgeRoles: [
      { title: 'Clinical Implementation Consultant', why: 'Puts you on the product/tech side without requiring a PM portfolio yet' },
      { title: 'Clinical Product Analyst', why: 'Many health tech firms have this as an entry rung into PM — use it as a 12-month launchpad' },
    ],
    originAdvantage: [
      { original: 'Clinical triage under pressure', translated: 'Instinctive prioritisation in ambiguous, high-stakes product decisions' },
      { original: 'Multi-disciplinary ward team coordination', translated: 'Natural cross-functional squad leadership without the learning curve' },
      { original: 'Regulatory & compliance awareness (CQC, NICE)', translated: 'Unique asset in regulated health tech environments — most PMs lack this' },
    ],
    originNarrative: 'I spent seven years designing and improving care systems at the sharp end of clinical delivery. Every day I was triaging competing demands, shipping protocol changes and coordinating specialists — the same skills product management requires, just in a different context. Moving into health tech PM isn\'t a career change so much as a translation.',
    plan: [
      { label: 'Weeks 1–2', actions: ['Complete Google PM Certificate', 'Build one portfolio project (redesign an NHS patient-facing flow)', 'Set up LinkedIn with PM framing'] },
      { label: 'Weeks 3–6', actions: ['Apply to Clinical Product Analyst roles as bridge', 'Reach out to 5 health tech PMs for informational interviews', 'Learn basic SQL via Mode Analytics tutorial'] },
      { label: 'Month 2–3', actions: ['Iterate portfolio project based on interviews', 'Apply to Associate PM programmes at NHS Digital / Babylon', 'Attend one health tech event (e.g. NHS DigitriX)'] },
    ],
    expectations: [
      { label: 'Timeline', color: '#E8A838', headline: '4–8 months', note: 'Realistic with a bridge role — faster with a strong portfolio piece' },
      { label: 'Salary', color: '#2E6B6B', headline: '£45–60k', note: 'Entry PM in health tech — step up from NHS band 6/7' },
      { label: 'Search difficulty', color: '#E8A838', headline: 'Moderate', note: 'Health tech PM roles are in demand; your clinical background is rare and valued' },
    ],
  },
}

// ─── Route definitions ────────────────────────────────────────────────────────

interface Shot {
  label: string
  path: string
  slug: string
  beforeShot?: (page: Page, ctx: BrowserContext) => Promise<void>
}

function buildRoutes(sessionId: string): Shot[] {
  return [
    // ── Static pages ──────────────────────────────────────────────────────────
    { label: 'Landing', path: '/', slug: 'landing' },

    // ── Onboarding (interactive states) ──────────────────────────────────────
    { label: 'Onboarding · Step 1', path: '/onboarding', slug: 'onboarding-step1' },
    {
      label: 'Onboarding · Step 2',
      path: '/onboarding',
      slug: 'onboarding-step2',
      beforeShot: async (page) => {
        // Fill in the paste tab, click Continue
        await page.getByRole('button', { name: 'Paste text' }).click()
        await page.locator('textarea').fill(
          'Senior nurse with 7 years ICU experience. Led triage of 40+ patients daily. ' +
          'Trained 12 nurses. Implemented medication protocol reducing errors 30%. ' +
          'Skills: clinical triage, team leadership, process improvement.',
        )
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.waitForTimeout(400)
      },
    },
    {
      label: 'Onboarding · Step 3 (confirm profile)',
      path: '/onboarding',
      slug: 'onboarding-step3',
      beforeShot: async (page) => {
        // Go to paste tab and fill
        await page.getByRole('button', { name: 'Paste text' }).click()
        await page.locator('textarea').fill(
          'Senior nurse with 7 years ICU experience. Led triage of 40+ patients daily. ' +
          'Trained 12 nurses. Implemented medication protocol reducing errors 30%. ' +
          'Skills: clinical triage, team leadership, process improvement.',
        )
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.waitForTimeout(300)
        // Step 2: pick a role
        try {
          const select = page.locator('select').first()
          if (await select.isVisible({ timeout: 2000 })) {
            await select.selectOption({ index: 1 })
          }
          const cont2 = page.getByRole('button', { name: 'Continue' })
          if (await cont2.isVisible({ timeout: 2000 })) await cont2.click()
          await page.waitForTimeout(3000)
        } catch { /* step 2 may time out waiting for ingest — show whatever rendered */ }
      },
    },

    // ── Results pages (seeded session) ────────────────────────────────────────
    { label: 'Translation Map', path: `/results/${sessionId}/map`, slug: 'results-map' },
    {
      label: 'Résumé Editor · Normal',
      path: `/results/${sessionId}/resume`,
      slug: 'results-resume-normal',
    },
    {
      label: 'Résumé Editor · Diff mode',
      path: `/results/${sessionId}/resume`,
      slug: 'results-resume-diff',
      beforeShot: async (page) => {
        // Toggle diff/track-changes view if the button exists
        const btn = page.getByRole('button', { name: /diff|track.changes|compare/i })
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click()
          await page.waitForTimeout(500)
        }
      },
    },
    { label: 'Strategy Brief', path: `/results/${sessionId}/strategy`, slug: 'results-strategy' },

    // ── Matched Jobs (interactive states) ─────────────────────────────────────
    {
      label: 'Matched Jobs · All sources',
      path: `/results/${sessionId}/jobs`,
      slug: 'results-jobs-all',
    },
    {
      label: 'Matched Jobs · Reed filter',
      path: `/results/${sessionId}/jobs`,
      slug: 'results-jobs-reed',
      beforeShot: async (page) => {
        // Click on Reed source filter if present
        const filter = page.getByRole('button', { name: /reed/i })
        if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
          await filter.click()
          await page.waitForTimeout(400)
        }
      },
    },

    // ── Static strategy page ──────────────────────────────────────────────────
    { label: 'Strategy (static)', path: '/results/strategy', slug: 'results-strategy-static' },

    // ── Auth pages ────────────────────────────────────────────────────────────
    { label: 'Sign In', path: '/auth/signin', slug: 'auth-signin' },
    { label: 'Sign Up', path: '/auth/signup', slug: 'auth-signup' },

    // ── Settings ──────────────────────────────────────────────────────────────
    { label: 'Settings', path: '/settings', slug: 'settings' },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearDir(dir: string) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  fs.mkdirSync(dir, { recursive: true })
}

function seedSession() {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true })
  const file = path.join(SESSIONS_DIR, `${FIXTURE_SESSION_ID}.json`)
  fs.writeFileSync(file, JSON.stringify(FIXTURE_SESSION, null, 2))
  console.log(`  ✓ Seeded fixture session → ${file}`)
  return FIXTURE_SESSION_ID
}

async function waitForPort(port: number, timeout = 60_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const open = await new Promise<boolean>((resolve) => {
      const sock = new net.Socket()
      sock.setTimeout(800)
      sock.once('connect', () => { sock.destroy(); resolve(true) })
      sock.once('error', () => { sock.destroy(); resolve(false) })
      sock.once('timeout', () => { sock.destroy(); resolve(false) })
      sock.connect(port, '127.0.0.1')
    })
    if (open) return
    await new Promise((r) => setTimeout(r, 600))
  }
  throw new Error(`localhost:${port} did not open within ${timeout}ms`)
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer()
    srv.listen(0, () => {
      const addr = srv.address()
      srv.close(() => {
        if (addr && typeof addr === 'object') resolve(addr.port)
        else reject(new Error('Could not find free port'))
      })
    })
  })
}

async function startDevServer(port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    // Strip DATABASE_URL so the dev server uses file-based storage
    // where the fixture session lives — avoids needing DB migrations for screenshots
    const { DATABASE_URL: _drop, ...restEnv } = process.env
    void _drop
    const proc = spawn('npx', ['next', 'dev', '--port', String(port)], {
      cwd: process.cwd(),
      env: { ...restEnv, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'] as ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    const timer = setTimeout(() => reject(new Error('Dev server did not start within 60s')), 60_000)

    const onData = (d: Buffer) => {
      const line = d.toString()
      process.stdout.write(`  [next] ${line}`)
      // Next.js 15: "✓ Starting..." means the port is now listening
      if (line.includes('Starting')) {
        clearTimeout(timer)
        resolve(proc)
      }
    }

    proc.stdout?.on('data', onData)
    proc.stderr?.on('data', onData)
    proc.on('error', reject)
  })
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`
  return `${(n / 1024 / 1024).toFixed(1)}MB`
}

function generateContactSheet(rows: SummaryRow[]) {
  const bySlug: Record<string, SummaryRow[]> = {}
  for (const r of rows) {
    if (!bySlug[r.slug]) bySlug[r.slug] = []
    bySlug[r.slug].push(r)
  }

  const cards = Object.entries(bySlug).map(([slug, shots]) => {
    const label = shots[0].label
    const imgs = shots
      .map((s) => {
        const rel = path.relative(OUT_DIR, s.file).replace(/\\/g, '/')
        return `
          <figure style="flex:1;min-width:160px;text-align:center">
            <a href="${rel}" target="_blank">
              <img src="${rel}" alt="${s.label} @${s.width}" style="width:100%;border:1px solid #ddd;border-radius:4px"/>
            </a>
            <figcaption style="font-size:11px;color:#666;margin-top:4px">@${s.width}px</figcaption>
          </figure>`
      })
      .join('\n')

    return `
    <section style="margin-bottom:40px;padding-bottom:30px;border-bottom:1px solid #eee">
      <h2 style="font-family:sans-serif;font-size:15px;margin:0 0 12px;color:#111">${label}</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap">${imgs}</div>
    </section>`
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PivotPath Screenshots</title>
<style>
  body { margin: 0; padding: 32px; background: #f9f9f9; }
  h1 { font-family: sans-serif; font-size: 22px; margin: 0 0 8px; color: #0F1923; }
  p  { font-family: sans-serif; font-size: 13px; color: #666; margin: 0 0 32px; }
</style>
</head>
<body>
<h1>PivotPath · Screenshot Contact Sheet</h1>
<p>Generated ${new Date().toLocaleString()} · ${rows.length} screenshots</p>
${cards.join('\n')}
</body>
</html>`

  const indexPath = path.join(OUT_DIR, 'index.html')
  fs.writeFileSync(indexPath, html)
  return indexPath
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface SummaryRow {
  label: string
  slug: string
  width: number
  file: string
  size: string
  dims: string
}

async function main() {
  console.log('\n━━━ PivotPath screenshot runner ━━━\n')

  // 1. Clear output directory
  clearDir(OUT_DIR)
  console.log(`  ✓ Cleared ${OUT_DIR}`)

  // 2. Seed fixture session
  const sessionId = seedSession()

  // 3. Start dev server
  const port = await findFreePort()
  console.log(`  → Starting Next.js dev on port ${port}…`)
  const server = await startDevServer(port)

  const cleanup = () => {
    server.kill('SIGTERM')
    // Clean up seeded session
    const f = path.join(SESSIONS_DIR, `${FIXTURE_SESSION_ID}.json`)
    if (fs.existsSync(f)) fs.unlinkSync(f)
  }
  process.on('SIGINT', cleanup)
  process.on('exit', cleanup)

  try {
    // Poll port until TCP is accepting (max 30s)
    await waitForPort(port, 30_000)
    console.log(`  ✓ Dev server listening at http://localhost:${port}`)
    console.log('  → Warming up (first request triggers compilation — may take ~30s)…')
    // Warm up: hit the root so first compilation happens before screenshots
    await new Promise<void>((resolve) => {
      const req = http.get(`http://localhost:${port}/`, (res) => { res.resume(); resolve() })
      req.on('error', () => resolve())
      req.setTimeout(120_000, () => { req.destroy(); resolve() })
    })
    // Give it a moment after the warm-up response
    await new Promise((r) => setTimeout(r, 3000))
    console.log(`  ✓ App compiled and ready\n`)

    // 4. Launch browser
    const browser = await chromium.launch({ headless: true })
    const summary: SummaryRow[] = []
    const routes = buildRoutes(sessionId)

    for (const shot of routes) {
      const ctx = await browser.newContext({
        viewport: { width: WIDTHS[0], height: 900 },
        deviceScaleFactor: 2,
      })
      const page = await ctx.newPage()

      // Silence console noise from the app
      page.on('console', () => {})
      page.on('pageerror', () => {})

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        const url = `http://localhost:${port}${shot.path}`

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
          await page.evaluate(() => document.fonts.ready)
          await page.waitForLoadState('networkidle').catch(() => {})
          await page.waitForTimeout(300)

          // Run interactive setup if defined (only on first width to avoid repeated clicks)
          if (shot.beforeShot && width === WIDTHS[0]) {
            await shot.beforeShot(page, ctx).catch(() => {})
          } else if (shot.beforeShot && width !== WIDTHS[0]) {
            // Re-navigate and re-run interaction for other widths
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
            await page.evaluate(() => document.fonts.ready)
            await page.waitForLoadState('networkidle').catch(() => {})
            await shot.beforeShot(page, ctx).catch(() => {})
          }

          const filename = `${shot.slug}@${width}.png`
          const filepath = path.join(OUT_DIR, filename)
          await page.screenshot({ path: filepath, fullPage: true })

          const stat = fs.statSync(filepath)
          const dims = await page.evaluate(() => `${document.documentElement.scrollWidth * 2}×${document.documentElement.scrollHeight * 2}`)

          summary.push({ label: shot.label, slug: shot.slug, width, file: filepath, size: formatBytes(stat.size), dims })
          process.stdout.write(`  ✓ ${filename} (${formatBytes(stat.size)})\n`)
        } catch (err) {
          const filename = `${shot.slug}@${width}.png`
          process.stdout.write(`  ✗ ${filename} — ${err instanceof Error ? err.message.split('\n')[0] : err}\n`)
        }
      }

      await ctx.close()
    }

    await browser.close()

    // 5. Print summary table
    console.log('\n┌──────────────────────────────────────────────────────────────────────┐')
    console.log('│  Summary                                                             │')
    console.log('├──────────────────────────────────────────────────────────────────────┤')
    for (const r of summary) {
      const label = `${r.label} @${r.width}`.padEnd(42)
      const size = r.size.padStart(6)
      const dims = r.dims.padStart(13)
      console.log(`│  ${label} ${size}  ${dims}  │`)
    }
    console.log('└──────────────────────────────────────────────────────────────────────┘')

    // 6. Generate contact sheet
    const indexPath = generateContactSheet(summary)
    console.log(`\n  ✓ Contact sheet: ${indexPath}`)
    console.log(`  → Open in browser: file://${indexPath.replace(/\\/g, '/')}\n`)

  } finally {
    cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
