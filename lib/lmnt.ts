import { getActiveApiKey, getEngineState, reportKeyQuotaExceeded } from '@/lib/lmnt-state';

const LMNT_BASE = 'https://api.lmnt.com'
const LMNT_VERSION = '1.2'

function getApiKey() {
  const poolKey = getActiveApiKey();
  if (poolKey) return poolKey;
  const key = process.env.LMNT_API_KEY;
  if (!key) throw new Error('Nenhuma chave LMNT ativa no Pool');
  return key;
}

function getHeaders(key: string, extra: Record<string, string> = {}) {
  return {
    'X-API-Key': key,
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
  const key = getApiKey();
  const res = await fetch(`${LMNT_BASE}/v1/ai/voice/list?owner=${owner}`, {
    headers: getHeaders(key),
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
    const key = getApiKey();
    const res = await fetch(`${LMNT_BASE}/v1/account`, {
      headers: getHeaders(key),
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
): Promise<{ buffer: Buffer; engine: string }> {
  const state = getEngineState();
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

  // 1. Tenta Playground Session se ativa
  if (state.session?.status === 'active' && state.session.playgroundSessionToken) {
    try {
      const playgroundHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'lmnt-version': LMNT_VERSION,
        'Authorization': `Bearer ${state.session.playgroundSessionToken}`
      };
      if (state.session.cookieHeader) {
        playgroundHeaders['Cookie'] = state.session.cookieHeader;
      }
      const pRes = await fetch(`${LMNT_BASE}/v1/ai/speech/bytes`, {
        method: 'POST',
        headers: playgroundHeaders,
        body: JSON.stringify(body)
      });
      if (pRes.ok) {
        const arr = await pRes.arrayBuffer();
        return { buffer: Buffer.from(arr), engine: 'lmnt-playground-bypass' };
      }
    } catch (err) {
      console.log('[LMNT Bypass] Session error, failing over to API pool...');
    }
  }

  // 2. Pool de Chaves API LMNT com rotação
  const activeKeys = state.keys.filter(k => k.status === 'active');
  for (const k of activeKeys) {
    try {
      const res = await fetch(`${LMNT_BASE}/v1/ai/speech/bytes`, {
        method: 'POST',
        headers: getHeaders(k.key, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const arr = await res.arrayBuffer();
        return { buffer: Buffer.from(arr), engine: 'lmnt-api-pool' };
      }

      if (res.status === 429 || res.status === 402) {
        console.log(`[LMNT Pool] Cota atingida para chave ${k.name}, marcando quota_exceeded`);
        reportKeyQuotaExceeded(k.key);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.log(`[LMNT Pool] Erro na síntese com chave ${k.name}: ${res.status}`, errJson);
      }
    } catch (err) {
      console.log(`[LMNT Pool] Erro na chave ${k.name}:`, (err as Error).message);
    }
  }

  // 3. Fallback inteligente Edge-TTS gratuito
  try {
    const { synthesizeEdgeTTS } = await import('@/lib/edge-tts');
    const edgeBuffer = await synthesizeEdgeTTS(input.text, input.voice);
    return { buffer: edgeBuffer, engine: 'edge-tts-failover' };
  } catch (err) {
    console.log('[GereLab TTS] Edge failover error:', (err as Error).message);
    throw new Error('Falha em todos os pipelines de síntese de voz');
  }
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
  const key = getApiKey();
  const form = new FormData()
  form.append('name', input.name)
  form.append('file', input.file, input.file.name || 'sample.wav')
  if (input.description) form.append('description', input.description)
  if (input.gender) form.append('gender', input.gender)
  if (input.tags) input.tags.forEach((t) => form.append('tags', t))

  const res = await fetch(`${LMNT_BASE}/v1/ai/voice`, {
    method: 'POST',
    headers: getHeaders(key),
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
