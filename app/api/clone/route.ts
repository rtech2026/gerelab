import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
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
  const language = (form.get('language') as string | null)?.trim() ?? 'pt-BR'
  const gender = (form.get('gender') as string | null)?.trim() ?? 'female'
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

  const lmntKey = req.headers.get('x-lmnt-key') || process.env.LMNT_API_KEY || ''

  // With an LMNT key, dispatch the real instant-clone request.
  if (lmntKey) {
    try {
      const upstream = new FormData()
      upstream.append('name', name)
      upstream.append('enhance', 'true')
      upstream.append('type', 'instant')
      upstream.append('files', file, file.name || 'sample.wav')

      const res = await fetch('https://api.lmnt.com/v1/ai/voice/create', {
        method: 'POST',
        headers: { 'X-API-Key': lmntKey },
        body: upstream,
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({
          voice: {
            id: data.id ?? `cloned-${Date.now()}`,
            name,
            language,
            gender,
            category: 'cloned',
            engine: 'lmnt',
          },
        })
      }
      console.log('[v0] LMNT clone failed:', res.status)
    } catch (err) {
      console.log('[v0] LMNT clone error:', (err as Error).message)
    }
  }

  // Simulated instant clone (no key configured) — returns a synthetic voice id.
  await new Promise((r) => setTimeout(r, 900))
  return NextResponse.json({
    voice: {
      id: `cloned-${Date.now().toString(36)}`,
      name,
      language,
      gender,
      category: 'cloned',
      engine: 'simulated',
    },
    simulated: true,
  })
}
