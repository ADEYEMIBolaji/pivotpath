/**
 * Pipeline stage functions — each calls Claude with tool_use and returns typed output.
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  ParsedProfile,
  TargetRole,
  TranslationMapResult,
  GapScorecardResult,
  RepositionedResume,
  StrategyBrief,
} from './types'
import {
  INGEST_TOOL,
  buildIngestPrompt,
  TRANSLATE_TOOL,
  buildTranslatePrompt,
  REWRITE_TOOL,
  buildRewritePrompt,
  STRATEGY_TOOL,
  buildStrategyPrompt,
} from './prompts'

const MODEL = 'claude-sonnet-4-6'

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and add your key.')
  return new Anthropic({ apiKey: key })
}

function extractToolInput<T>(response: Anthropic.Message): T {
  const block = response.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') {
    throw new Error(`Claude did not call the expected tool. Response: ${JSON.stringify(response.content).slice(0, 500)}`)
  }
  return block.input as T
}

// ─── Stage 1: Ingest (parse raw text → ParsedProfile) ────────────────────────

export async function runIngest(rawText: string, source: ParsedProfile['source']): Promise<ParsedProfile> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [INGEST_TOOL],
    tool_choice: { type: 'tool', name: INGEST_TOOL.name },
    messages: [{ role: 'user', content: buildIngestPrompt(rawText) }],
  })

  const parsed = extractToolInput<Omit<ParsedProfile, 'source' | 'rawText'>>(response)
  return { ...parsed, source, rawText: rawText.slice(0, 8000) }
}

// ─── Stage 2: Translate + Score ───────────────────────────────────────────────

interface TranslateOutput {
  rows: TranslationMapResult['rows']
  readiness: TranslationMapResult['readiness']
  competenciesHave: number
  competenciesTotal: number
  summaryCopy: string
  gaps: GapScorecardResult['cards']
}

export async function runTranslate(
  profile: ParsedProfile,
  target: TargetRole,
): Promise<{ translationMap: TranslationMapResult; gapScorecard: GapScorecardResult }> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [TRANSLATE_TOOL],
    tool_choice: { type: 'tool', name: TRANSLATE_TOOL.name },
    messages: [{ role: 'user', content: buildTranslatePrompt(profile, target) }],
  })

  const output = extractToolInput<TranslateOutput>(response)

  const translationMap: TranslationMapResult = {
    rows: output.rows,
    readiness: output.readiness,
    competenciesHave: output.competenciesHave,
    competenciesTotal: output.competenciesTotal,
    summaryCopy: output.summaryCopy,
  }

  const gapScorecard: GapScorecardResult = { cards: output.gaps }

  return { translationMap, gapScorecard }
}

// ─── Stage 3: Rewrite ─────────────────────────────────────────────────────────

export async function runRewrite(
  profile: ParsedProfile,
  target: TargetRole,
  translationMap: TranslationMapResult,
): Promise<RepositionedResume> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6144,
    tools: [REWRITE_TOOL],
    tool_choice: { type: 'tool', name: REWRITE_TOOL.name },
    messages: [{ role: 'user', content: buildRewritePrompt(profile, target, translationMap) }],
  })

  return extractToolInput<RepositionedResume>(response)
}

// ─── Stage 4: Strategy Brief ──────────────────────────────────────────────────

export async function runStrategy(
  profile: ParsedProfile,
  target: TargetRole,
  translationMap: TranslationMapResult,
  gapScorecard: GapScorecardResult,
): Promise<StrategyBrief> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [STRATEGY_TOOL],
    tool_choice: { type: 'tool', name: STRATEGY_TOOL.name },
    messages: [{ role: 'user', content: buildStrategyPrompt(profile, target, translationMap.readiness, gapScorecard) }],
  })

  return extractToolInput<StrategyBrief>(response)
}
