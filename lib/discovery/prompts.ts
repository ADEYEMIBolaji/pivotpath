/**
 * Claude tool schemas and prompt builders for Discovery Mode.
 * Same convention as lib/prompts.ts: forced tool_use so output is always
 * structured JSON.
 */

import { INTAKE_QUESTIONS, type IntakeAnswers, type FunctionalSkill } from './types'

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
                "Short quotes or close paraphrases from the person's own answers that demonstrate this function.",
            },
          },
          required: ['name', 'summary', 'evidence'],
        },
      },
    },
    required: ['functions'],
  },
}

function formatAnswers(answers: IntakeAnswers): string {
  return INTAKE_QUESTIONS.filter((q) => answers[q.id]?.trim())
    .map((q) => `Q: ${q.prompt}\nA: ${answers[q.id].trim()}`)
    .join('\n\n')
}

export function buildSkillsMapPrompt(answers: IntakeAnswers): string {
  return `You are analysing evidence a mid-career person has given about what they already do well. They do not know what role they want — that is the point. Your job is to name the *functions* underneath their examples, not to guess a job title.

Rules:
- Output 4–6 functions. Fewer if the evidence genuinely doesn't support more.
- Functions are capabilities, not jobs and not industries. "Coordination", "persuasion", "analysis", "teaching", "troubleshooting", "systems thinking", "relationship-building" are the right register. "Project manager", "healthcare", "Excel" are not.
- Every function must be earned by something they actually wrote. Quote or closely paraphrase their words in the evidence — do not invent examples.
- Pay particular attention to the things they describe as easy or as "not real work". Unconscious competence is usually the strongest signal and the one they discount.
- Do not flatter. If two answers point at the same function, say it once with both pieces of evidence rather than padding the list.

Their answers:
<intake>
${formatAnswers(answers)}
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
            whyFits: {
              type: 'string',
              description:
                'One line tying the role to their stated evidence. Reference what they actually said, not generic role marketing.',
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
          required: ['title', 'industry', 'whyFits', 'functionsUsed', 'gap'],
        },
      },
    },
    required: ['roles'],
  },
}

export function buildAdjacentRolesPrompt(
  functions: FunctionalSkill[],
  answers: IntakeAnswers,
): string {
  const map = functions
    .map((f) => `- ${f.name}: ${f.summary}\n  evidence: ${f.evidence.join(' | ')}`)
    .join('\n')

  return `You are surfacing plausible-fit roles for someone mid-career who does not know what to target. You have their functional skills map and the raw evidence it was built from.

Their functional skills map:
<skills_map>
${map}
</skills_map>

Their raw intake answers (for tone and context):
<intake>
${formatAnswers(answers)}
</intake>

Rules:
- Suggest 5–10 roles across *adjacent* industries — sectors that use the same functions but that they are unlikely to have searched for themselves. Do not suggest the obvious next rung of the ladder they're already on.
- Spread across at least four distinct industries. Don't return eight variations of one job.
- "Why this fits" must tie to their stated evidence, in their terms.
- Every role gets exactly one honest gap. Real gaps: missing domain vocabulary, no portfolio artefact, a credential the market actually screens on. Do not soften it and do not invent a fake gap for balance.
- Use the exact function names from the skills map in functionsUsed.`
}
