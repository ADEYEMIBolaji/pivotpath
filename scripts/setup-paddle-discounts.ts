/**
 * One-off: create matching Paddle discounts for our paid-plan codes and link
 * their dsc_... ids into discount_codes.paddle_discount_id.
 *
 * Run:  npx tsx scripts/setup-paddle-discounts.ts
 *
 * Reads PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_ENV and DATABASE_URL from .env.local.
 * Idempotent: skips a code that already has a paddle_discount_id.
 *
 * Note: PIVOT100 (100% off) is intentionally not created — it activates the
 * plan in-app for free without going through Paddle.
 */

import { readFileSync } from 'fs'
import { Client } from 'pg'
import { Paddle, Environment } from '@paddle/paddle-node-sdk'

const env = readFileSync('.env.local', 'utf8')
function v(key: string): string {
  const line = env.split('\n').find((l) => l.startsWith(key + '='))
  return line ? line.slice(key.length + 1).trim() : ''
}

const CODES: { code: string; percent: number }[] = [
  { code: 'LAUNCH50', percent: 50 },
  { code: 'WELCOME20', percent: 20 },
]

async function main() {
  const apiKey = v('PADDLE_API_KEY')
  const dbUrl = v('DATABASE_URL')
  if (!apiKey) throw new Error('PADDLE_API_KEY missing in .env.local')
  if (!dbUrl) throw new Error('DATABASE_URL missing in .env.local')

  const paddle = new Paddle(apiKey, {
    environment: v('NEXT_PUBLIC_PADDLE_ENV') === 'production' ? Environment.production : Environment.sandbox,
  })

  const db = new Client({ connectionString: dbUrl })
  await db.connect()

  for (const { code, percent } of CODES) {
    const row = (await db.query('SELECT paddle_discount_id FROM discount_codes WHERE code = $1', [code])).rows[0]
    if (!row) { console.log(`- ${code}: not in discount_codes, skipping`); continue }
    if (row.paddle_discount_id) { console.log(`- ${code}: already linked (${row.paddle_discount_id}), skipping`); continue }

    const discount = await paddle.discounts.create({
      amount: String(percent),
      description: `${code} — ${percent}% off`,
      type: 'percentage',
      enabledForCheckout: true,
      code,
      recur: false,
    })

    await db.query('UPDATE discount_codes SET paddle_discount_id = $1 WHERE code = $2', [discount.id, code])
    console.log(`✓ ${code}: created Paddle discount ${discount.id} (${percent}%) and linked`)
  }

  await db.end()
  console.log('\nDone.')
}

main().catch((err) => { console.error(err); process.exit(1) })
