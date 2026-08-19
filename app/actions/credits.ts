'use server'

import { db } from '@/lib/db'
import { userCredits } from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { eq } from 'drizzle-orm'

export type CreditsInfo = {
  plan: string
  charLimit: number
  charsUsed: number
  charsRemaining: number
  periodEnd: string
}

/** Garante que exista uma linha de créditos para o usuário (plano gratuito). */
async function ensureCredits(userId: string) {
  const existing = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1)

  if (existing.length > 0) {
    const row = existing[0]
    // Renova o período se já expirou (mantém modelo de créditos pronto).
    if (row.periodEnd.getTime() < Date.now()) {
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const [updated] = await db
        .update(userCredits)
        .set({ charsUsed: 0, periodEnd, updatedAt: new Date() })
        .where(eq(userCredits.userId, userId))
        .returning()
      return updated
    }
    return row
  }

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const [created] = await db
    .insert(userCredits)
    .values({
      userId,
      plan: 'free',
      charLimit: 15000,
      charsUsed: 0,
      periodEnd,
    })
    .onConflictDoNothing()
    .returning()

  if (created) return created

  const [row] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1)
  return row
}

export async function getCredits(): Promise<CreditsInfo> {
  const userId = await getUserId()
  const row = await ensureCredits(userId)
  return {
    plan: row.plan,
    charLimit: row.charLimit,
    charsUsed: row.charsUsed,
    charsRemaining: Math.max(0, row.charLimit - row.charsUsed),
    periodEnd: row.periodEnd.toISOString(),
  }
}

/** Reserva créditos (caracteres) antes de gerar. Lança se exceder o limite. */
export async function consumeCredits(chars: number): Promise<CreditsInfo> {
  const userId = await getUserId()
  const row = await ensureCredits(userId)

  if (row.charsUsed + chars > row.charLimit) {
    throw new Error('LIMIT_EXCEEDED')
  }

  const [updated] = await db
    .update(userCredits)
    .set({ charsUsed: row.charsUsed + chars, updatedAt: new Date() })
    .where(eq(userCredits.userId, userId))
    .returning()

  return {
    plan: updated.plan,
    charLimit: updated.charLimit,
    charsUsed: updated.charsUsed,
    charsRemaining: Math.max(0, updated.charLimit - updated.charsUsed),
    periodEnd: updated.periodEnd.toISOString(),
  }
}
