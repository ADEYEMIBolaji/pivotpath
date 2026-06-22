/**
 * POST /api/analyse
 *
 * Accepts: { profile: ParsedProfile, target: TargetRole, sessionId?: string }
 *
 * Returns: Server-Sent Events (text/event-stream)
 *   data: { stage: 'translate' | 'rewrite' | 'strategy', status: 'running' | 'done', data?: ... }
 *   data: { stage: 'complete', sessionId: string }
 *   data: { error: string }
 *
 * The full AnalysisSession is written to disk at the end.
 */

import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { runTranslate, runRewrite, runStrategy, type Provider } from '@/lib/pipeline'
import { saveSession } from '@/lib/session-store'
import type { ParsedProfile, TargetRole, AnalysisSession } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 180

type SSEPayload = Record<string, unknown>

function encode(payload: SSEPayload): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function POST(req: NextRequest): Promise<Response> {
  const { profile, target, sessionId: existingId, provider: rawProvider } = (await req.json()) as {
    profile: ParsedProfile
    target: TargetRole
    sessionId?: string
    provider?: string
  }
  const provider: Provider = rawProvider === 'grok' ? 'grok' : 'claude'

  const sessionId = existingId ?? randomUUID()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Translate + Score ───────────────────────────────────────────────
        controller.enqueue(encode({ stage: 'translate', status: 'running' }))
        const { translationMap, gapScorecard } = await runTranslate(profile, target, provider)
        controller.enqueue(encode({ stage: 'translate', status: 'done', data: { translationMap, gapScorecard } }))

        // ── Rewrite ──────────────────────────────────────────────────────────
        controller.enqueue(encode({ stage: 'rewrite', status: 'running' }))
        const resume = await runRewrite(profile, target, translationMap, provider)
        controller.enqueue(encode({ stage: 'rewrite', status: 'done', data: resume }))

        // ── Strategy ─────────────────────────────────────────────────────────
        controller.enqueue(encode({ stage: 'strategy', status: 'running' }))
        const strategy = await runStrategy(profile, target, translationMap, gapScorecard, provider)
        controller.enqueue(encode({ stage: 'strategy', status: 'done', data: strategy }))

        // ── Persist ───────────────────────────────────────────────────────────
        const now = new Date().toISOString()
        const session: AnalysisSession = {
          id: sessionId,
          userId: null,
          profile,
          target,
          translationMap,
          gapScorecard,
          resume,
          strategy,
          createdAt: now,
          updatedAt: now,
        }
        await saveSession(sessionId, session)

        controller.enqueue(encode({ stage: 'complete', sessionId }))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[/api/analyse]', message)
        controller.enqueue(encode({ error: message }))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
