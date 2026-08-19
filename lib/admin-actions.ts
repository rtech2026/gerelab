'use server'

import { db } from '@/lib/db'
import { user, userCredits, generation, clonedVoice } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export interface AdminUser {
  id: string
  name: string | null
  email: string
  createdAt: Date | null
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  credits: number
  charLimit: number
  charsUsed: number
}

// Obter Estatísticas Gerais do Admin
export async function getAdminStats() {
  try {
    const totalUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(user)
    const totalGenResult = await db.select({ 
      count: sql<number>`count(*)::int`,
      chars: sql<number>`coalesce(sum(${generation.charCount}), 0)::int`
    }).from(generation)
    const creditsList = await db.select().from(userCredits)

    const totalUsers = totalUsersResult[0]?.count || 0
    const totalGenerations = totalGenResult[0]?.count || 0
    
    // Soma total de caracteres disponíveis para todos os usuários
    const totalCredits = creditsList.reduce((acc, c) => acc + (c.charLimit || 15000), 0)

    return {
      success: true,
      stats: {
        totalUsers,
        totalGenerations,
        totalCredits,
      }
    }
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return { success: false, error: error.message, stats: { totalUsers: 0, totalGenerations: 0, totalCredits: 0 } }
  }
}

// Obter Lista de Usuários Formatada
export async function getAdminUsers(): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
  try {
    const usersList = await db.select().from(user).orderBy(desc(user.createdAt))
    const creditsList = await db.select().from(userCredits)

    const creditMap = new Map(creditsList.map(c => [c.userId, c]))

    const formatted: AdminUser[] = usersList.map(u => {
      const cred = creditMap.get(u.id)
      const charLimit = cred?.charLimit ?? 15000
      const charsUsed = cred?.charsUsed ?? 0
      const remaining = Math.max(0, charLimit - charsUsed)

      let planStr: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE'
      const rawPlan = (cred?.plan || 'FREE').toUpperCase()
      if (rawPlan === 'PRO') planStr = 'PRO'
      else if (rawPlan === 'ENTERPRISE') planStr = 'ENTERPRISE'

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        plan: planStr,
        credits: remaining,
        charLimit,
        charsUsed,
      }
    })

    return { success: true, users: formatted }
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return { success: false, error: error.message, users: [] }
  }
}

// Obter Gerações para Auditoria
export async function getAdminGenerations(limitCount = 50) {
  try {
    const list = await db.select().from(generation).orderBy(desc(generation.createdAt)).limit(limitCount)
    const usersList = await db.select().from(user)
    const userMap = new Map(usersList.map(u => [u.id, u]))

    const formatted = list.map(g => {
      const u = userMap.get(g.userId)
      return {
        id: String(g.id || ''),
        userId: g.userId,
        userName: u?.name || 'Usuário',
        userEmail: u?.email || 'N/A',
        textPrompt: g.text,
        voiceId: g.voiceId,
        voiceName: g.voiceName,
        characterCount: g.charCount,
        createdAt: g.createdAt,
      }
    })

    return { success: true, generations: formatted }
  } catch (error: any) {
    console.error('Error fetching admin generations:', error)
    return { success: false, error: error.message, generations: [] }
  }
}

// Adicionar Créditos a um Usuário
export async function addCreditsToUser(userId: string, amount: number) {
  try {
    const existing = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1)

    if (existing.length === 0) {
      await db.insert(userCredits).values({
        userId,
        plan: 'FREE',
        charLimit: 15000 + amount,
        charsUsed: 0,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    } else {
      const currentLimit = existing[0].charLimit || 15000
      await db.update(userCredits)
        .set({
          charLimit: currentLimit + amount,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error adding credits:', error)
    return { success: false, error: error.message }
  }
}

// Definir Saldo Exato de Créditos para um Usuário
export async function setCreditsForUser(userId: string, totalAmount: number) {
  try {
    const existing = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1)

    if (existing.length === 0) {
      await db.insert(userCredits).values({
        userId,
        plan: 'FREE',
        charLimit: totalAmount,
        charsUsed: 0,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    } else {
      await db.update(userCredits)
        .set({
          charLimit: totalAmount,
          charsUsed: 0,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error setting credits:', error)
    return { success: false, error: error.message }
  }
}

// Alterar Plano de um Usuário
export async function changeUserPlan(userId: string, plan: 'FREE' | 'PRO' | 'ENTERPRISE') {
  try {
    const existing = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1)

    if (existing.length === 0) {
      await db.insert(userCredits).values({
        userId,
        plan,
        charLimit: plan === 'ENTERPRISE' ? 500000 : plan === 'PRO' ? 100000 : 15000,
        charsUsed: 0,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    } else {
      await db.update(userCredits)
        .set({
          plan,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error changing plan:', error)
    return { success: false, error: error.message }
  }
}
