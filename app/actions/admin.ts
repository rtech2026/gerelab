'use server'

import { db } from '@/lib/db'
import { user, userCredits, generation, clonedVoice } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { getSession } from '@/lib/session'

// Obter estatísticas do Admin
export async function getAdminStats() {
  try {
    const totalUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(user)
    const totalGenResult = await db.select({ 
      count: sql<number>`count(*)::int`,
      chars: sql<number>`coalesce(sum(${generation.charCount}), 0)::int`
    }).from(generation)
    const totalVoicesResult = await db.select({ count: sql<number>`count(*)::int` }).from(clonedVoice)

    const totalUsers = totalUsersResult[0]?.count || 0
    const totalGenerations = totalGenResult[0]?.count || 0
    const totalCharsUsed = totalGenResult[0]?.chars || 0
    const totalVoicesCloned = totalVoicesResult[0]?.count || 0

    return {
      success: true,
      stats: {
        totalUsers,
        totalGenerations,
        totalCharsUsed,
        totalVoicesCloned,
        freeUsers: totalUsers,
        proUsers: 0,
      }
    }
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return { success: false, error: error.message }
  }
}

// Obter lista completa de usuários com seus saldos
export async function getAdminUsersList() {
  try {
    const usersList = await db.select().from(user).orderBy(desc(user.createdAt))
    const creditsList = await db.select().from(userCredits)

    const creditMap = new Map(creditsList.map(c => [c.userId, c]))

    const formatted = usersList.map(u => {
      const cred = creditMap.get(u.id)
      const charLimit = cred?.charLimit ?? 15000
      const charsUsed = cred?.charsUsed ?? 0
      const remaining = Math.max(0, charLimit - charsUsed)

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        plan: cred?.plan || 'free',
        charLimit,
        charsUsed,
        creditsRemaining: remaining,
      }
    })

    return { success: true, users: formatted }
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return { success: false, error: error.message, users: [] }
  }
}

// Atualizar créditos ou plano de um usuário
export async function updateUserCreditsAdmin(userId: string, newTotalCredits: number, newPlan?: string) {
  try {
    const existing = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1)

    if (existing.length === 0) {
      await db.insert(userCredits).values({
        userId,
        plan: newPlan || 'free',
        charLimit: newTotalCredits,
        charsUsed: 0,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    } else {
      await db.update(userCredits)
        .set({
          charLimit: newTotalCredits,
          charsUsed: 0,
          ...(newPlan ? { plan: newPlan } : {}),
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating user credits admin:', error)
    return { success: false, error: error.message }
  }
}

// Obter gerações recentes para auditoria
export async function getAdminRecentGenerations() {
  try {
    const list = await db.select().from(generation).orderBy(desc(generation.createdAt)).limit(50)
    const usersList = await db.select().from(user)
    const userMap = new Map(usersList.map(u => [u.id, u]))

    const formatted = list.map(g => {
      const u = userMap.get(g.userId)
      return {
        id: g.id,
        userId: g.userId,
        userName: u?.name || 'Usuário',
        userEmail: u?.email || 'N/A',
        text: g.text,
        voiceId: g.voiceId,
        voiceName: g.voiceName,
        format: g.format,
        charCount: g.charCount,
        createdAt: g.createdAt,
        audioUrl: null, // As gravações são sintetizadas em memória / streaming
      }
    })

    return { success: true, generations: formatted }
  } catch (error: any) {
    console.error('Error fetching admin generations:', error)
    return { success: false, error: error.message, generations: [] }
  }
}
