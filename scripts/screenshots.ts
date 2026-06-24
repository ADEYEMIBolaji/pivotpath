/**
 * PivotPath automated screenshot script
 *
 * Usage:  npm run shots
 *
 * Covers every key screen in the investor demo flow:
 *   Landing → Sign Up → Onboarding (3 steps) → Translation Map →
 *   Resume Editor → Strategy Brief → Matched Jobs (with Apply button) →
 *   Settings (signed-in) → Privacy Policy → Terms of Service
 *
 * Demo data is NEVER committed to git:
 *   - Session data lives in .sessions/  (gitignored)
 *   - Job data lives in .jobs/          (gitignored)
 *   - Both are cleaned up after the run
 *   - SCREENSHOT_MODE=1 env var is only set in the spawned dev server
 */

import { chromium, type Page, type BrowserContext } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import http from 'http'
import net from 'net'
import { execSync, spawn } from 'child_process'
import type { ChildProcess } from 'child_process'

void execSync // suppress unused import warning

// ─── Config ───────────────────────────────────────────────────────────────────

const WIDTHS = [1440, 390] as const
const OUT_DIR = path.join(process.cwd(), 'screenshots')
const SESSIONS_DIR = path.join(process.cwd(), '.sessions')
const JOBS_DIR = path.join(process.cwd(), '.jobs')
const FIXTURE_SESSION_ID = 'screenshot-demo-session'

// Demo credentials matching auth.ts SCREENSHOT_MODE bypass
const DEMO_EMAIL = 'demo@screenshot.pivotpath'
const DEMO_PASSWORD = 'screenshot-demo-2024'

// ─── Fixture: Session ─────────────────────────────────────────────────────────

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
        company: "St. Thomas' Hospital",
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
    education: [{ degree: 'BSc Nursing', institution: "King's College London", year: '2017' }],
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
      { tier: 'disqualifying', color: '#C7553B', items: [{ name: 'No shipped digital product', note: 'Most health tech PMs need at least one portfolio piece', timeToClose: '2–3 mo' }] },
      { tier: 'closable', color: '#E8A838', items: [
        { name: 'Product management fundamentals', note: 'Structured PM certification fills this fast', timeToClose: '~3 wks' },
        { name: 'SQL / data querying', note: 'Health tech PMs are expected to self-serve analytics', timeToClose: '1–2 mo' },
      ]},
      { tier: 'nice-to-have', color: '#2E6B6B', items: [
        { name: 'Agile / Scrum certification', note: 'Useful signal but not a gate' },
        { name: 'HL7 / FHIR standards knowledge', note: 'Differentiated for health tech specifically' },
      ]},
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
    bestFitRationale: "These organisations value clinical credibility alongside PM skills — your background is a genuine differentiator, not a workaround.",
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
    originNarrative: "I spent seven years designing and improving care systems at the sharp end of clinical delivery. Every day I was triaging competing demands, shipping protocol changes and coordinating specialists — the same skills product management requires, just in a different context.",
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

// ─── Fixture: Jobs ────────────────────────────────────────────────────────────
// ScoredJob shape — what the jobs API returns. We intercept the route call
// in Playwright so these are served directly without hitting any API.

const FIXTURE_JOBS = {
  jobs: [
    {
      id: 'job-001', dedupKey: 'nhsd::associate-product-manager::london',
      title: 'Associate Product Manager', employer: 'NHS Digital',
      primarySource: 'nhs', alsoListedOn: ['linkedin'],
      location: 'London (Hybrid)', remote: true,
      salaryMin: 45000, salaryMax: 52000, currency: 'GBP',
      postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      sourceUrl: 'https://jobs.nhs.uk/vacancy/associate-pm',
      descriptionText: 'Join NHS Digital to lead patient-facing digital products. Clinical background highly valued. Work with engineering and design squads to shape the future of NHS services.',
      rawSkills: ['product management', 'stakeholder engagement', 'agile', 'healthcare', 'user research'],
      fitScore: 87, fitBucket: 'high',
      matchedSkills: ['Clinical triage → Backlog prioritisation', 'Cross-functional coordination', 'Process improvement', 'Healthcare data systems'],
      gapFlags: [{ gapName: 'PM portfolio', severity: 'closable' }],
      bridgeRoleGroup: 'Clinical Product Analyst',
      isDead: false, isStale: false,
    },
    {
      id: 'job-002', dedupKey: 'babylon::clinical-product-analyst::london',
      title: 'Clinical Product Analyst', employer: 'Babylon Health',
      primarySource: 'reed', alsoListedOn: [],
      location: 'London', remote: false,
      salaryMin: 42000, salaryMax: 48000, currency: 'GBP',
      postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      sourceUrl: 'https://www.reed.co.uk/jobs/babylon-clinical-product-analyst',
      descriptionText: 'Babylon Health is looking for a Clinical Product Analyst to bridge clinical operations and product development. RN or clinical background preferred.',
      rawSkills: ['clinical knowledge', 'data analysis', 'product analysis', 'sql', 'stakeholder management'],
      fitScore: 82, fitBucket: 'high',
      matchedSkills: ['Clinical background', 'Data documentation', 'Stakeholder coordination', 'Process improvement'],
      gapFlags: [{ gapName: 'SQL', severity: 'closable' }],
      bridgeRoleGroup: 'Clinical Product Analyst',
      isDead: false, isStale: false,
    },
    {
      id: 'job-003', dedupKey: 'emis::product-manager::leeds',
      title: 'Product Manager — Clinical Systems', employer: 'EMIS Health',
      primarySource: 'adzuna', alsoListedOn: ['linkedin'],
      location: 'Leeds (Hybrid)', remote: true,
      salaryMin: 50000, salaryMax: 60000, currency: 'GBP',
      postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      sourceUrl: 'https://www.adzuna.co.uk/jobs/emis-product-manager',
      descriptionText: 'EMIS Health builds software used in 55% of GP practices. We want a PM with genuine clinical experience who understands how clinicians actually work.',
      rawSkills: ['product management', 'clinical systems', 'gp workflow', 'agile', 'hl7'],
      fitScore: 74, fitBucket: 'high',
      matchedSkills: ['Clinical workflow knowledge', 'EPIC EMR experience', 'Process improvement', 'Team coordination'],
      gapFlags: [{ gapName: 'PM portfolio', severity: 'closable' }, { gapName: 'HL7/FHIR', severity: 'nice-to-have' }],
      bridgeRoleGroup: null,
      isDead: false, isStale: false,
    },
    {
      id: 'job-004', dedupKey: 'patientaccess::implementation-consultant::remote',
      title: 'Clinical Implementation Consultant', employer: 'PatientAccess / Egton',
      primarySource: 'linkedin', alsoListedOn: [],
      location: 'Remote (UK)', remote: true,
      salaryMin: 38000, salaryMax: 45000, currency: 'GBP',
      postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      sourceUrl: 'https://linkedin.com/jobs/patientaccess-implementation',
      descriptionText: 'Help NHS practices adopt our digital patient platform. You\'ll be the bridge between clinical staff and the product team. Perfect stepping stone into PM.',
      rawSkills: ['clinical experience', 'implementation', 'change management', 'nhs', 'stakeholder training'],
      fitScore: 79, fitBucket: 'high',
      matchedSkills: ['NHS experience', 'Training & onboarding', 'Stakeholder coordination', 'Process improvement'],
      gapFlags: [],
      bridgeRoleGroup: 'Clinical Implementation Consultant',
      isDead: false, isStale: false,
    },
    {
      id: 'job-005', dedupKey: 'nhseng::digital-transformation::birmingham',
      title: 'Digital Transformation Lead', employer: 'NHS England',
      primarySource: 'nhs', alsoListedOn: ['civil-service'],
      location: 'Birmingham / Remote', remote: true,
      salaryMin: 47126, salaryMax: 53219, currency: 'GBP',
      postedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      sourceUrl: 'https://jobs.nhs.uk/vacancy/digital-transformation-lead',
      descriptionText: 'Lead digital transformation initiatives across an ICS. Band 8a. Clinical leadership background strongly preferred. Drive adoption of digital tools across clinical teams.',
      rawSkills: ['digital transformation', 'clinical leadership', 'change management', 'stakeholder management', 'nhs'],
      fitScore: 71, fitBucket: 'partial',
      matchedSkills: ['Clinical leadership', 'Team training', 'Stakeholder coordination'],
      gapFlags: [{ gapName: 'Digital product experience', severity: 'closable' }],
      bridgeRoleGroup: null,
      isDead: false, isStale: false,
    },
    {
      id: 'job-006', dedupKey: 'featurespace::operations::cambridge',
      title: 'Operations Analyst', employer: 'Featurespace (HealthTech)',
      primarySource: 'adzuna', alsoListedOn: [],
      location: 'Cambridge', remote: false,
      salaryMin: 35000, salaryMax: 42000, currency: 'GBP',
      postedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      sourceUrl: 'https://www.adzuna.co.uk/jobs/featurespace-ops',
      descriptionText: 'Support product and engineering operations at a fast-growing healthtech company. Strong analytical and process improvement background required.',
      rawSkills: ['operations', 'process improvement', 'data analysis', 'project management'],
      fitScore: 58, fitBucket: 'partial',
      matchedSkills: ['Process improvement', 'Documentation', 'Team coordination'],
      gapFlags: [{ gapName: 'SQL / data', severity: 'closable' }],
      bridgeRoleGroup: null,
      isDead: false, isStale: false,
    },
  ],
  groups: [
    {
      bridgeRole: 'Clinical Product Analyst',
      jobs: [], // populated from jobs array by bridge role
    },
    {
      bridgeRole: 'Clinical Implementation Consultant',
      jobs: [],
    },
  ],
  meta: {
    total: 6,
    lastRefreshedAt: new Date().toISOString(),
    duplicatesMerged: 2,
    staleRemoved: 0,
    savedCount: 1,
    bySource: { nhs: 2, reed: 1, adzuna: 2, linkedin: 1 },
  },
}

// ─── Route definitions ────────────────────────────────────────────────────────

interface Shot {
  label: string
  path: string
  slug: string
  section: string
  beforeShot?: (page: Page, ctx: BrowserContext) => Promise<void>
}

function buildRoutes(sessionId: string): Shot[] {
  return [
    // ── 1. Marketing ──────────────────────────────────────────────────────────
    {
      label: 'Landing page',
      path: '/',
      slug: 'landing',
      section: '1 · Marketing',
    },

    // ── 2. Auth flow ──────────────────────────────────────────────────────────
    {
      label: 'Sign Up',
      path: '/auth/signup',
      slug: 'auth-signup',
      section: '2 · Auth flow',
    },
    {
      label: 'Sign In',
      path: '/auth/signin',
      slug: 'auth-signin',
      section: '2 · Auth flow',
    },

    // ── 3. Onboarding wizard ──────────────────────────────────────────────────
    {
      label: 'Onboarding · Step 1 — Upload CV',
      path: '/onboarding',
      slug: 'onboarding-step1',
      section: '3 · Onboarding',
    },
    {
      label: 'Onboarding · Step 2 — Paste CV text',
      path: '/onboarding',
      slug: 'onboarding-step2',
      section: '3 · Onboarding',
      beforeShot: async (page) => {
        await page.getByRole('button', { name: 'Paste text' }).click().catch(() => {})
        const ta = page.locator('textarea').first()
        if (await ta.isVisible({ timeout: 2000 }).catch(() => false)) {
          await ta.fill(
            'Senior Registered Nurse, 7 years ICU & Emergency · Royal London Hospital (2019–present): led triage for 40+ patients, trained 12 nurses, cut medication errors 30%. ' +
            'St Thomas Hospital (2017–2019): A&E nurse, participated in NHS EPR rollout. ' +
            'Skills: clinical triage, patient prioritisation, care plan design, team leadership, training, process improvement, EPIC EMR. BSc Nursing, King\'s College London 2017.',
          )
        }
        await page.waitForTimeout(300)
      },
    },
    {
      label: 'Onboarding · Step 3 — Target role',
      path: '/onboarding',
      slug: 'onboarding-step3',
      section: '3 · Onboarding',
      beforeShot: async (page) => {
        // Fill CV text
        await page.getByRole('button', { name: 'Paste text' }).click().catch(() => {})
        const ta = page.locator('textarea').first()
        if (await ta.isVisible({ timeout: 2000 }).catch(() => false)) {
          await ta.fill('Senior Registered Nurse, 7 years ICU experience. Led triage of 40+ patients daily. Trained 12 nurses. Reduced medication errors by 30%.')
        }
        // Click Continue
        const cont1 = page.getByRole('button', { name: 'Continue' }).first()
        if (await cont1.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cont1.click()
          await page.waitForTimeout(2000)
        }
      },
    },

    // ── 4. Results — Translation Map ─────────────────────────────────────────
    {
      label: 'Translation Map — skill rows',
      path: `/results/${sessionId}/map`,
      slug: 'results-map',
      section: '4 · Your pivot results',
    },

    // ── 5. Results — Resume Editor ────────────────────────────────────────────
    {
      label: 'Résumé Editor',
      path: `/results/${sessionId}/resume`,
      slug: 'results-resume',
      section: '4 · Your pivot results',
    },

    // ── 6. Results — Strategy Brief ───────────────────────────────────────────
    {
      label: 'Strategy Brief',
      path: `/results/${sessionId}/strategy`,
      slug: 'results-strategy',
      section: '4 · Your pivot results',
    },

    // ── 7. Matched Jobs ───────────────────────────────────────────────────────
    {
      label: 'Matched Jobs — with Apply buttons',
      path: `/results/${sessionId}/jobs`,
      slug: 'results-jobs',
      section: '5 · Matched jobs',
      beforeShot: async (page) => {
        // Wait for jobs to load from the fixture store
        await page.waitForTimeout(2000)
      },
    },

    // ── 8. Pricing ────────────────────────────────────────────────────────────
    {
      label: 'Pricing page',
      path: '/pricing',
      slug: 'pricing',
      section: '6 · Pricing',
    },

    // ── 9. Settings (signed-in state) ─────────────────────────────────────────
    {
      label: 'Settings — signed in',
      path: '/settings',
      slug: 'settings-signed-in',
      section: '7 · Account & settings',
      // beforeShot signs in via demo credentials; called once before this shot group
    },

    // ── 9. Legal pages ────────────────────────────────────────────────────────
    {
      label: 'Privacy Policy',
      path: '/legal/privacy',
      slug: 'legal-privacy',
      section: '8 · Legal',
    },
    {
      label: 'Terms of Service',
      path: '/legal/terms',
      slug: 'legal-terms',
      section: '8 · Legal',
    },
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
}

function seedJobs() {
  fs.mkdirSync(JOBS_DIR, { recursive: true })
  // File store shape: { jobs: Record<id, CanonicalJob>, savedJobs: [], applications: [], lastModified }
  const db = {
    jobs: Object.fromEntries(FIXTURE_JOBS.jobs.map((j) => [j.id, j])),
    savedJobs: [{ id: 'sv-001', sessionId: FIXTURE_SESSION_ID, jobId: 'job-001', savedAt: new Date().toISOString() }],
    applications: [],
    lastModified: new Date().toISOString(),
  }
  const file = path.join(JOBS_DIR, 'db.json')
  fs.writeFileSync(file, JSON.stringify(db, null, 2))
  console.log(`  ✓ Seeded ${FIXTURE_JOBS.jobs.length} fixture jobs → ${file}`)
}

function cleanupFixtures() {
  // Session
  const sessionFile = path.join(SESSIONS_DIR, `${FIXTURE_SESSION_ID}.json`)
  if (fs.existsSync(sessionFile)) { fs.unlinkSync(sessionFile); console.log(`  ✓ Cleaned up fixture session`) }
  // Jobs db
  const jobsFile = path.join(JOBS_DIR, 'db.json')
  if (fs.existsSync(jobsFile)) { fs.unlinkSync(jobsFile); console.log(`  ✓ Cleaned up fixture jobs`) }
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

function deleteNextScreenshotsDir() {
  const dir = path.join(process.cwd(), '.next-screenshots')
  if (!fs.existsSync(dir)) return
  try {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log('  ✓ Cleared .next-screenshots build dir')
  } catch {
    // File still locked — best effort
    console.warn('  ⚠ .next-screenshots still locked — will attempt to continue')
  }
}

async function startDevServer(port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    // Strip DATABASE_URL → file-based stores (session + jobs)
    // Add SCREENSHOT_MODE=1 → enables demo auth bypass in auth.ts
    const proc = spawn('npx', ['next', 'dev', '--port', String(port)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        SCREENSHOT_MODE: '1',
        NEXT_TELEMETRY_DISABLED: '1',
        // Use a separate build dir so it never conflicts with a running dev server's .next/trace lock
        NEXT_DIST_DIR: '.next-screenshots',
        // Override DATABASE_URL to empty — forces file-based stores (.sessions/ .jobs/)
        // even though .env.local has a real Postgres URL.
        // Next.js respects process.env values already set over .env.local.
        DATABASE_URL: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'] as ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    let resolved = false
    const timer = setTimeout(() => { if (!resolved) reject(new Error('Dev server did not start within 120s')) }, 120_000)

    const onData = (d: Buffer) => {
      const line = d.toString()
      process.stdout.write(`  [next] ${line}`)
      if (!resolved && line.includes('Starting')) {
        resolved = true
        clearTimeout(timer)
        resolve(proc)
      }
    }

    proc.stdout?.on('data', onData)
    proc.stderr?.on('data', onData)
    proc.on('error', (err) => { if (!resolved) reject(err) })
    proc.on('exit', (code) => {
      if (!resolved && code !== null && code !== 0) reject(new Error(`Dev server exited with code ${code}`))
    })
  })
}

/**
 * Sign in via the UI and return the browser context that now holds the auth cookie.
 * Used for the settings screenshot so it shows the signed-in state.
 */
async function signInDemo(port: number, browser: import('@playwright/test').Browser): Promise<BrowserContext> {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  try {
    await page.goto(`http://localhost:${port}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.locator('input[type="email"]').fill(DEMO_EMAIL)
    await page.locator('input[type="password"]').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    // Wait for redirect away from /auth/signin
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: 15_000 }).catch(() => {})
    console.log(`  ✓ Demo sign-in successful`)
  } catch (err) {
    console.warn(`  ⚠ Demo sign-in failed: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
  }
  await page.close()
  return ctx
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`
  return `${(n / 1024 / 1024).toFixed(1)}MB`
}

// ─── Contact sheet generator ─────────────────────────────────────────────────

interface SummaryRow { label: string; slug: string; section: string; width: number; file: string; size: string; dims: string }

function generateContactSheet(rows: SummaryRow[]) {
  // Group by section then slug
  const bySec: Record<string, Record<string, SummaryRow[]>> = {}
  for (const r of rows) {
    if (!bySec[r.section]) bySec[r.section] = {}
    if (!bySec[r.section][r.slug]) bySec[r.section][r.slug] = []
    bySec[r.section][r.slug].push(r)
  }

  const secHtml = Object.entries(bySec).map(([section, slugMap]) => {
    const cards = Object.entries(slugMap).map(([, shots]) => {
      const label = shots[0].label
      const imgs = shots.map((s) => {
        const rel = path.relative(OUT_DIR, s.file).replace(/\\/g, '/')
        return `
          <figure style="flex:1;min-width:140px;text-align:center;margin:0">
            <a href="${rel}" target="_blank">
              <img src="${rel}" alt="${s.label} @${s.width}" loading="lazy"
                style="width:100%;border-radius:6px;border:1px solid #ddd;display:block"/>
            </a>
            <figcaption style="font-size:10px;color:#888;margin-top:4px">@${s.width}px · ${s.size}</figcaption>
          </figure>`
      }).join('\n')

      return `
        <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #f0f0f0">
          <p style="font-family:sans-serif;font-size:13px;font-weight:600;margin:0 0 10px;color:#111">${label}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">${imgs}</div>
        </div>`
    }).join('\n')

    return `
      <section style="margin-bottom:48px">
        <h2 style="font-family:sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0F1923;background:#F2EDE4;padding:6px 12px;border-radius:4px;display:inline-block;margin:0 0 20px">${section}</h2>
        ${cards}
      </section>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PivotPath · Demo Screenshots</title>
<style>
  body   { margin:0; padding:40px 48px; background:#f9f9f9; }
  header { display:flex; align-items:center; justify-content:space-between; margin-bottom:40px; }
  h1     { font-family:sans-serif; font-size:24px; font-weight:700; margin:0; color:#0F1923; }
  .meta  { font-family:sans-serif; font-size:12px; color:#888; margin-top:4px; }
  .toc   { font-family:sans-serif; font-size:12px; display:flex; flex-wrap:wrap; gap:8px 20px; margin-bottom:40px; }
  .toc a { color:#E8A838; text-decoration:none; font-weight:500; }
  .toc a:hover { text-decoration:underline; }
</style>
</head>
<body>
<header>
  <div>
    <h1>PivotPath · Demo Screenshots</h1>
    <p class="meta">Generated ${new Date().toLocaleString('en-GB')} · ${rows.length} screenshots · ${Object.keys(bySec).length} sections</p>
  </div>
</header>
<nav class="toc">
  ${Object.keys(bySec).map((s) => `<a href="#${s.replace(/\s/g, '-')}">${s}</a>`).join('\n  ')}
</nav>
${Object.entries(bySec).map(([section, slugMap]) => {
  const anchor = section.replace(/\s/g, '-')
  const inner = Object.entries(slugMap).map(([, shots]) => {
    const label = shots[0].label
    const imgs = shots.map((s) => {
      const rel = path.relative(OUT_DIR, s.file).replace(/\\/g, '/')
      return `<figure style="flex:1;min-width:140px;text-align:center;margin:0"><a href="${rel}" target="_blank"><img src="${rel}" loading="lazy" style="width:100%;border-radius:6px;border:1px solid #ddd;display:block"/></a><figcaption style="font-size:10px;color:#888;margin-top:4px">@${s.width}px · ${s.size}</figcaption></figure>`
    }).join('')
    return `<div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #f0f0f0"><p style="font-family:sans-serif;font-size:13px;font-weight:600;margin:0 0 10px;color:#111">${label}</p><div style="display:flex;gap:10px;flex-wrap:wrap">${imgs}</div></div>`
  }).join('')
  return `<section id="${anchor}" style="margin-bottom:56px"><h2 style="font-family:sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0F1923;background:#F2EDE4;padding:6px 12px;border-radius:4px;display:inline-block;margin:0 0 20px">${section}</h2>${inner}</section>`
}).join('\n')}
</body>
</html>`

  const indexPath = path.join(OUT_DIR, 'index.html')
  fs.writeFileSync(indexPath, html)
  return indexPath
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n━━━ PivotPath screenshot runner ━━━\n')

  // 1. Clear output directory
  clearDir(OUT_DIR)
  console.log(`  ✓ Cleared ${OUT_DIR}`)

  // 2. Seed fixture data (never committed — both paths are gitignored)
  seedSession()
  seedJobs()

  // 3. Start dev server
  const port = await findFreePort()
  // Delete previous screenshot build dir to release any .next-screenshots/trace lock
  deleteNextScreenshotsDir()

  console.log(`  → Starting Next.js dev on port ${port} (SCREENSHOT_MODE=1, no DATABASE_URL)…`)
  const server = await startDevServer(port)

  const cleanup = () => {
    // On Windows with shell:true, kill the entire process tree to release file locks
    if (process.platform === 'win32' && server.pid) {
      try { execSync(`taskkill /T /F /PID ${server.pid} 2>nul`, { stdio: 'ignore' }) } catch { /* already gone */ }
    } else {
      server.kill('SIGTERM')
    }
    cleanupFixtures()
  }
  process.on('SIGINT', cleanup)
  process.on('exit', cleanup)

  try {
    await waitForPort(port, 30_000)
    console.log(`  ✓ Dev server listening at http://localhost:${port}`)
    console.log('  → Waiting for app to compile and serve a 200 (can take ~60s)…')

    // Retry GET / until we get a non-5xx response (compilation done)
    const warmupStart = Date.now()
    let gotOk = false
    while (Date.now() - warmupStart < 120_000) {
      const statusCode = await new Promise<number>((resolve) => {
        const req = http.get(`http://localhost:${port}/`, (res) => { res.resume(); resolve(res.statusCode ?? 0) })
        req.on('error', () => resolve(0))
        req.setTimeout(10_000, () => { req.destroy(); resolve(0) })
      })
      if (statusCode > 0 && statusCode < 500) { gotOk = true; break }
      await new Promise((r) => setTimeout(r, 2000))
    }
    if (!gotOk) throw new Error('App did not serve a valid response within 120s')
    await new Promise((r) => setTimeout(r, 2000))
    console.log(`  ✓ App compiled and ready\n`)

    // 4. Launch browser
    const browser = await chromium.launch({ headless: true })

    // 5. Sign in demo account once — reuse context for settings
    const authedCtx = await signInDemo(port, browser)

    const summary: SummaryRow[] = []
    const routes = buildRoutes(FIXTURE_SESSION_ID)

    for (const shot of routes) {
      // Settings page uses the signed-in browser context
      // Settings and onboarding require an authenticated session
      const useAuthed = shot.slug.startsWith('settings') || shot.slug.startsWith('onboarding')

      for (const width of WIDTHS) {
        // For auth-needing pages: reuse authed context
        // For all others: fresh anonymous context per width
        const ctx = useAuthed
          ? authedCtx
          : await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 })

        const page = await ctx.newPage()
        page.on('console', () => {})
        page.on('pageerror', () => {})

        if (useAuthed) {
          await page.setViewportSize({ width, height: 900 })
        }

        const url = `http://localhost:${port}${shot.path}`

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
          await page.evaluate(() => document.fonts.ready)
          await page.waitForLoadState('networkidle').catch(() => {})
          await page.waitForTimeout(400)

          if (shot.beforeShot) {
            if (width === WIDTHS[0]) {
              await shot.beforeShot(page, ctx).catch(() => {})
            } else {
              await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
              await page.evaluate(() => document.fonts.ready)
              await page.waitForLoadState('networkidle').catch(() => {})
              await shot.beforeShot(page, ctx).catch(() => {})
            }
          }

          const filename = `${shot.slug}@${width}.png`
          const filepath = path.join(OUT_DIR, filename)
          await page.screenshot({ path: filepath, fullPage: true })

          const stat = fs.statSync(filepath)
          const dims = await page.evaluate(() => `${document.documentElement.scrollWidth * 2}×${document.documentElement.scrollHeight * 2}`)
          summary.push({ label: shot.label, slug: shot.slug, section: shot.section, width, file: filepath, size: formatBytes(stat.size), dims })
          process.stdout.write(`  ✓ ${filename} (${formatBytes(stat.size)}) — ${shot.label}\n`)
        } catch (err) {
          const filename = `${shot.slug}@${width}.png`
          process.stdout.write(`  ✗ ${filename} — ${err instanceof Error ? err.message.split('\n')[0] : err}\n`)
        }

        await page.close()
        if (!useAuthed) await ctx.close()
      }
    }

    await authedCtx.close()
    await browser.close()

    // 6. Print summary
    const bySection: Record<string, number> = {}
    for (const r of summary) {
      bySection[r.section] = (bySection[r.section] ?? 0) + 1
    }
    console.log('\n┌────────────────────────────────────────────────┐')
    console.log('│  Summary by section                            │')
    console.log('├────────────────────────────────────────────────┤')
    for (const [sec, count] of Object.entries(bySection)) {
      console.log(`│  ${sec.padEnd(38)} ${String(count).padStart(3)} shots │`)
    }
    console.log(`├────────────────────────────────────────────────┤`)
    console.log(`│  Total${String(summary.length).padStart(37)} shots │`)
    console.log('└────────────────────────────────────────────────┘')

    // 7. Generate contact sheet
    const indexPath = generateContactSheet(summary)
    console.log(`\n  ✓ Contact sheet → ${indexPath}`)
    console.log(`  → Open in browser: file://${indexPath.replace(/\\/g, '/')}\n`)

  } finally {
    cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
