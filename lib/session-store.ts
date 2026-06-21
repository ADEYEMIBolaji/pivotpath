/**
 * Server-side session persistence via JSON files in .sessions/
 * Simple, dependency-free, works across Next.js hot reloads.
 */

import fs from 'fs'
import path from 'path'
import type { AnalysisSession } from './types'

const SESSIONS_DIR = path.join(process.cwd(), '.sessions')

function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

export function saveSession(id: string, session: AnalysisSession): void {
  ensureDir()
  fs.writeFileSync(path.join(SESSIONS_DIR, `${id}.json`), JSON.stringify(session, null, 2))
}

export function getSession(id: string): AnalysisSession | null {
  try {
    const raw = fs.readFileSync(path.join(SESSIONS_DIR, `${id}.json`), 'utf-8')
    return JSON.parse(raw) as AnalysisSession
  } catch {
    return null
  }
}

export function updateSession(id: string, patch: Partial<AnalysisSession>): void {
  const existing = getSession(id)
  if (!existing) throw new Error(`Session ${id} not found`)
  saveSession(id, { ...existing, ...patch, updatedAt: new Date().toISOString() })
}
