import { getClientKey } from '@/lib/client-key'
import type { Voice } from '@/lib/voices'

export type GenerateResult = {
  url: string
  engine: string
  blob: Blob
}

export async function generateSpeech(
  text: string,
  voice: Voice,
  opts: { speed?: number; pitch?: number } = {},
): Promise<GenerateResult> {
  const key = getClientKey()
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { 'x-lmnt-key': key } : {}),
    },
    body: JSON.stringify({
      text,
      voiceId: voice.id,
      edgeVoice: voice.edgeVoice,
      speed: opts.speed ?? 1,
      pitch: opts.pitch ?? 0,
    }),
  })

  if (!res.ok) {
    let message = 'Falha ao gerar áudio'
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {}
    throw new Error(message)
  }

  const engine = res.headers.get('X-Aura-Engine') ?? 'edge-neural'
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  return { url, engine, blob }
}

export function engineLabel(engine: string): string {
  switch (engine) {
    case 'lmnt':
      return 'LMNT Neural'
    case 'edge-neural':
      return 'Edge Neural'
    case 'mock':
      return 'Preview'
    default:
      return engine
  }
}
