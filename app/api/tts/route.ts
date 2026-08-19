import { NextResponse } from 'next/server'
import { getVoiceById } from '@/lib/voices'
import { synthesizeEdge } from '@/lib/edge-tts'
import { generateMockWav } from '@/lib/mock-audio'

export const runtime = 'nodejs'
export const maxDuration = 30

type Body = {
  text?: string
  voiceId?: string
  edgeVoice?: string
  speed?: number
  pitch?: number
}

const MAX_CHARS = 5000

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_CHARS} caracteres por geração` },
      { status: 400 },
    )
  }

  const speed = clamp(body.speed ?? 1, 0.5, 2)
  const pitch = clamp(body.pitch ?? 0, -50, 50)
  const voice = getVoiceById(body.voiceId ?? '')
  const edgeVoice = voice?.edgeVoice ?? body.edgeVoice ?? 'en-US-AvaMultilingualNeural'

  const lmntKey =
    req.headers.get('x-lmnt-key') || process.env.LMNT_API_KEY || ''

  // 1. Try LMNT (premium, sub-200ms) when a key is available.
  if (lmntKey) {
    try {
      const audio = await synthesizeLmnt({
        apiKey: lmntKey,
        text,
        voice: voice?.id ?? 'lily',
        speed,
      })
      return audioResponse(audio, 'audio/mpeg', 'lmnt')
    } catch (err) {
      console.log('[v0] LMNT failed, falling back to Edge:', (err as Error).message)
    }
  }

  // 2. Free Edge Neural TTS fallback (real speech, no key needed).
  try {
    const audio = await synthesizeEdge({ text, voice: edgeVoice, rate: speed, pitch })
    return audioResponse(audio, 'audio/mpeg', 'edge-neural')
  } catch (err) {
    console.log('[v0] Edge TTS failed, using mock audio:', (err as Error).message)
  }

  // 3. Guaranteed mock audio so previews always work.
  const wav = generateMockWav(text, speed)
  return audioResponse(wav, 'audio/wav', 'mock')
}

async function synthesizeLmnt({
  apiKey,
  text,
  voice,
  speed,
}: {
  apiKey: string
  text: string
  voice: string
  speed: number
}): Promise<Buffer> {
  const res = await fetch('https://api.lmnt.com/v1/ai/speech/bytes', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      voice,
      text,
      format: 'mp3',
      sample_rate: 24000,
      speed,
    }),
  })
  if (!res.ok) {
    throw new Error(`LMNT ${res.status}`)
  }
  const arr = await res.arrayBuffer()
  return Buffer.from(arr)
}

function audioResponse(buf: Buffer, contentType: string, engine: string) {
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': buf.length.toString(),
      'Cache-Control': 'no-store',
      'X-Aura-Engine': engine,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min))
}
