'use server'

import { db } from '@/lib/db'
import { generation } from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { desc, eq } from 'drizzle-orm'

export type GenerationRecord = {
  id: number
  text: string
  voiceId: string
  voiceName: string
  language: string | null
  format: string
  charCount: number
  createdAt: string
}

export async function saveGeneration(input: {
  text: string
  voiceId: string
  voiceName: string
  language: string | null
  format: string
  charCount: number
}) {
  const userId = await getUserId()
  await db.insert(generation).values({
    userId,
    text: input.text,
    voiceId: input.voiceId,
    voiceName: input.voiceName,
    language: input.language,
    format: input.format,
    charCount: input.charCount,
  })
}

export async function getHistory(limit = 30): Promise<GenerationRecord[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(generation)
    .where(eq(generation.userId, userId))
    .orderBy(desc(generation.createdAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    voiceId: r.voiceId,
    voiceName: r.voiceName,
    language: r.language,
    format: r.format,
    charCount: r.charCount,
    createdAt: r.createdAt.toISOString(),
  }))
}
