/**
 * Pipeline stage functions.
 *
 * Supports two providers:
 *   'claude' — Anthropic claude-sonnet-4-6 (default)
 *   'grok'   — xAI grok-3 via OpenAI-compatible API
 *
 * Both use structured tool/function calling so output is always typed JSON.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Tool as AnthropicSDKTool } from '@anthropic-ai/sdk/resources/messages/messages'
import OpenAI from 'openai'
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

export type Provider = 'claude' | 'grok'

const CLAUDE_MODEL = 'claude-sonnet-4-6'
const GROK_MODEL = 'grok-3'

// ─── Clients ──────────────────────────────────────────────────────────────────

function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set.')
  return new Anthropic({ apiKey: key })
}

function getGrokClient(): OpenAI {
  const key = process.env.XAI_API_KEY
  if (!key) throw new Error('XAI_API_KEY is not set. Add it to .env.local to use Grok.')
  return new OpenAI({ apiKey: key, baseURL: 'https://api.x.ai/v1' })
}

// ─── Anthropic tool → OpenAI function conversion ─────────────────────────────

type AnthropicTool = AnthropicSDKTool

function toOpenAIFunction(tool: AnthropicTool): OpenAI.Chat.ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.input_schema as Record<string, unknown>,
    },
  }
}

// ─── Call wrappers ────────────────────────────────────────────────────────────

async function callClaude<T>(
  tool: AnthropicTool,
  prompt: string,
  maxTokens: number,
): Promise<T> {
  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content: prompt }],
  })
  const block = response.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') {
    throw new Error(`Claude did not call the expected tool. Response: ${JSON.stringify(response.content).slice(0, 500)}`)
  }
  return block.input as T
}

async function callGrok<T>(
  tool: AnthropicTool,
  prompt: string,
  maxTokens: number,
): Promise<T> {
  const client = getGrokClient()
  const response = await client.chat.completions.create({
    model: GROK_MODEL,
    max_tokens: maxTokens,
    tools: [toOpenAIFunction(tool)],
    tool_choice: { type: 'function', function: { name: tool.name } },
    messages: [{ role: 'user', content: prompt }],
  })
  const call = response.choices[0]?.message?.tool_calls?.[0] as
    | { function: { arguments: string } }
    | undefined
  if (!call) {
    throw new Error(`Grok did not call the expected function. Response: ${JSON.stringify(response.choices[0]?.message).slice(0, 500)}`)
  }
  return JSON.parse(call.function.arguments) as T
}

async function callLLM<T>(
  provider: Provider,
  tool: AnthropicTool,
  prompt: string,
  maxTokens: number,
): Promise<T> {
  return provider === 'grok'
    ? callGrok<T>(tool, prompt, maxTokens)
    : callClaude<T>(tool, prompt, maxTokens)
}

// ─── Stage 1: Ingest ──────────────────────────────────────────────────────────

export async function runIngest(
  rawText: string,
  source: ParsedProfile['source'],
  provider: Provider = 'grok',
): Promise<ParsedProfile> {
  const parsed = await callLLM<Omit<ParsedProfile, 'source' | 'rawText'>>(
    provider,
    INGEST_TOOL,
    buildIngestPrompt(rawText),
    4096,
  )
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
  provider: Provider = 'grok',
): Promise<{ translationMap: TranslationMapResult; gapScorecard: GapScorecardResult }> {
  const output = await callLLM<TranslateOutput>(
    provider,
    TRANSLATE_TOOL,
    buildTranslatePrompt(profile, target),
    4096,
  )

  return {
    translationMap: {
      rows: output.rows,
      readiness: output.readiness,
      competenciesHave: output.competenciesHave,
      competenciesTotal: output.competenciesTotal,
      summaryCopy: output.summaryCopy,
    },
    gapScorecard: { cards: output.gaps },
  }
}

// ─── Stage 3: Rewrite ─────────────────────────────────────────────────────────

export async function runRewrite(
  profile: ParsedProfile,
  target: TargetRole,
  translationMap: TranslationMapResult,
  provider: Provider = 'grok',
): Promise<RepositionedResume> {
  return callLLM<RepositionedResume>(
    provider,
    REWRITE_TOOL,
    buildRewritePrompt(profile, target, translationMap),
    6144,
  )
}

// ─── Stage 4: Strategy Brief ──────────────────────────────────────────────────

export async function runStrategy(
  profile: ParsedProfile,
  target: TargetRole,
  translationMap: TranslationMapResult,
  gapScorecard: GapScorecardResult,
  provider: Provider = 'grok',
): Promise<StrategyBrief> {
  return callLLM<StrategyBrief>(
    provider,
    STRATEGY_TOOL,
    buildStrategyPrompt(profile, target, translationMap.readiness, gapScorecard),
    4096,
  )
}
