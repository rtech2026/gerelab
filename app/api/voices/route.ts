import { NextResponse } from 'next/server'
import { listVoices, type LmntVoice } from '@/lib/lmnt'
import {
  normalizeGender,
  parseLanguage,
  formatTag,
  VOICE_DISPLAY_MAP,
  type Voice,
} from '@/lib/voices'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { clonedVoice } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

function mapVoice(v: LmntVoice): Voice {
  const custom = VOICE_DISPLAY_MAP[v.id.toLowerCase()]
  if (custom) {
    return {
      id: v.id,
      name: custom.name,
      description: custom.description,
      gender: custom.gender,
      owner: v.owner,
      category: v.owner === 'system' ? 'native' : 'cloned',
      tags: custom.tags,
      previewUrl: v.preview_url,
      state: v.state,
      language: custom.language,
      accent: custom.accent,
      flagCode: custom.flagCode,
    }
  }

  const { language, accent, flagCode } = parseLanguage(v.description)
  const cleanName = v.name.charAt(0).toUpperCase() + v.name.slice(1)
  const cleanTags = v.tags && v.tags.length > 0
    ? v.tags.map(formatTag)
    : ['Conversa Natural', 'Expressiva']

  return {
    id: v.id,
    name: cleanName,
    description: 'Voz neural realista com excelente dicção.',
    gender: normalizeGender(v.gender),
    owner: v.owner,
    category: v.owner === 'system' ? 'native' : 'cloned',
    tags: cleanTags,
    previewUrl: v.preview_url,
    state: v.state,
    language,
    accent,
    flagCode,
  }
}

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const rawVoices = await listVoices('all')
    const readyVoices = rawVoices.filter((v) => v.state === 'ready')

    // 1. Busca os IDs das vozes clonadas pertencentes EXCLUSIVAMENTE a este usuário logado
    const userClonedRows = await db
      .select({ voiceId: clonedVoice.lmntVoiceId })
      .from(clonedVoice)
      .where(eq(clonedVoice.userId, session.user.id))

    const userClonedIdSet = new Set(userClonedRows.map((r) => r.voiceId.toLowerCase()))

    // 2. Filtra as vozes:
    // - Vozes de Sistema (owner === 'system'): abertas para TODOS
    // - Vozes Clonadas: apenas se o usuário for o criador (registrado no banco) ou se for clone mestre do sistema
    const filteredVoices = readyVoices.filter((v) => {
      if (v.owner === 'system') return true
      // Verifica se pertence ao usuário logado
      if (userClonedIdSet.has(v.id.toLowerCase())) return true
      // Clones mestres do VOICE_DISPLAY_MAP
      if (VOICE_DISPLAY_MAP[v.id.toLowerCase()]) return true
      return false
    })

    const mapped = filteredVoices
      .map(mapVoice)
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(
      {
        voices: mapped,
        native: mapped.filter((v) => v.category === 'native'),
        cloned: mapped.filter((v) => v.category === 'cloned'),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.log('[GereLab] voices route error:', (err as Error).message)
    return NextResponse.json(
      { error: 'Falha ao carregar vozes do estúdio' },
      { status: 502 },
    )
  }
}
