/**
 * Enable or disable a discount code.
 *
 * Run:  npx tsx --env-file=.env.local scripts/set-code-active.ts <CODE> <on|off>
 *   e.g. npx tsx --env-file=.env.local scripts/set-code-active.ts PIVOTVIP off
 *
 * Targets whichever database DATABASE_URL points at (via --env-file, or an
 * already-set env var for production). Reversible: this only flips the `active`
 * flag, it never deletes the code or its redemption history.
 */

import { query } from '../lib/db'

type Row = {
  code: string
  percent_off: number
  active: boolean
  redeemed_count: number
  max_redemptions: number | null
}

async function main() {
  const [rawCode, rawState] = process.argv.slice(2)

  if (!rawCode || !rawState) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/set-code-active.ts <CODE> <on|off>')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Pass --env-file=.env.local or set it for the target database.')
    process.exit(1)
  }

  const code = rawCode.trim().toUpperCase()
  const state = rawState.trim().toLowerCase()

  const enable = ['on', 'true', 'enable', 'enabled', 'active'].includes(state)
  const disable = ['off', 'false', 'disable', 'disabled', 'inactive'].includes(state)
  if (!enable && !disable) {
    console.error(`Unknown state "${rawState}". Use "on" or "off".`)
    process.exit(1)
  }

  const rows = await query<Row>(
    `UPDATE discount_codes
       SET active = $2
     WHERE code = $1
     RETURNING code, percent_off, active, redeemed_count, max_redemptions`,
    [code, enable],
  )

  if (rows.length === 0) {
    console.error(`No discount code found named "${code}".`)
    process.exit(1)
  }

  const r = rows[0]
  console.log(`${r.code} is now ${r.active ? 'ACTIVE' : 'DISABLED'}`)
  console.log(`  ${r.percent_off}% off · redeemed ${r.redeemed_count}${r.max_redemptions === null ? '' : ` of ${r.max_redemptions}`}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed to update code:', err)
  process.exit(1)
})
