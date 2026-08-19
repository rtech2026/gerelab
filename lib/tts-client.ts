import type { Voice } from '@/lib/voices'

export type GenerateResult = {
  url: string
  engine: string
  blob: Blob
  creditsRemaining: number | null
}

export type GenerateOptions = {
  language?: string
  format?: string
  temperature?: number
  topP?: number
}

export async function generateSpeech(
  text: string,
  voice: Voice,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voiceId: voice.id,
      voiceName: voice.name,
      language: opts.language,
      format: opts.format ?? 'mp3',
      temperature: opts.temperature,
      topP: opts.topP,
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

  const engine = res.headers.get('X-Aura-Engine') ?? 'lmnt'
  const remainingHeader = res.headers.get('X-Aura-Credits-Remaining')
  const creditsRemaining = remainingHeader ? Number(remainingHeader) : null
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  return { url, engine, blob, creditsRemaining }
}

export function engineLabel(engine: string): string {
  switch (engine) {
    case 'lmnt':
      return 'LMNT Neural'
    default:
      return engine
  }
}
