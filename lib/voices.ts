export type VoiceCategory = 'native' | 'cloned'

export type Voice = {
  id: string
  name: string
  /** Provider voice id used by the Edge Neural TTS fallback */
  edgeVoice: string
  language: string
  langCode: string
  flag: string
  gender: 'male' | 'female'
  accent: string
  description: string
  category: VoiceCategory
  tags: string[]
}

/**
 * Curated native voices. `edgeVoice` maps to Microsoft Edge Neural voices used
 * by the free fallback engine so previews work without any API key.
 */
export const NATIVE_VOICES: Voice[] = [
  {
    id: 'ptbr-antonio',
    name: 'Antonio',
    edgeVoice: 'pt-BR-AntonioNeural',
    language: 'Português (Brasil)',
    langCode: 'PT-BR',
    flag: 'BR',
    gender: 'male',
    accent: 'Neutro',
    description: 'Locução masculina calorosa, ideal para narração e podcasts.',
    category: 'native',
    tags: ['Narração', 'Podcast'],
  },
  {
    id: 'ptbr-francisca',
    name: 'Francisca',
    edgeVoice: 'pt-BR-FranciscaNeural',
    language: 'Português (Brasil)',
    langCode: 'PT-BR',
    flag: 'BR',
    gender: 'female',
    accent: 'Neutro',
    description: 'Voz feminina expressiva e versátil para qualquer conteúdo.',
    category: 'native',
    tags: ['Comercial', 'E-learning'],
  },
  {
    id: 'ptbr-thalita',
    name: 'Thalita',
    edgeVoice: 'pt-BR-ThalitaMultilingualNeural',
    language: 'Português (Brasil)',
    langCode: 'PT-BR',
    flag: 'BR',
    gender: 'female',
    accent: 'Multilíngue',
    description: 'Timbre jovem e natural, excelente para redes sociais.',
    category: 'native',
    tags: ['Social', 'Multilíngue'],
  },
  {
    id: 'enus-andrew',
    name: 'Andrew',
    edgeVoice: 'en-US-AndrewMultilingualNeural',
    language: 'English (US)',
    langCode: 'EN-US',
    flag: 'US',
    gender: 'male',
    accent: 'American',
    description: 'Confident, conversational tone for product and ads.',
    category: 'native',
    tags: ['Commercial', 'Conversational'],
  },
  {
    id: 'enus-ava',
    name: 'Ava',
    edgeVoice: 'en-US-AvaMultilingualNeural',
    language: 'English (US)',
    langCode: 'EN-US',
    flag: 'US',
    gender: 'female',
    accent: 'American',
    description: 'Crisp, friendly delivery tuned for assistants and UI.',
    category: 'native',
    tags: ['Assistant', 'UI'],
  },
  {
    id: 'eses-alvaro',
    name: 'Álvaro',
    edgeVoice: 'es-ES-AlvaroNeural',
    language: 'Español (España)',
    langCode: 'ES-ES',
    flag: 'ES',
    gender: 'male',
    accent: 'Castellano',
    description: 'Locución profesional con dicción clara y neutra.',
    category: 'native',
    tags: ['Locución', 'Corporativo'],
  },
]

export function getVoiceById(id: string, extra: Voice[] = []): Voice | undefined {
  return [...NATIVE_VOICES, ...extra].find((v) => v.id === id)
}
