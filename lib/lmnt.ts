const LMNT_BASE = 'https://api.lmnt.com'
const LMNT_VERSION = '1.2'

function apiKey() {
  const key = process.env.LMNT_API_KEY
  if (!key) throw new Error('LMNT_API_KEY não configurada')
  return key
}

function headers(extra: Record<string, string> = {}) {
  return {
    'X-API-Key': apiKey(),
    'lmnt-version': LMNT_VERSION,
    ...extra,
  }
}

/* ------------------------------- Voices --------------------------------- */

export type LmntVoice = {
  id: string
  name: string
  state: string
  owner: 'system' | 'me' | 'other'
  type: string
  description: string | null
  gender: string | null
  starred: boolean
  tags: string[] | null
  preview_url: string
}

export async function listVoices(
  owner: 'system' | 'me' | 'all' = 'all',
): Promise<LmntVoice[]> {
  const res = await fetch(`${LMNT_BASE}/v1/ai/voice/list?owner=${owner}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`LMNT list voices ${res.status}`)
  }
  const data = (await res.json()) as LmntVoice[]
  return Array.isArray(data) ? data : []
}

/* ------------------------------- Account -------------------------------- */

export type LmntAccount = {
  plan: { type: string; commercial_use_allowed: boolean; character_limit: number }
  usage: {
    characters: number
    playground_characters: number
    credit_characters: number
    period_end: number
  }
}

export async function getAccount(): Promise<LmntAccount | null> {
  try {
    const res = await fetch(`${LMNT_BASE}/v1/account`, {
      headers: headers(),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as LmntAccount
  } catch {
    return null
  }
}

/* ------------------------------- Speech --------------------------------- */

export type SynthesizeInput = {
  text: string
  voice: string
  language?: string
  format?: string
  sampleRate?: number
  temperature?: number
  topP?: number
  model?: string
}

export async function synthesizeSpeech(
  input: SynthesizeInput,
): Promise<Buffer> {
  const body: Record<string, unknown> = {
    text: input.text,
    voice: input.voice,
    format: input.format ?? 'mp3',
    sample_rate: input.sampleRate ?? 24000,
  }
  if (input.language && input.language !== 'auto') body.language = input.language
  if (typeof input.temperature === 'number') body.temperature = input.temperature
  if (typeof input.topP === 'number') body.top_p = input.topP
  if (input.model) body.model = input.model

  const res = await fetch(`${LMNT_BASE}/v1/ai/speech/bytes`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.error?.message ?? ''
    } catch {}
    throw new Error(`LMNT speech ${res.status}${detail ? `: ${detail}` : ''}`)
  }

  const arr = await res.arrayBuffer()
  return Buffer.from(arr)
}

/* -------------------------------- Clone --------------------------------- */

export type CreateVoiceInput = {
  name: string
  file: File
  description?: string
  gender?: string
  tags?: string[]
}

export async function createVoice(
  input: CreateVoiceInput,
): Promise<LmntVoice> {
  const form = new FormData()
  form.append('name', input.name)
  form.append('file', input.file, input.file.name || 'sample.wav')
  if (input.description) form.append('description', input.description)
  if (input.gender) form.append('gender', input.gender)
  if (input.tags) input.tags.forEach((t) => form.append('tags', t))

  const res = await fetch(`${LMNT_BASE}/v1/ai/voice`, {
    method: 'POST',
    headers: headers(),
    body: form,
  })

  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.error?.message ?? ''
    } catch {}
    throw new Error(`LMNT create voice ${res.status}${detail ? `: ${detail}` : ''}`)
  }

  return (await res.json()) as LmntVoice
}
