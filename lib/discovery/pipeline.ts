/**
 * Discovery Mode LLM stages — TEST BUILD.
 *
 * Mirrors the forced-tool_use pattern in lib/pipeline.ts and uses the same
 * Claude model, so Discovery behaves like the rest of the app. Claude-only —
 * the Grok fallback in the main pipeline isn't wired up here.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages/messages'
import {
  SKILLS_MAP_TOOL,
  buildSkillsMapPrompt,
  ADJACENT_ROLES_TOOL,
  buildAdjacentRolesPrompt,
  ROLE_COMPARISON_TOOL,
  buildRoleComparisonPrompt,
} from './prompts'
import { attachRealPostings } from './postings'
import type { FunctionalSkill, IntakeSelections, DiscoveryRole, RoleComparisonEnrichment } from './types'

// Same model the main pipeline uses — keep these in sync.
const CLAUDE_MODEL = 'claude-sonnet-4-6'

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set.')
  return new Anthropic({ apiKey: key })
}

async function callClaude<T>(tool: AnthropicTool, prompt: string, maxTokens: number): Promise<T> {
  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content: prompt }],
  })
  const block = response.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') {
    throw new Error(
      `Claude did not call the expected tool. Response: ${JSON.stringify(response.content).slice(0, 500)}`,
    )
  }
  return block.input as T
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

export async function extractSkillsMap(
  selections: IntakeSelections,
  otherNotes: string | null,
): Promise<FunctionalSkill[]> {
  const out = await callClaude<{ functions: FunctionalSkill[] }>(
    SKILLS_MAP_TOOL as AnthropicTool,
    buildSkillsMapPrompt(selections, otherNotes),
    2048,
  )
  return out.functions
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

/**
 * Role titles themselves are still Claude reasoning from general knowledge —
 * that part is inherent to the feature (surfacing roles the person wouldn't
 * have searched for). What's no longer a stub: each candidate title is
 * checked against real UK postings via Adzuna (lib/discovery/postings.ts)
 * before being shown, so a title that doesn't actually get hired for is
 * visibly flagged (postingCount: 0) rather than presented as equally real as
 * one with genuine market presence.
 *
 * TODO (still open before production): Adzuna only covers the UK market —
 * see the header comment in postings.ts. A real job-board *matching* pass
 * (surfacing actual open postings as the swipe cards, not just a count check
 * on Claude's suggestions) is the fuller version of this the spec describes;
 * this is real grounding, not yet real matching.
 */
export async function surfaceAdjacentRoles(
  runId: string,
  functions: FunctionalSkill[],
  selections: IntakeSelections,
  otherNotes: string | null,
): Promise<DiscoveryRole[]> {
  const out = await callClaude<{
    roles: Omit<DiscoveryRole, 'id' | 'runId' | 'rank' | 'postingCount' | 'samplePostings'>[]
  }>(
    ADJACENT_ROLES_TOOL as AnthropicTool,
    buildAdjacentRolesPrompt(functions, selections, otherNotes),
    4096,
  )
  const withIds = out.roles.map((r, i) => ({
    ...r,
    id: `${runId}:${i}`,
    runId,
    rank: i,
  }))
  return attachRealPostings(withIds)
}

// ─── Bridge: shortlist comparison ─────────────────────────────────────────────

/**
 * entryBarrier is still Claude's judgment call (there's no API for "how hard
 * would this specific person find this transition"). demandNote is grounded
 * in each role's real postingCount when Adzuna returned one — see
 * buildRoleComparisonPrompt — and falls back to hedged general-knowledge
 * reasoning only when it didn't (Adzuna unconfigured, or the lookup failed).
 *
 * Still NOT persisted: the caller regenerates this on every visit to the
 * comparison screen rather than caching it in Postgres, which is an
 * acceptable simplification for a test build but a re-cost if this survives
 * into production traffic.
 */
export async function enrichShortlistForComparison(
  roles: DiscoveryRole[],
  functions: FunctionalSkill[],
): Promise<Record<string, RoleComparisonEnrichment>> {
  if (roles.length === 0) return {}
  // Up to 10 roles × (dayToDay + entryBarrier + demandNote) needs real headroom —
  // 2048 truncated mid-response for a 6-role shortlist and left `roles` missing
  // from the parsed tool input entirely.
  const out = await callClaude<{ roles?: ({ roleId: string } & RoleComparisonEnrichment)[] }>(
    ROLE_COMPARISON_TOOL as AnthropicTool,
    buildRoleComparisonPrompt(roles, functions),
    6144,
  )
  // This content is a nice-to-have (see the TODO above) — degrade to "no
  // enrichment" rather than 500ing the whole comparison screen if the model
  // ever returns a shape we don't expect.
  if (!Array.isArray(out.roles)) return {}
  return Object.fromEntries(
    out.roles.map(({ roleId, dayToDay, entryBarrier, demandNote }) => [
      roleId,
      { dayToDay, entryBarrier, demandNote },
    ]),
  )
}
