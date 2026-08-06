/**
 * Discovery Mode types — TEST BUILD (see /discovery-test).
 *
 * Kept separate from lib/types.ts so nothing in the main pivot flow depends on
 * this feature while it's behind the test flag.
 */

// ─── Step 1: evidence intake ──────────────────────────────────────────────────

/**
 * A single selectable pointer chip. `signal` is a hidden mapping to a likely
 * functional-skill hint — it never renders in the UI, but it means Step 2 has
 * structured signal to reason from even before any free text is written.
 *
 * Chip ids are persisted (as part of a stored intake run), so treat them as
 * stable once shipped — add new chips freely, but don't repurpose an id.
 */
export interface ChipOption {
  id: string
  label: string
  /** A likely functional-skill hint, e.g. "systems thinking" — a pointer for Claude, not a verdict. */
  signal: string
}

export interface PromptBank {
  id: string
  /** The question as shown to the user — deliberately evidence-based, never aspirational. */
  prompt: string
  chips: ChipOption[]
}

/** A chip the user tapped, plus their optional one-line example for it. */
export interface SelectedChip {
  chipId: string
  note?: string
}

/** Keyed by PromptBank.id. */
export type IntakeSelections = Record<string, SelectedChip[]>

export interface DiscoveryIntake {
  id: string
  userId: string | null
  selections: IntakeSelections
  /** The final open "anything else?" field — always optional. */
  otherNotes: string | null
  createdAt: string
}

// ─── Step 2: functional skills map ────────────────────────────────────────────

export interface FunctionalSkill {
  /** A functional capability — e.g. "systems thinking", never a job title. */
  name: string
  /** One line on what this looks like in their case. */
  summary: string
  /** Quotes or close paraphrases from their own intake answers. */
  evidence: string[]
}

export interface SkillsMap {
  runId: string
  functions: FunctionalSkill[]
}

// ─── Step 3: adjacent roles ───────────────────────────────────────────────────

export interface DiscoveryRole {
  id: string
  runId: string
  /** Original suggestion order — the tiebreaker when ranking the shortlist. */
  rank: number
  title: string
  industry: string
  whyFits: string
  /** Which of their functional skills transfer directly. */
  functionsUsed: string[]
  /** One honest gap or translation challenge. Not oversold. */
  gap: string
}

// ─── Step 4: reactions + shortlist ────────────────────────────────────────────

export type Reaction = 'like' | 'pass' | 'unsure'

export interface DiscoveryReaction {
  runId: string
  roleId: string
  reaction: Reaction
}

export interface ShortlistEntry {
  role: DiscoveryRole
  reaction: Reaction
}
