import { NextResponse } from 'next/server'
import { createVoice } from '@/lib/lmnt'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { clonedVoice } from '@/lib/db/schema'
import {
  normalizeGender,
  parseLanguage,
  type Voice,
} from '@/lib/voices'

export const runtime = 'nodejs'
export const maxDuration = 60

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
  const consent = form.get('consent') === 'true'
  const file = form.get('audio')

  if (!name) {
    return NextResponse.json({ error: 'Nome da voz obrigatório' }, { status: 400 })
  }
  if (!consent) {
    return NextResponse.json(
      { error: 'É necessário confirmar o consentimento' },
      { status: 400 },
    )
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: 'Amostra de áudio obrigatória' },
      { status: 400 },
    )
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Amostra muito grande (máx. 25MB)' },
      { status: 400 },
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
      console.log('[v0] save cloned voice error:', (err as Error).message)
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
    console.log('[v0] LMNT clone error:', (err as Error).message)
    return NextResponse.json(
      { error: 'Falha ao clonar a voz na LMNT' },
      { status: 502 },
    )
  }
}
