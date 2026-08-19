import { NextResponse } from 'next/server'
import { synthesizeSpeech } from '@/lib/lmnt'
import { getSession } from '@/lib/session'
import { getCredits, consumeCredits } from '@/app/actions/credits'
import { saveGeneration } from '@/app/actions/history'

export const runtime = 'nodejs'
export const maxDuration = 30

type Body = {
  text?: string
  voiceId?: string
  voiceName?: string
  language?: string
  format?: string
  temperature?: number
  topP?: number
}

const MAX_CHARS = 5000

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  const voiceId = (body.voiceId ?? '').trim()

  if (!text) {
    return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })
  }
  if (!voiceId) {
    return NextResponse.json({ error: 'Selecione uma voz' }, { status: 400 })
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_CHARS} caracteres por geração` },
      { status: 400 },
    )
  }

  const chars = text.length

  // 1. Valida créditos do usuário antes de gastar a chamada.
  const credits = await getCredits()
  if (chars > credits.charsRemaining) {
    return NextResponse.json(
      {
        error: `Créditos insuficientes. Restam ${credits.charsRemaining.toLocaleString(
          'pt-BR',
        )} caracteres neste ciclo.`,
      },
      { status: 402 },
    )
  }

  // 2. Sintetiza com a LMNT (chave no servidor).
  let audio: Buffer
  try {
    audio = await synthesizeSpeech({
      text,
      voice: voiceId,
      language: body.language,
      format: body.format ?? 'mp3',
      temperature: body.temperature,
      topP: body.topP,
    })
  } catch (err) {
    console.log('[v0] LMNT synth error:', (err as Error).message)
    return NextResponse.json(
      { error: 'Falha na síntese de voz (LMNT)' },
      { status: 502 },
    )
  }

  // 3. Consome créditos e registra o histórico.
  let remaining = credits.charsRemaining - chars
  try {
    const updated = await consumeCredits(chars)
    remaining = updated.charsRemaining
    await saveGeneration({
      text,
      voiceId,
      voiceName: body.voiceName ?? voiceId,
      language: body.language ?? null,
      format: body.format ?? 'mp3',
      charCount: chars,
    })
  } catch (err) {
    console.log('[v0] credits/history error:', (err as Error).message)
  }

  const contentType = body.format === 'wav' ? 'audio/wav' : 'audio/mpeg'
  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': audio.length.toString(),
      'Cache-Control': 'no-store',
      'X-Aura-Engine': 'lmnt',
      'X-Aura-Credits-Remaining': String(remaining),
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
