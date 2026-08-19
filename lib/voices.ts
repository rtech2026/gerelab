export type VoiceCategory = 'native' | 'cloned'
export type VoiceGender = 'male' | 'female' | 'neutral'

/** App-facing voice shape, derived from the LMNT voice object. */
export type Voice = {
  id: string
  name: string
  description: string
  gender: VoiceGender
  owner: 'system' | 'me' | 'other'
  category: VoiceCategory
  tags: string[]
  previewUrl: string
  state: string
  /** Best-effort language/accent label parsed from the LMNT description. */
  language: string
  accent: string
}

export function normalizeGender(g?: string | null): VoiceGender {
  const v = (g ?? '').toLowerCase()
  if (v.startsWith('m')) return 'male'
  if (v.startsWith('f')) return 'female'
  return 'neutral'
}

export function genderLabel(g: VoiceGender): string {
  return g === 'male' ? 'Masculina' : g === 'female' ? 'Feminina' : 'Neutra'
}

/**
 * Parse a display language/accent out of an LMNT description string, e.g.
 * "Narrative. Excited. US" -> { language: 'Inglês (US)', accent: 'US' }.
 */
export function parseLanguage(description?: string | null): {
  language: string
  accent: string
} {
  const d = (description ?? '').trim()
  const map: Record<string, string> = {
    US: 'Inglês (US)',
    UK: 'Inglês (UK)',
    AU: 'Inglês (AU)',
    BR: 'Português (BR)',
    PT: 'Português (PT)',
    ES: 'Espanhol',
    FR: 'Francês',
    DE: 'Alemão',
    IT: 'Italiano',
    JP: 'Japonês',
    KR: 'Coreano',
    CN: 'Chinês',
    IN: 'Inglês (IN)',
  }
  const tokens = d.split(/[.\s]+/).map((t) => t.trim())
  for (let i = tokens.length - 1; i >= 0; i--) {
    const key = tokens[i].toUpperCase()
    if (map[key]) return { language: map[key], accent: key }
  }
  return { language: 'Multilíngue', accent: '' }
}

/** Minimal offline fallback (real LMNT system voice ids). */
export const FALLBACK_VOICES: Voice[] = [
  {
    id: 'leah',
    name: 'Leah',
    description: 'Voz feminina versátil e natural.',
    gender: 'female',
    owner: 'system',
    category: 'native',
    tags: [],
    previewUrl: 'https://api.lmnt.com/v1/ai/voice/leah/preview',
    state: 'ready',
    language: 'Multilíngue',
    accent: '',
  },
]

export function getVoiceById(id: string, list: Voice[] = []): Voice | undefined {
  return [...list, ...FALLBACK_VOICES].find((v) => v.id === id)
}
