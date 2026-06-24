/**
 * Per-user fit scoring.
 * Takes CanonicalJob[] + AnalysisSession → ScoredJob[], sorted by fitScore desc.
 */

import type { CanonicalJob, ScoredJob, GapFlag } from './types'
import type { AnalysisSession } from '@/lib/types'

const HIGH_THRESHOLD    = 72
const PARTIAL_THRESHOLD = 50

// Common words to ignore when matching role-title relevance
const STOP = new Set([
  'and', 'the', 'of', 'for', 'to', 'in', 'a', 'an', 'with', 'on', 'at',
  'senior', 'junior', 'lead', 'head', 'associate', 'assistant', 'trainee',
])

const readinessModifier = (r: number) => 0.6 + 0.4 * Math.sqrt(Math.max(0, Math.min(100, r)) / 100)

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP.has(t))
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
  const { translationMap, gapScorecard, strategy, target, resume, profile } = session
  const readiness = translationMap?.readiness.score ?? 50
  const modifier = readinessModifier(readiness)

  // The user's strengths as phrases (e.g. "stakeholder coordination").
  // We test whether each appears anywhere in the job text — coverage of the
  // user's profile, NOT the job's skill list (which would reward sparse jobs).
  const uniqueUserSkills = [...new Set(
    [
      ...(translationMap?.rows.map((r) => r.to) ?? []),
      ...(resume?.newSkills ?? []),
      ...(profile?.skills ?? []),
    ].map((s) => s.toLowerCase().trim()).filter((s) => s.length >= 3),
  )]
  // Significant tokens of the user's skills (phrases rarely appear verbatim in
  // job text, so we match on meaningful words like "stakeholder", "analysis").
  const userSkillTokens = [...new Set(tokenize(uniqueUserSkills.join(' ')))].filter((t) => t.length >= 4)

  // Role-title relevance: tokens from the target role + bridge roles
  const targetTokens = [...new Set(
    tokenize([
      target?.title ?? '',
      target?.function ?? '',
      ...(strategy?.bridgeRoles?.map((b) => b.title) ?? []),
    ].join(' ')),
  )]

  const gapItems = gapScorecard?.cards.flatMap((c) =>
    c.items.map((item) => ({ name: item.name.toLowerCase(), severity: c.tier })),
  ) ?? []

  const scored: ScoredJob[] = jobs.map((job): ScoredJob => {
    const title = job.title.toLowerCase()
    const text = `${title} ${job.descriptionText} ${job.rawSkills.join(' ')}`.toLowerCase()

    // Skill coverage: how many of the user's skill-tokens the job calls for
    const matchedTokens = userSkillTokens.filter((t) => text.includes(t))
    const skillScore = Math.min(1, matchedTokens.length / 8)

    // Readable chips: the user's skill phrases that have any token in the job
    const matchedSkills = uniqueUserSkills.filter((p) =>
      tokenize(p).some((t) => t.length >= 4 && text.includes(t)),
    ).slice(0, 6)

    // How well the job title matches the target / bridge roles
    const titleHits = targetTokens.filter((t) => title.includes(t)).length
    const titleScore = targetTokens.length ? Math.min(1, titleHits / Math.min(3, targetTokens.length)) : 0

    const bridgeRoleGroup = matchBridgeRole(job.title, strategy?.bridgeRoles)
    const bridgeBoost = bridgeRoleGroup ? 0.1 : 0

    const base = Math.min(1, 0.5 * skillScore + 0.4 * titleScore + bridgeBoost)
    const fitScore = Math.min(100, Math.round(base * 100 * modifier))

    const gapFlags: GapFlag[] = gapItems
      .filter((g) => text.includes(g.name))
      .map((g) => ({ gapName: g.name, severity: g.severity }))

    return {
      ...job,
      fitScore,
      fitBucket: fitBucket(fitScore),
      matchedSkills,
      gapFlags: gapFlags.slice(0, 3),
      bridgeRoleGroup,
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
