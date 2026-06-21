/**
 * Claude tool schemas and prompt builders for each pipeline stage.
 * All LLM calls use tool_use (forced) so output is always structured JSON.
 */

import type { ParsedProfile, TargetRole, TranslationMapResult, GapScorecardResult } from './types'

// ─── Ingest ───────────────────────────────────────────────────────────────────

export const INGEST_TOOL = {
  name: 'output_parsed_profile',
  description: 'Output a structured profile extracted from the résumé text',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' },
      headline: { type: 'string', description: 'e.g. "Registered Nurse with 8 years ICU experience"' },
      summary: { type: 'string', description: 'One paragraph summary if present' },
      roles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            company: { type: 'string' },
            dateRange: { type: 'string' },
            bullets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  flag: {
                    type: 'string',
                    description: 'Set to a short warning message if the bullet is too vague to translate (e.g., "Too vague — add specific outcome or metric")',
                  },
                },
                required: ['text'],
              },
            },
          },
          required: ['title', 'company', 'dateRange', 'bullets'],
        },
      },
      skills: { type: 'array', items: { type: 'string' } },
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            degree: { type: 'string' },
            institution: { type: 'string' },
            year: { type: 'string' },
            certifications: { type: 'array', items: { type: 'string' } },
          },
          required: ['degree', 'institution'],
        },
      },
    },
    required: ['roles', 'skills', 'education'],
  },
}

export function buildIngestPrompt(rawText: string): string {
  return `You are an expert résumé parser. Extract all information from the following résumé text into a structured profile.

Rules:
- Extract every role, bullet point, skill, and education item verbatim (paraphrase only to fix obvious OCR/formatting artefacts)
- Flag any bullet with \`flag\` if it is too vague to translate (e.g. "Responsible for operations" with no specifics)
- Skills: list unique, specific skills — remove generic filler like "Microsoft Office", "communication"
- If a field is absent, omit it rather than guessing

Résumé text:
<resume>
${rawText.slice(0, 12000)}
</resume>`
}

// ─── Translate + Score ────────────────────────────────────────────────────────

export const TRANSLATE_TOOL = {
  name: 'output_translation_map',
  description: 'Output the complete skills translation map and gap analysis',
  input_schema: {
    type: 'object' as const,
    properties: {
      rows: {
        type: 'array',
        description: '6–10 rows mapping user experience to target field vocabulary',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string', description: "User's original experience (verbatim or lightly paraphrased)" },
            to: { type: 'string', description: "Equivalent in the target field's language" },
            note: { type: 'string', description: 'One sentence explaining the mapping (optional)' },
            tier: { type: 'string', enum: ['high', 'partial', 'frame'] },
          },
          required: ['from', 'to', 'tier'],
        },
      },
      readiness: {
        type: 'object',
        properties: {
          score: { type: 'number', description: 'Pivot readiness 0–100 (be calibrated — most pivots are 45–75)' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          label: { type: 'string', description: 'One sentence: "[Confidence]. [Reason why this score]."' },
          strongestAsset: { type: 'string' },
          biggestGap: { type: 'string' },
        },
        required: ['score', 'confidence', 'label', 'strongestAsset', 'biggestGap'],
      },
      competenciesHave: { type: 'number', description: 'How many of the target role\'s core competencies the user already has' },
      competenciesTotal: { type: 'number', description: 'Total core competencies for the target role (typically 10–14)' },
      summaryCopy: { type: 'string', description: 'e.g. "You have 8 of 12 core Product competencies — stronger than most career-switchers at this stage."' },
      gaps: {
        type: 'array',
        description: 'Gap cards — 3 tiers',
        items: {
          type: 'object',
          properties: {
            tier: { type: 'string', enum: ['disqualifying', 'closable', 'nice-to-have'] },
            color: { type: 'string', description: '#C7553B for disqualifying, #E8A838 for closable, #2E6B6B for nice-to-have' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  note: { type: 'string' },
                  timeToClose: { type: 'string', description: 'e.g. "~3 wks", "1–2 mo"' },
                },
                required: ['name', 'note'],
              },
            },
          },
          required: ['tier', 'color', 'items'],
        },
      },
    },
    required: ['rows', 'readiness', 'competenciesHave', 'competenciesTotal', 'summaryCopy', 'gaps'],
  },
}

export function buildTranslatePrompt(profile: ParsedProfile, target: TargetRole): string {
  const profileSummary = [
    `Name: ${profile.name ?? 'Not provided'}`,
    `Current roles: ${profile.roles.map((r) => `${r.title} at ${r.company} (${r.dateRange})`).join('; ')}`,
    `Skills: ${profile.skills.slice(0, 20).join(', ')}`,
    `Education: ${profile.education.map((e) => `${e.degree} from ${e.institution}`).join('; ')}`,
    `Top bullets:\n${profile.roles
      .flatMap((r) => r.bullets.slice(0, 3).map((b) => `  • ${b.text}`))
      .slice(0, 15)
      .join('\n')}`,
  ].join('\n')

  const jdSection = target.jobDescription
    ? `\nTarget job description:\n<jd>\n${target.jobDescription.slice(0, 3000)}\n</jd>`
    : ''

  return `You are a senior career coach specialising in cross-industry pivots.

Analyse this professional's background and produce an honest translation map showing how their experience maps to their target role.

Background:
<profile>
${profileSummary}
</profile>

Target: ${target.title} in ${target.function} / ${target.industry}${jdSection}

Rules:
- HIGH tier: direct transfer, language can be swapped with minimal framing
- PARTIAL tier: real experience exists but needs reframing to land in the target context
- FRAME tier: weak evidence or missing — honest to include but needs building
- Readiness score: be honest. If they're a strong match, say so. If there are real gaps, reflect that.
- Never invent experience. Only map what's actually in the profile.
- Gap cards: include ALL three tiers. Disqualifying = would screen them out immediately. Closable = can be addressed in 1–3 months. Nice-to-have = wouldn't hurt to develop.`
}

// ─── Rewrite ──────────────────────────────────────────────────────────────────

export const REWRITE_TOOL = {
  name: 'output_repositioned_resume',
  description: 'Output the repositioned résumé targeting the new field',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: { type: 'string', description: '3–4 sentence opening that leads with the pivot narrative (no "results-driven" clichés)' },
      roles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            meta: { type: 'string', description: 'Company · Date range' },
            bullets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  original: { type: 'string' },
                  repositioned: { type: 'string', description: 'Rewritten in target field vocabulary' },
                  rationale: { type: 'string', description: 'One sentence: why this reframe is honest and relevant to the target role' },
                },
                required: ['original', 'repositioned', 'rationale'],
              },
            },
          },
          required: ['title', 'meta', 'bullets'],
        },
      },
      newSkills: { type: 'array', items: { type: 'string' }, description: 'Skills reprioritised/retitled in target field vocabulary' },
      oldSkills: { type: 'array', items: { type: 'string' }, description: 'Original skills kept but de-emphasised' },
      missingItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tier: { type: 'string', enum: ['disqualifying', 'closable', 'nice-to-have'] },
            color: { type: 'string' },
            timeToClose: { type: 'string' },
            name: { type: 'string' },
            note: { type: 'string' },
            action: { type: 'string', description: 'Concrete action to close this gap (e.g. "Complete Google PM certificate")' },
          },
          required: ['tier', 'color', 'timeToClose', 'name', 'note', 'action'],
        },
      },
    },
    required: ['summary', 'roles', 'newSkills', 'oldSkills', 'missingItems'],
  },
}

export function buildRewritePrompt(
  profile: ParsedProfile,
  target: TargetRole,
  translationMap: TranslationMapResult,
): string {
  return `You are an expert résumé writer specialising in career pivots.

Rewrite this professional's résumé for their target role. Use the translation map as your guide.

Profile:
<profile>
${JSON.stringify({ roles: profile.roles, skills: profile.skills }, null, 2).slice(0, 6000)}
</profile>

Target: ${target.title} — ${target.function} / ${target.industry}

Translation map (use this vocabulary):
<map>
${translationMap.rows.map((r) => `${r.from} → ${r.to} [${r.tier}]`).join('\n')}
</map>

Rules:
- Every repositioned bullet must be traceable to the original — no invented facts
- Use the action verbs, frameworks, and vocabulary of the target field
- Summary should lead with pivot narrative, not "results-driven professional"
- missingItems must match the gap scorecard — don't invent new gaps
- newSkills: reframe existing skills in target language (e.g. "Triage prioritisation" → "Prioritisation under ambiguity")
- Keep bullets specific and metric-backed where the original has metrics`
}

// ─── Strategy Brief ───────────────────────────────────────────────────────────

export const STRATEGY_TOOL = {
  name: 'output_strategy_brief',
  description: 'Output the personalised strategy brief for the career transition',
  input_schema: {
    type: 'object' as const,
    properties: {
      bestFitCompanies: { type: 'array', items: { type: 'string' }, description: '4–6 company types/names that are realistic entry points' },
      bestFitRationale: { type: 'string', description: 'One sentence explaining why these companies are the right target' },
      avoidCompanies: { type: 'array', items: { type: 'string' }, description: '2–3 company types to avoid (e.g. "large enterprises without structured PM rotations")' },
      bridgeRoles: {
        type: 'array',
        description: '2–3 intermediate roles that build toward the target',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            why: { type: 'string' },
          },
          required: ['title', 'why'],
        },
      },
      originAdvantage: {
        type: 'array',
        description: '3–4 advantages specific to coming from their background',
        items: {
          type: 'object',
          properties: {
            original: { type: 'string', description: 'How it is known in their current field' },
            translated: { type: 'string', description: 'How it maps to the target field' },
          },
          required: ['original', 'translated'],
        },
      },
      originNarrative: { type: 'string', description: '2–3 sentence "origin story" the user can use when networking' },
      plan: {
        type: 'array',
        description: '3–4 action phases',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'e.g. "Week 1", "Weeks 2–4", "Month 2"' },
            actions: { type: 'array', items: { type: 'string' }, description: '3 concrete actions' },
          },
          required: ['label', 'actions'],
        },
      },
      expectations: {
        type: 'array',
        description: '3 expectation cards: timeline, salary, search-difficulty',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'e.g. "Timeline", "Salary", "Search difficulty"' },
            color: { type: 'string', description: '#2E6B6B for positive, #E8A838 for moderate, #C7553B for challenging' },
            headline: { type: 'string', description: 'e.g. "3–6 months"' },
            note: { type: 'string', description: 'One sentence of context' },
          },
          required: ['label', 'color', 'headline', 'note'],
        },
      },
    },
    required: ['bestFitCompanies', 'bestFitRationale', 'avoidCompanies', 'bridgeRoles', 'originAdvantage', 'originNarrative', 'plan', 'expectations'],
  },
}

export function buildStrategyPrompt(
  profile: ParsedProfile,
  target: TargetRole,
  readiness: TranslationMapResult['readiness'],
  gapScorecard: GapScorecardResult,
): string {
  const gapSummary = gapScorecard.cards
    .map((c) => `${c.tier}: ${c.items.map((i) => i.name).join(', ')}`)
    .join('\n')

  return `You are a senior career coach writing a personalised transition strategy.

Profile background: ${profile.roles.map((r) => `${r.title} at ${r.company}`).join(', ')}
Target role: ${target.title} — ${target.function} / ${target.industry}
Readiness score: ${readiness.score}/100 (${readiness.confidence} confidence)
Strongest asset: ${readiness.strongestAsset}
Biggest gap: ${readiness.biggestGap}

Gap summary:
${gapSummary}

Write a concrete, honest strategy brief. Avoid generic advice. Make it specific to their background and target.
The plan should address the disqualifying gaps first. The bridge roles should be realistic, not aspirational.
The origin advantage should highlight what makes someone from their specific background valuable in the target field.`
}
