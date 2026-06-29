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

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { runTranslate, runRewrite, runStrategy, type Provider } from '@/lib/pipeline'
import { saveSession, getSession } from '@/lib/session-store'
import { checkPivotQuota, recordPivotUsage } from '@/lib/subscription'
import { auth } from '@/auth'
import type { ParsedProfile, TargetRole, AnalysisSession } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 180

type SSEPayload = Record<string, unknown>

function encode(payload: SSEPayload): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function POST(req: NextRequest): Promise<Response> {
  const authSession = await auth()

  const { profile, target, sessionId: existingId, provider: rawProvider } = (await req.json()) as {
    profile: ParsedProfile
    target: TargetRole
    sessionId?: string
    provider?: string
  }
  const provider: Provider = rawProvider === 'grok' ? 'grok' : 'claude'

  // The client generates the sessionId up front and reuses it on retry. This
  // makes the analysis resumable: if a phone lock / backgrounded tab drops the
  // connection mid-run, each finished stage is already persisted, so retrying
  // continues from where it left off instead of re-running (and re-paying for)
  // the AI stages. A fully-complete session is returned immediately.
  const sessionId = existingId ?? randomUUID()
  const existing = await getSession(sessionId)
  const alreadyComplete = Boolean(existing?.translationMap && existing?.resume && existing?.strategy)

  // ── Quota check ─────────────────────────────────────────────────────────────
  // Only gate fresh work. Resuming or re-opening an already-charged analysis must
  // never be blocked (usage is recorded once, on first full completion).
  if (!alreadyComplete && authSession?.user?.id) {
    const quota = await checkPivotQuota(authSession.user.id)
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason, code: 'QUOTA_EXCEEDED', quota }, { status: 402 })
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Best-effort send: if the client has disconnected (locked phone, closed
      // tab), enqueue throws — we swallow it and keep computing + persisting so
      // the work isn't wasted and the result is ready on the next visit/retry.
      const send = (payload: SSEPayload) => {
        try { controller.enqueue(encode(payload)) } catch { /* client gone — keep going */ }
      }

      try {
        // Seed from any partial work already persisted for this session.
        let translationMap = existing?.translationMap
        let gapScorecard = existing?.gapScorecard
        let resume = existing?.resume
        let strategy = existing?.strategy
        const createdAt = existing?.createdAt ?? new Date().toISOString()
        const userId = authSession?.user?.id ?? existing?.userId ?? null

        const persist = () =>
          saveSession(sessionId, {
            id: sessionId,
            userId,
            profile,
            target,
            translationMap,
            gapScorecard,
            resume,
            strategy,
            createdAt,
            updatedAt: new Date().toISOString(),
          } as AnalysisSession)

        // ── Translate + Score ───────────────────────────────────────────────
        if (!translationMap || !gapScorecard) {
          send({ stage: 'translate', status: 'running' })
          ;({ translationMap, gapScorecard } = await runTranslate(profile, target, provider))
          await persist()
        }
        send({ stage: 'translate', status: 'done', data: { translationMap, gapScorecard } })

        // ── Rewrite ──────────────────────────────────────────────────────────
        if (!resume) {
          send({ stage: 'rewrite', status: 'running' })
          resume = await runRewrite(profile, target, translationMap, provider)
          await persist()
        }
        send({ stage: 'rewrite', status: 'done', data: resume })

        // ── Strategy ─────────────────────────────────────────────────────────
        if (!strategy) {
          send({ stage: 'strategy', status: 'running' })
          strategy = await runStrategy(profile, target, translationMap, gapScorecard, provider)
          await persist()
        }
        send({ stage: 'strategy', status: 'done', data: strategy })

        // Record usage once, on the first run that completes the analysis.
        if (userId && !alreadyComplete) {
          await recordPivotUsage(userId, provider)
        }

        send({ stage: 'complete', sessionId })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[/api/analyse]', message)
        send({ error: message })
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
