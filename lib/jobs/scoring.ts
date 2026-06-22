/**
 * Per-user fit scoring.
 * Takes CanonicalJob[] + AnalysisSession → ScoredJob[], sorted by fitScore desc.
 */

import type { CanonicalJob, ScoredJob, GapFlag } from './types'
import type { AnalysisSession } from '@/lib/types'

const HIGH_THRESHOLD    = 80
const PARTIAL_THRESHOLD = 72

/**
 * fitScore = (matchedSkills / max(jobSkills, 1)) * 100
 *            * readinessModifier
 *
 * readinessModifier: 0.6 → 1.0 range so low readiness dampens but doesn't zero out.
 * Formula: 0.6 + 0.4 * (readiness/100)^0.5
 *   readiness=100 → modifier=1.0
 *   readiness=64  → modifier=0.92
 *   readiness=36  → modifier=0.84
 *   readiness=0   → modifier=0.60
 */
function computeFitScore(
  matchedCount: number,
  jobSkillCount: number,
  readinessScore: number,
): number {
  const rawFit = (matchedCount / Math.max(jobSkillCount, 1)) * 100
  const modifier = 0.6 + 0.4 * Math.sqrt(readinessScore / 100)
  return Math.min(100, Math.round(rawFit * modifier))
}

function fitBucket(score: number): ScoredJob['fitBucket'] {
  if (score >= HIGH_THRESHOLD)    return 'high'
  if (score >= PARTIAL_THRESHOLD) return 'partial'
  return 'neutral'
}

/**
 * Derive which bridge role this job maps to.
 * Matches by checking if any bridge role title tokens appear in the job title.
 */
function matchBridgeRole(
  jobTitle: string,
  bridgeRoles: Array<{ title: string }> | undefined,
): string | null {
  if (!bridgeRoles?.length) return null
  const lower = jobTitle.toLowerCase()
  for (const br of bridgeRoles) {
    const tokens = br.title.toLowerCase().split(/\s+/)
    const matchCount = tokens.filter((t) => lower.includes(t)).length
    if (matchCount / tokens.length >= 0.5) return br.title
  }
  return null
}

export function scoreJobs(
  jobs: CanonicalJob[],
  session: AnalysisSession,
): ScoredJob[] {
  const { translationMap, gapScorecard, strategy } = session
  const readiness = translationMap?.readiness.score ?? 50

  // Build the user's translated skill set (lowercase for matching)
  const translatedSkills = new Set(
    [
      ...(translationMap?.rows.map((r) => r.to.toLowerCase()) ?? []),
      ...(session.resume?.newSkills.map((s) => s.toLowerCase()) ?? []),
    ].flatMap((s) => s.split(/[,/\s]+/)),
  )

  // Build gap name set for flag matching
  const gapItems = gapScorecard?.cards.flatMap((c) =>
    c.items.map((item) => ({ name: item.name.toLowerCase(), severity: c.tier })),
  ) ?? []

  const scored: ScoredJob[] = jobs.map((job): ScoredJob => {
    const jobSkills = job.rawSkills.map((s) => s.toLowerCase())

    // Match skills: check if any translated skill token appears in a job skill
    const matched = jobSkills.filter((js) =>
      [...translatedSkills].some((ts) => js.includes(ts) || ts.includes(js)),
    )

    // Gap flags: check if any job skill overlaps a known gap
    const gapFlags: GapFlag[] = gapItems
      .filter((g) => jobSkills.some((js) => js.includes(g.name) || g.name.includes(js)))
      .map((g) => ({ gapName: g.name, severity: g.severity }))

    const fitScore = computeFitScore(matched.length, jobSkills.length, readiness)

    return {
      ...job,
      fitScore,
      fitBucket: fitBucket(fitScore),
      matchedSkills: matched,
      gapFlags,
      bridgeRoleGroup: matchBridgeRole(job.title, strategy?.bridgeRoles),
    }
  })

  // Sort: high fit first, then by postedAt
  return scored.sort((a, b) => {
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore
    return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  })
}

/** Group scored jobs by bridge role, with an "Other" bucket for unmatched */
export function groupByBridgeRole(
  jobs: ScoredJob[],
  bridgeRoles: Array<{ title: string }>,
): Array<{ bridgeRole: string; jobs: ScoredJob[] }> {
  const groups = new Map<string, ScoredJob[]>()

  for (const br of bridgeRoles) {
    groups.set(br.title, [])
  }
  groups.set('Other roles', [])

  for (const job of jobs) {
    const key = job.bridgeRoleGroup ?? 'Other roles'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(job)
  }

  return [...groups.entries()]
    .filter(([, jobs]) => jobs.length > 0)
    .map(([bridgeRole, jobs]) => ({ bridgeRole, jobs }))
}
