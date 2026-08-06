/**
 * Discovery Mode types — TEST BUILD (see /discovery-test).
 *
 * Kept separate from lib/types.ts so nothing in the main pivot flow depends on
 * this feature while it's behind the test flag.
 */

// ─── Step 1: evidence intake ──────────────────────────────────────────────────

export interface IntakeQuestion {
  id: string
  /** The question as shown to the user — deliberately evidence-based, never aspirational. */
  prompt: string
  hint: string
}

/** The intake questions. Ids are persisted, so treat them as stable. */
export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'asked_for_help',
    prompt: 'What do people ask you for help with, unprompted?',
    hint: 'Colleagues, friends, family — whoever comes to you without being asked.',
  },
  {
    id: 'praised_for',
    prompt: "What have you been praised for in the last 2 years?",
    hint: 'Give a specific instance — who said it, and what had you just done?',
  },
  {
    id: 'fix_unasked',
    prompt: 'What problems do you fix without being asked?',
    hint: "The things you quietly sort out because they're bothering you.",
  },
  {
    id: 'not_real_work',
    prompt: "What's a task you do that doesn't feel like \"real work\" to you?",
    hint: 'Often the thing you\'re best at — it feels too easy to count.',
  },
  {
    id: 'lose_track_of_time',
    prompt: 'When did you last lose track of time at work? What were you doing?',
    hint: 'Absorption is evidence. Describe the actual task, not the job title.',
  },
  {
    id: 'others_avoid',
    prompt: "What do other people find hard that you don't?",
    hint: 'Something colleagues dread, put off, or hand to you.',
  },
]

export type IntakeAnswers = Record<string, string>

export interface DiscoveryIntake {
  id: string
  userId: string | null
  answers: IntakeAnswers
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
