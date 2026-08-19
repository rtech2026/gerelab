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
  voice?: string
  voiceName?: string
  language?: string
  format?: string
  temperature?: number
  topP?: number
  top_p?: number
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
  const rawVoiceId = (body.voiceId || body.voice || '').trim()

  if (!text) {
    return NextResponse.json({ error: 'Digite um texto para sintetizar' }, { status: 400 })
  }
  if (!rawVoiceId) {
    return NextResponse.json({ error: 'Selecione uma voz neural' }, { status: 400 })
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_CHARS} caracteres por geração` },
      { status: 400 },
    )
  }

  const chars = text.length

  // 1. Valida créditos do usuário antes de gastar a chamada
  const credits = await getCredits()
  if (credits && chars > credits.charsRemaining) {
    return NextResponse.json(
      {
        error: `Créditos insuficientes. Restam ${credits.charsRemaining.toLocaleString(
          'pt-BR',
        )} caracteres neste ciclo.`,
      },
      { status: 402 },
    )
  }

  // 2. Sintetiza na ordem: LMNT API Pool -> LMNT Session Bypass -> Edge-TTS Failover
  let synthResult: { buffer: Buffer; engine: string }
  try {
    synthResult = await synthesizeSpeech({
      text,
      voice: rawVoiceId,
      language: body.language,
      format: body.format ?? 'mp3',
      temperature: body.temperature,
      topP: body.topP ?? body.top_p,
    })
  } catch (err) {
    console.log('[GereLab TTS] Pipeline synth error:', (err as Error).message)
    return NextResponse.json(
      { error: 'Falha na síntese de voz. Verifique a voz selecionada ou tente novamente.' },
      { status: 502 },
    )
  }

  const audio = synthResult.buffer
  const engineUsed = synthResult.engine

  // 3. Consome créditos e registra o histórico
  let remaining = (credits?.charsRemaining || 0) - chars
  try {
    const updated = await consumeCredits(chars)
    if (updated) remaining = updated.charsRemaining
    await saveGeneration({
      text,
      voiceId: rawVoiceId,
      voiceName: body.voiceName || rawVoiceId,
      language: body.language || null,
      format: body.format || 'mp3',
      charCount: chars,
    })
  } catch (err) {
    console.log('[GereLab TTS] credits/history error:', (err as Error).message)
  }

  const contentType = body.format === 'wav' ? 'audio/wav' : 'audio/mpeg'
  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': audio.length.toString(),
      'Cache-Control': 'no-store',
      'X-Aura-Engine': engineUsed,
      'X-Aura-Credits-Remaining': String(remaining),
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
