/**
 * PivotPath — Job Aggregation types
 *
 * Three distinct layers:
 *   RawListing   — what each SourceAdapter returns (provider shape, normalised to common fields)
 *   CanonicalJob — one deduplicated, freshness-checked record stored in Postgres
 *   ScoredJob    — CanonicalJob + per-user fit scoring (never persisted; computed at query time)
 */

// ─── Source identifiers ───────────────────────────────────────────────────────

export type SourceName =
  | 'reed'           // Reed API (official)
  | 'adzuna'         // Adzuna API (covers Indeed UK)
  | 'linkedin'       // LinkedIn Jobs API / partner feed
  | 'otta'           // Otta API
  | 'nhs'            // NHS Jobs Atom/XML feed
  | 'civil-service'  // Civil Service Jobs XML feed

// ─── Layer 1: RawListing ─────────────────────────────────────────────────────
// Each adapter MUST return this shape. Adapters handle all provider-specific
// quirks (NHS pay bands, CS grades, salary strings) and normalise into this.

export interface RawListing {
  /** Provider's own stable identifier */
  externalId: string
  title: string
  employer: string
  sourceName: SourceName
  /** Canonical link to the live application page */
  sourceUrl: string
  /** Human-readable location string, e.g. "London" or "Manchester (Hybrid)" */
  location: string
  /** null = not stated; true = fully remote; false = on-site / hybrid */
  remote: boolean | null
  /** Always annual GBP. Parse "£30k–£35k", NHS Band 6, CS Grade 7 → numbers. */
  salaryMin: number | null
  salaryMax: number | null
  currency: 'GBP'
  /** ISO 8601 UTC string */
  postedAt: string
  /** Full plain-text description (no HTML) */
  descriptionText: string
  /** Skills extracted from the description — used for fit scoring */
  rawSkills: string[]
}

// ─── Layer 2: CanonicalJob ────────────────────────────────────────────────────
// Stored in Postgres. One row per unique role (after dedup). Updated in place
// when a fresher posting supersedes a stale one.

export interface CanonicalJob {
  /** Our UUID (Postgres primary key) */
  id: string
  /**
   * Dedup key: normalise(employer) + '::' + normalise(title) + '::' + normalise(location)
   * Normalisation: lowercase → strip punctuation → collapse whitespace → sorted tokens.
   * Indexed UNIQUE in Postgres.
   */
  dedupKey: string
  title: string
  employer: string
  /** The freshest source is canonical */
  primarySource: SourceName
  primarySourceUrl: string
  /** Other boards this role appeared on — drives "Also listed on…" badge */
  alsoListedOn: SourceName[]
  location: string
  remote: boolean | null
  salaryMin: number | null
  salaryMax: number | null
  currency: 'GBP'
  /** ISO 8601 — from the freshest provider posting */
  postedAt: string
  descriptionText: string
  rawSkills: string[]
  /** ISO 8601 — when we last confirmed sourceUrl returns non-404 */
  lastVerifiedAt: string
  /** ISO 8601 — when the pipeline last fetched and processed this record */
  lastRefreshedAt: string
  /** True if a recent HEAD/GET of sourceUrl returned 404 — excluded from results */
  deadLink: boolean
}

// ─── Layer 3: ScoredJob ──────────────────────────────────────────────────────
// CanonicalJob + per-user fit data. Computed at query time in /api/jobs.
// Never written to the database.

export interface ScoredJob extends CanonicalJob {
  /** 0–100; derived from skill overlap × readiness modifier */
  fitScore: number
  /**
   * Teal 80+, Amber 72–79, Neutral <72
   * Mirrors the ConfidenceBadge colour logic for visual consistency.
   */
  fitBucket: 'high' | 'partial' | 'neutral'
  /** Intersection of job.rawSkills and the user's translated skills */
  matchedSkills: string[]
  /**
   * Gap items from the user's GapScorecard that this role requires.
   * Displayed as warning flags: "Wants SQL — in your closable list"
   */
  gapFlags: GapFlag[]
  /**
   * Which of the user's bridge roles this job maps to.
   * Used to group results into bridge-role sections in the UI.
   */
  bridgeRoleGroup: string | null
}

export interface GapFlag {
  gapName: string
  severity: 'disqualifying' | 'closable' | 'nice-to-have'
}

// ─── SourceAdapter interface ──────────────────────────────────────────────────
// Implementing one file per source; register in lib/jobs/registry.ts.

export interface JobQuery {
  /** Search keywords — adapters join with OR/AND as their API supports */
  keywords: string[]
  /** Free-text location for APIs that accept it, e.g. "United Kingdom" */
  location: string
  remoteOnly?: boolean
  /** Hard cap on results per call; adapters may fetch multiple pages up to this */
  maxResults?: number
}

export interface SourceAdapter {
  readonly name: SourceName
  /**
   * Fetch raw listings matching the query.
   * - Must return RawListing[] only (no provider-specific fields leaking out).
   * - Must respect rateLimit — caller (the scheduler) spaces calls accordingly.
   * - Must throw a typed SourceError on non-retriable failures.
   */
  fetch(query: JobQuery): Promise<RawListing[]>
  /** Scheduler uses this to space calls; default 60 rpm is conservative. */
  readonly rateLimit: RateLimit
}

export interface RateLimit {
  requestsPerMinute: number
  /** Some APIs (Reed) require a minimum delay between paginated calls */
  minDelayMs?: number
}

export class SourceError extends Error {
  constructor(
    public readonly source: SourceName,
    message: string,
    public readonly retriable: boolean = true,
    public readonly statusCode?: number,
  ) {
    super(`[${source}] ${message}`)
    this.name = 'SourceError'
  }
}

// ─── Pipeline event types ─────────────────────────────────────────────────────
// Returned by the ingest pipeline and surfaced in the UI.

export interface IngestSummary {
  fetchedAt: string
  totalFetched: number
  duplicatesMerged: number
  staleRemoved: number
  deadLinksRemoved: number
  bySource: Record<SourceName, { fetched: number; new: number; updated: number }>
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface JobsApiResponse {
  jobs: ScoredJob[]
  /** Grouped by bridge role — keys match session.strategy.bridgeRoles[].title */
  groups: JobGroup[]
  /** True when withheld because the viewer is on the free tier (matched jobs are paid). */
  locked?: boolean
  meta: {
    total: number
    lastRefreshedAt: string
    duplicatesMerged: number
    staleRemoved: number
  }
}

export interface JobGroup {
  bridgeRole: string
  jobs: ScoredJob[]
}

// ─── Persistence shapes (Postgres row types) ─────────────────────────────────

export interface JobRow extends CanonicalJob {
  // Postgres-specific — not in CanonicalJob to keep it DB-agnostic
  createdAt: string
  updatedAt: string
}

export interface SavedJobRow {
  id: string
  sessionId: string
  jobId: string
  savedAt: string
}

export interface ApplicationEventRow {
  id: string
  sessionId: string
  jobId: string
  source: SourceName
  appliedAt: string
}
