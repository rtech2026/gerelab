import { NextResponse } from 'next/server'
import { createVoice } from '@/lib/lmnt'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { clonedVoice } from '@/lib/db/schema'
import { consumeCredits, getCredits } from '@/app/actions/credits'
import {
  normalizeGender,
  parseLanguage,
  type Voice,
} from '@/lib/voices'

export const runtime = 'nodejs'
export const maxDuration = 60

const CLONE_CREDIT_COST = 1000

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Envio inválido (esperado multipart/form-data)' },
      { status: 400 },
    )
  }

  const name = (form.get('name') as string | null)?.trim() ?? ''
  const description =
    (form.get('description') as string | null)?.trim() || undefined
  const gender = (form.get('gender') as string | null)?.trim() || undefined
  const file = form.get('file') || form.get('audio')

  if (!name) {
    return NextResponse.json({ error: 'Nome da voz obrigatório' }, { status: 400 })
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: 'Amostra de áudio obrigatória (mínimo de 10 segundos)' },
      { status: 400 },
    )
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Amostra muito grande (máx. 25MB)' },
      { status: 400 },
    )
  }

  // Verifica e debita 1.000 créditos
  try {
    const credits = await getCredits()
    if (credits.charsRemaining < CLONE_CREDIT_COST) {
      return NextResponse.json(
        { error: `Créditos insuficientes. A clonagem requer ${CLONE_CREDIT_COST.toLocaleString('pt-BR')} créditos (você tem ${credits.charsRemaining.toLocaleString('pt-BR')}).` },
        { status: 402 },
      )
    }
    await consumeCredits(CLONE_CREDIT_COST)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message === 'LIMIT_EXCEEDED' ? 'Limite mensal de créditos atingido.' : 'Erro ao processar créditos.' },
      { status: 402 },
    )
  }

  try {
    const created = await createVoice({ name, file, description, gender })

    // Persiste a referência da voz clonada para o usuário.
    try {
      await db.insert(clonedVoice).values({
        userId: session.user.id,
        lmntVoiceId: created.id,
        name: created.name,
        description: created.description ?? null,
        gender: created.gender ?? null,
      })
    } catch (err) {
      console.log('[Clone] save cloned voice error:', (err as Error).message)
    }

    const { language, accent } = parseLanguage(created.description)
    const voice: Voice = {
      id: created.id,
      name: created.name,
      description: created.description ?? 'Voz clonada personalizada.',
      gender: normalizeGender(created.gender),
      owner: 'me',
      category: 'cloned',
      tags: created.tags ?? [],
      previewUrl: created.preview_url,
      state: created.state,
      language,
      accent,
    }

    return NextResponse.json({ voice })
  } catch (err) {
    console.log('[Clone] LMNT clone error:', (err as Error).message)
    return NextResponse.json(
      { error: 'Falha ao processar clonagem de voz.' },
      { status: 502 },
    )
  }
}
