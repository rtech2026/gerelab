import { NextResponse } from 'next/server'
import { listVoices, type LmntVoice } from '@/lib/lmnt'
import {
  normalizeGender,
  parseLanguage,
  type Voice,
} from '@/lib/voices'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'

function mapVoice(v: LmntVoice): Voice {
  const { language, accent } = parseLanguage(v.description)
  return {
    id: v.id,
    name: v.name,
    description: v.description ?? 'Voz neural LMNT.',
    gender: normalizeGender(v.gender),
    owner: v.owner,
    category: v.owner === 'system' ? 'native' : 'cloned',
    tags: v.tags ?? [],
    previewUrl: v.preview_url,
    state: v.state,
    language,
    accent,
  }
}

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const voices = await listVoices('all')
    const mapped = voices
      .filter((v) => v.state === 'ready')
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
    console.log('[v0] voices route error:', (err as Error).message)
    return NextResponse.json(
      { error: 'Falha ao carregar vozes da LMNT' },
      { status: 502 },
    )
  }
}
