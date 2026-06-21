/**
 * PivotPath — Shared TypeScript types
 *
 * These types model the full analysis pipeline:
 *   ParsedProfile → TargetRole → TranslationMapResult → RepositionedResume → StrategyBrief
 *
 * They are the source of truth for API request/response shapes,
 * pipeline prompt schemas, and component props.
 */

// ─── Ingestion ────────────────────────────────────────────────────────────────

export interface ParsedRole {
  title: string
  company: string
  dateRange: string
  bullets: ParsedBullet[]
}

export interface ParsedBullet {
  text: string
  /** Set by the extractor when a bullet is too vague to translate well. */
  flag?: string
}

export interface ParsedEducation {
  degree: string
  institution: string
  year?: string
  certifications?: string[]
}

export interface ParsedProfile {
  name?: string
  headline?: string
  summary?: string
  roles: ParsedRole[]
  skills: string[]
  education: ParsedEducation[]
  /** Source used during ingestion */
  source: 'upload' | 'linkedin' | 'paste'
  /** Raw text retained for reference */
  rawText?: string
}

// ─── Target role ──────────────────────────────────────────────────────────────

export interface TargetRole {
  industry: string            // e.g. "Technology"
  function: string            // e.g. "Product"
  title: string               // e.g. "Product Manager"
  /** User's own words if they described it */
  userDescription?: string
  /** Full job description pasted by the user — highest-signal input */
  jobDescription?: string
  /** Representative title chips shown back to the user for confirmation */
  representativeTitles?: string[]
}

// ─── Translation Map ──────────────────────────────────────────────────────────

export type ConfidenceTier = 'high' | 'partial' | 'frame'

export interface TranslationRow {
  from: string
  to: string
  /** Explanatory copy shown below the row */
  note?: string
  tier: ConfidenceTier
}

export interface ReadinessResult {
  score: number                         // 0–100
  confidence: 'low' | 'medium' | 'high'
  label: string                         // e.g. "Medium confidence. A strong base…"
  strongestAsset: string
  biggestGap: string
}

export interface TranslationMapResult {
  rows: TranslationRow[]
  readiness: ReadinessResult
  competenciesHave: number
  competenciesTotal: number
  /** One-sentence summary copy */
  summaryCopy: string
}

// ─── Gap Scorecard ────────────────────────────────────────────────────────────

export type GapTier = 'disqualifying' | 'closable' | 'nice-to-have'

export interface GapItem {
  name: string
  note: string
  /** e.g. "~3 wks", "1–2 mo" */
  timeToClose?: string
}

export interface GapCard {
  tier: GapTier
  color: string   // brand hex — '#C7553B' | '#E8A838' | '#2E6B6B'
  items: GapItem[]
}

export interface GapScorecardResult {
  cards: GapCard[]
}

// ─── Repositioned Résumé ──────────────────────────────────────────────────────

export interface RepositionedBullet {
  original: string
  repositioned: string
  /** Why this specific reframe is honest and relevant */
  rationale: string
}

export interface RepositionedRole {
  title: string
  meta: string
  bullets: RepositionedBullet[]
}

export interface RepositionedResume {
  summary: string
  roles: RepositionedRole[]
  /** Skills reprioritised in the target field's vocabulary */
  newSkills: string[]
  /** Original skills — kept but de-emphasised */
  oldSkills: string[]
  /** Gaps the résumé alone cannot fix */
  missingItems: MissingItem[]
}

export interface MissingItem {
  tier: GapTier
  color: string
  timeToClose: string
  name: string
  note: string
  action: string
}

// ─── Strategy Brief ───────────────────────────────────────────────────────────

export interface BridgeRole {
  title: string
  why: string
}

export interface OriginAdvantageItem {
  original: string    // e.g. "High-stakes triage"
  translated: string  // e.g. "Prioritisation under constraint"
}

export interface ActionWeek {
  label: string       // e.g. "Week 1", "Weeks 3–4"
  actions: string[]
}

export interface Expectation {
  label: string       // e.g. "Timeline"
  color: string       // brand hex
  headline: string    // e.g. "3–6 months"
  note: string
}

export interface StrategyBrief {
  bestFitCompanies: string[]
  bestFitRationale: string
  avoidCompanies: string[]
  bridgeRoles: BridgeRole[]
  originAdvantage: OriginAdvantageItem[]
  originNarrative: string
  plan: ActionWeek[]
  expectations: Expectation[]
}

// ─── Full session ─────────────────────────────────────────────────────────────

/**
 * An AnalysisSession is the top-level entity stored in the database.
 * Steps are populated progressively as the pipeline runs.
 */
export interface AnalysisSession {
  id: string
  /** user id if authenticated, null for anonymous */
  userId: string | null
  profile: ParsedProfile
  target: TargetRole
  translationMap?: TranslationMapResult
  gapScorecard?: GapScorecardResult
  resume?: RepositionedResume
  strategy?: StrategyBrief
  createdAt: string
  updatedAt: string
}

// ─── Pipeline stage status ────────────────────────────────────────────────────

export type PipelineStage = 'ingest' | 'translate' | 'score' | 'rewrite' | 'strategise'

export type StageStatus = 'idle' | 'pending' | 'running' | 'done' | 'error'

export interface PipelineState {
  sessionId: string | null
  currentStage: PipelineStage | null
  stages: Record<PipelineStage, StageStatus>
  error: string | null
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export type ApiResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string }
