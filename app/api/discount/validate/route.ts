import { NextRequest, NextResponse } from 'next/server'
import { validateDiscount } from '@/lib/discount'
import type { PlanId, BillingCycle } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { code, plan, cycle } = (await req.json()) as { code?: string; plan?: string; cycle?: string }
  if (!code || !plan) {
    return NextResponse.json({ valid: false, reason: 'Missing code or plan.' }, { status: 400 })
  }
  const billingCycle: BillingCycle = cycle === 'annual' ? 'annual' : 'monthly'
  const result = await validateDiscount(code, plan as PlanId, billingCycle)
  return NextResponse.json(result)
}
