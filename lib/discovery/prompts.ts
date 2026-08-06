/**
 * Claude tool schemas and prompt builders for Discovery Mode.
 * Same convention as lib/prompts.ts: forced tool_use so output is always
 * structured JSON.
 */

import { INTAKE_PROMPTS } from './chip-seed'
import type { IntakeSelections, FunctionalSkill, DiscoveryRole } from './types'

// ─── Shared: render structured intake into prompt text ────────────────────────

/**
 * Resolves chip ids back to their label + signal from the seed data (never
 * trust a client-sent label/signal — see the intake route) and renders the
 * whole intake as prompt text shared by steps 2 and 3.
 */
function formatIntake(selections: IntakeSelections, otherNotes: string | null): string {
  const sections = INTAKE_PROMPTS.map((bank) => {
    const picked = selections[bank.id] ?? []
    if (picked.length === 0) return null

    const lines = picked.map(({ chipId, note }) => {
      const chip = bank.chips.find((c) => c.id === chipId)
      if (!chip) return null
      const noteText = note?.trim() ? ` — example given: "${note.trim()}"` : ''
      return `  - "${chip.label}" (signal: ${chip.signal})${noteText}`
    })

    const validLines = lines.filter((l): l is string => l !== null)
    if (validLines.length === 0) return null
    return `Q: ${bank.prompt}\n${validLines.join('\n')}`
  })

  const body = sections.filter((s): s is string => s !== null).join('\n\n')
  const other = otherNotes?.trim() ? `\n\nAnything else they added:\n"${otherNotes.trim()}"` : ''
  return body + other
}

// ─── Step 2: functional skills extraction ─────────────────────────────────────

export const SKILLS_MAP_TOOL = {
  name: 'output_functional_skills_map',
  description:
    'Output 4–6 dominant functional skills extracted from the intake answers, each justified by the person\'s own words',
  input_schema: {
    type: 'object' as const,
    properties: {
      functions: {
        type: 'array',
        minItems: 4,
        maxItems: 6,
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description:
                'A functional capability in plain language — e.g. "systems thinking", "troubleshooting", "relationship-building". Never a job title, industry, or tool name.',
            },
            summary: {
              type: 'string',
              description: 'One sentence on what this function looks like specifically for this person.',
            },
            evidence: {
              type: 'array',
              minItems: 1,
              maxItems: 3,
              items: { type: 'string' },
              description:
                "Short quotes or close paraphrases from the person's own selections/examples that demonstrate this function.",
            },
          },
          required: ['name', 'summary', 'evidence'],
        },
      },
    },
    required: ['functions'],
  },
}

export function buildSkillsMapPrompt(selections: IntakeSelections, otherNotes: string | null): string {
  return `You are analysing evidence a mid-career person has given about what they already do well. They do not know what role they want — that is the point. Your job is to name the *functions* underneath their examples, not to guess a job title.

They answered by tapping pointer chips (each pre-tagged with a likely functional-skill signal) rather than writing free text, and optionally added a one-line example under a chip. Treat each chip's signal as a hint, not a verdict — several chips pointing at the same underlying signal, or a specific example that sharpens or contradicts the hint, should carry more weight than any single tag.

Rules:
- Output 4–6 functions. Fewer if the evidence genuinely doesn't support more.
- Functions are capabilities, not jobs and not industries. "Coordination", "persuasion", "analysis", "teaching", "troubleshooting", "systems thinking", "relationship-building" are the right register. "Project manager", "healthcare", "Excel" are not.
- Every function must be earned by something they actually selected or wrote. Quote or closely paraphrase their chip labels or examples in the evidence — do not invent examples.
- Where several chips cluster around the same signal, that's a stronger signal than an isolated chip — say so implicitly by picking that function.
- Pay particular attention to selections under "what doesn't feel like real work" — unconscious competence is usually the strongest signal and the one they'd discount themselves.
- Do not flatter. If two chips point at the same function, name it once with both pieces of evidence rather than padding the list.

Their intake:
<intake>
${formatIntake(selections, otherNotes)}
</intake>`
}

// ─── Step 3: adjacent role surfacing ──────────────────────────────────────────

export const ADJACENT_ROLES_TOOL = {
  name: 'output_adjacent_roles',
  description: 'Output 5–10 plausible-fit roles in industries adjacent to the person’s current context',
  input_schema: {
    type: 'object' as const,
    properties: {
      roles: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'A real, currently-hired-for role title.' },
            industry: {
              type: 'string',
              description: 'The industry or sector this role sits in — should be adjacent to, not identical to, their current one.',
            },
            plainLanguageLine: {
              type: 'string',
              description:
                'One sentence, in plain everyday language, on what this role actually involves day-to-day — not a restatement of the title. Write it the way you\'d explain the job to a friend, starting "Basically, you..." or similar. This exists because unfamiliar-sounding titles can make someone dismiss a genuinely good-fit role — the line has to make the role legible on its own, without the title.',
            },
            whyFits: {
              type: 'string',
              description:
                'One line tying the role to their stated evidence. Reference what they actually selected/wrote, not generic role marketing.',
            },
            functionsUsed: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
              description: 'Which of their functional skills transfer directly. Use the exact function names from the skills map.',
            },
            gap: {
              type: 'string',
              description:
                'One honest gap or translation challenge — the thing that will actually be hard to evidence on a CV. Kept honest, not oversold.',
            },
          },
          required: ['title', 'industry', 'plainLanguageLine', 'whyFits', 'functionsUsed', 'gap'],
        },
      },
    },
    required: ['roles'],
  },
}

export function buildAdjacentRolesPrompt(
  functions: FunctionalSkill[],
  selections: IntakeSelections,
  otherNotes: string | null,
): string {
  const map = functions
    .map((f) => `- ${f.name}: ${f.summary}\n  evidence: ${f.evidence.join(' | ')}`)
    .join('\n')

  return `You are surfacing plausible-fit roles for someone mid-career who does not know what to target. You have their functional skills map and the raw intake it was built from.

Their functional skills map:
<skills_map>
${map}
</skills_map>

Their raw intake (for tone and context):
<intake>
${formatIntake(selections, otherNotes)}
</intake>

Rules:
- Suggest 5–10 roles across *adjacent* industries — sectors that use the same functions but that they are unlikely to have searched for themselves. Do not suggest the obvious next rung of the ladder they're already on.
- Spread across at least four distinct industries. Don't return eight variations of one job.
- Use real, currently-hired-for titles — don't invent a title to sound impressive or to fit the plain-language line better.
- The plain-language line matters as much as the title. A title like "Implementation Consultant" or "Revenue Operations Analyst" can read as confusing or intimidating even when it's a strong match — write the line so someone would understand and want the role from that sentence alone, before they've even parsed the title.
- "Why this fits" must tie to their stated evidence, in their terms.
- Every role gets exactly one honest gap. Real gaps: missing domain vocabulary, no portfolio artefact, a credential the market actually screens on. Do not soften it and do not invent a fake gap for balance.
- Use the exact function names from the skills map in functionsUsed.`
}

// ─── Bridge: shortlist comparison (before committing to one role) ────────────

export const ROLE_COMPARISON_TOOL = {
  name: 'output_role_comparison',
  description:
    'Output a day-to-day summary, an entry-barrier indicator, and a demand note for each shortlisted role, to help someone choose one to commit to',
  input_schema: {
    type: 'object' as const,
    properties: {
      roles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            roleId: { type: 'string', description: 'Must exactly match one of the provided role ids.' },
            dayToDay: {
              type: 'string',
              description:
                'Two or three concrete sentences on what a typical week actually looks like in this role — not a restatement of the title or the "why this fits" line.',
            },
            entryBarrier: {
              type: 'string',
              description:
                'A short phrase on how hard this specific person would find it to break in, referencing their actual stated gap where relevant — e.g. "Moderate — one portfolio artefact would close most of the gap" or "Low — this hires directly on skills they already have."',
            },
            demandNote: {
              type: 'string',
              description:
                'When a real UK live-postings count is given for this role, state it plainly and let it speak for itself (e.g. "47 live UK postings right now — one of the more available roles on your shortlist") — do not add a hedge to a real number. When no count is given, fall back to a short, honestly-hedged note reasoned from general knowledge, explicitly not live data.',
            },
          },
          required: ['roleId', 'dayToDay', 'entryBarrier', 'demandNote'],
        },
      },
    },
    required: ['roles'],
  },
}

export function buildRoleComparisonPrompt(roles: DiscoveryRole[], functions: FunctionalSkill[]): string {
  const functionsText = functions.map((f) => `- ${f.name}: ${f.summary}`).join('\n')
  const rolesText = roles
    .map((r) => {
      const liveData =
        r.postingCount === null
          ? '  live UK postings: not available — reason from general knowledge instead'
          : `  live UK postings right now: ${r.postingCount} (real Adzuna data — state this number directly in demandNote, don't hedge it)`
      return `- roleId: ${r.id}\n  title: ${r.title}\n  plain-language line: ${r.plainLanguageLine}\n  why it fits: ${r.whyFits}\n  their honest gap: ${r.gap}\n${liveData}`
    })
    .join('\n')

  return `This person is choosing ONE role from a shortlist to commit to as their pivot target. For each role below, give them the information they'd actually want before picking one: what the day-to-day looks like, how hard it would be for *them specifically* to break in, and how often it's actually hired for.

Their functional skills:
<skills>
${functionsText}
</skills>

Shortlisted roles:
<roles>
${rolesText}
</roles>

Rules:
- dayToDay must be concrete and specific to this role — what they'd actually spend most days doing, not marketing copy.
- entryBarrier should reference their actual stated gap where it's relevant, not a generic difficulty rating.
- demandNote: where a real live-postings count is given, state it plainly as the answer — that IS the demand signal, don't also add a hedge on top of it. Only fall back to hedged general-knowledge reasoning for roles with no count given.
- Return exactly one entry per role, using the roleId values given verbatim.`
}
