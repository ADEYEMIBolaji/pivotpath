/**
 * POST /api/ingest
 *
 * Accepts:
 *   - multipart/form-data  { file: File, source: 'upload' }
 *   - application/json     { text: string, source: 'paste' | 'linkedin' }
 *
 * Returns: ApiResult<ParsedProfile>
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIngest, type Provider } from '@/lib/pipeline'
import type { ApiResult, ParsedProfile } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

async function extractText(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
    // unpdf ships a serverless-safe pdf.js build (no DOMMatrix / browser APIs),
    // unlike pdf-parse which crashes on Vercel's Node runtime.
    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(new Uint8Array(bytes))
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  }

  if (
    file.name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth') as {
      extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>
    }
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // Plain text fallback
  return buffer.toString('utf-8')
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResult<ParsedProfile>>> {
  try {
    let rawText: string
    let source: ParsedProfile['source']
    let provider: Provider = 'claude'

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 })
      }
      rawText = await extractText(file as File)
      source = 'upload'
      const providerField = form.get('provider')
      if (providerField === 'grok') provider = 'grok'
    } else {
      const body = (await req.json()) as { text?: string; source?: ParsedProfile['source']; provider?: string }
      if (!body.text?.trim()) {
        return NextResponse.json({ ok: false, error: 'No text provided' }, { status: 400 })
      }
      rawText = body.text
      source = body.source ?? 'paste'
      provider = body.provider === 'grok' ? 'grok' : 'claude'
    }

    if (rawText.trim().length < 50) {
      return NextResponse.json({ ok: false, error: 'Document appears empty or too short to parse' }, { status: 422 })
    }

    const profile = await runIngest(rawText, source, provider)
    return NextResponse.json({ ok: true, data: profile })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/ingest]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
