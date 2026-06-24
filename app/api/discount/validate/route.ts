import { NextRequest, NextResponse } from 'next/server'
import { validateDiscount } from '@/lib/discount'
import type { PlanId } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { code, plan } = (await req.json()) as { code?: string; plan?: string }
  if (!code || !plan) {
    return NextResponse.json({ valid: false, reason: 'Missing code or plan.' }, { status: 400 })
  }
  const result = await validateDiscount(code, plan as PlanId)
  return NextResponse.json(result)
}
