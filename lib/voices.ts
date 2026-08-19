export type VoiceGender = 'male' | 'female' | 'neutral'
export type VoiceCategory = 'native' | 'cloned' | 'custom'

export type Voice = {
  id: string
  name: string
  description?: string | null
  gender: VoiceGender
  owner: 'system' | 'me' | 'other'
  category: VoiceCategory
  tags: string[]
  previewUrl?: string | null
  state?: string
  language?: string
  accent?: string
  flagCode?: string
}

export function normalizeGender(raw?: string | null): VoiceGender {
  if (!raw) return 'neutral'
  const g = raw.toLowerCase()
  if (g.startsWith('m') || g === 'male') return 'male'
  if (g.startsWith('f') || g === 'female') return 'female'
  return 'neutral'
}

export function formatTag(tag: string): string {
  if (!tag) return 'Natural'
  const t = tag.toLowerCase().trim()
  const map: Record<string, string> = {
    'primary:marketer': 'Comercial & Vendas',
    'primary:marketing': 'Comercial & Vendas',
    'primary:support agent': 'Atendimento & SAC',
    'primary:support': 'Atendimento & SAC',
    'primary:broadcaster': 'Locução & Rádio',
    'primary:broadcast': 'Locução & Rádio',
    'primary:asmr': 'Sussurros & ASMR',
    'primary:narrator': 'Narrativa & Livros',
    'primary:narration': 'Narrativa & Livros',
    'primary:conversational': 'Conversa Natural',
    'primary:conversation': 'Conversa Natural',
    'primary:character': 'Personagem & Games',
    'primary:meditation': 'Meditação & Calma',
    'primary:podcast': 'Podcast & Dinâmica',
    'primary:news': 'Jornalismo & Notícias',
    'primary:education': 'Educacional & Cursos',
    'primary:storyteller': 'Storytelling',
    'multilingual': 'Multilíngue',
    'ultra hd': 'Voz Neural',
    'expressive': 'Expressiva',
    'natural': 'Natural',
  }
  if (map[t]) return map[t]
  if (t.startsWith('primary:')) {
    const raw = t.replace('primary:', '').replace(/_/g, ' ')
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

/**
 * Mapeamento enriquecido White-Label para português do Brasil
 */
export const VOICE_DISPLAY_MAP: Record<
  string,
  {
    name: string
    description: string
    gender: VoiceGender
    tags: string[]
    language: string
    accent: string
    flagCode: string
  }
> = {
  // Clones do Usuário VIP
  v_ld7xztwxsp536z4i5lgv2j: {
    name: 'Clone RD Master',
    description: 'Voz personalizada com clonagem neural profunda. Fidelidade máxima.',
    gender: 'male',
    tags: ['Clone Pessoal', 'Exclusivo', 'Realista'],
    language: 'Português (BR)',
    accent: 'BR',
    flagCode: 'br',
  },
  v_iwercvtwhssvwuvvcefcsb5: {
    name: 'Clone RD Comercial',
    description: 'Voz clonada personalizada de alta definição para anúncios.',
    gender: 'male',
    tags: ['Clone Pessoal', 'Comercial'],
    language: 'Português (BR)',
    accent: 'BR',
    flagCode: 'br',
  },
  v_c3edxvpefusrfgpy7mrq3n: {
    name: 'Clone RD Narrativa',
    description: 'Voz clonada personalizada para histórias e podcasts.',
    gender: 'male',
    tags: ['Clone Pessoal', 'Narrativa'],
    language: 'Português (BR)',
    accent: 'BR',
    flagCode: 'br',
  },
  // Vozes Principais LMNT
  daniel: {
    name: 'Gabriel (Locutor Profissional)',
    description: 'Voz masculina encorpada, autoritária e serena. Ideal para cursos, anúncios e negócios.',
    gender: 'male',
    tags: ['Locução & Rádio', 'Comercial & Vendas', 'Audiolivro'],
    language: 'Português (BR)',
    accent: 'BR',
    flagCode: 'br',
  },
  lily: {
    name: 'Helena (Storytelling & Vídeos)',
    description: 'Voz feminina natural, tom caloroso e envolvente. Excelente para roteiros e vídeos.',
    gender: 'female',
    tags: ['Storytelling', 'Conversa Natural', 'Expressiva'],
    language: 'Português (BR)',
    accent: 'BR',
    flagCode: 'br',
  },
  sophie: {
    name: 'Laura (Institucional Elegante)',
    description: 'Voz feminina elegante com dicção cristalina. Perfeita para vídeos corporativos.',
    gender: 'female',
    tags: ['Atendimento & SAC', 'Educacional & Cursos'],
    language: 'Multilíngue',
    accent: 'UK',
    flagCode: 'uk',
  },
  tyler: {
    name: 'Lucas (Jovem Criador & Reels)',
    description: 'Voz masculina enérgica e moderna. Perfeita para conteúdo digital e reels.',
    gender: 'male',
    tags: ['Podcast & Dinâmica', 'Conversa Natural'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  },
  sadie: {
    name: 'Sofia (Comercial & Vendas)',
    description: 'Voz feminina jovem, articulada e vibrante. Ideal para spots publicitários.',
    gender: 'female',
    tags: ['Comercial & Vendas', 'Expressiva'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  },
  terrence: {
    name: 'Marcos (Narrador Épico)',
    description: 'Voz masculina grave, profunda e imersiva. Ideal para documentários.',
    gender: 'male',
    tags: ['Narrativa & Livros', 'Locução & Rádio'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  },
  stella: {
    name: 'Camila (Didática & Acolhedora)',
    description: 'Voz feminina confiante e acolhedora com tom articulado e preciso.',
    gender: 'female',
    tags: ['Educacional & Cursos', 'Comercial & Vendas'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  },
  chloe: {
    name: 'Juliana (Persuasão & Copy)',
    description: 'Voz feminina dinâmica e persuasiva, excelente para copywriting.',
    gender: 'female',
    tags: ['Comercial & Vendas', 'Storytelling'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  },
  ryan: {
    name: 'Bruno (Podcast & Dinâmico)',
    description: 'Voz masculina moderna e comunicativa para bate-papos e mídia digital.',
    gender: 'male',
    tags: ['Podcast & Dinâmica', 'Conversa Natural'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  },
  magnus: {
    name: 'Rodrigo (Corporativo & Executivo)',
    description: 'Voz masculina segura, firme e confiável para apresentações.',
    gender: 'male',
    tags: ['Locução & Rádio', 'Comercial & Vendas'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  },
  zoe: {
    name: 'Alice (Suave & Meditação)',
    description: 'Voz feminina delicada e envolvente para meditação e relaxamento.',
    gender: 'female',
    tags: ['Meditação & Calma', 'Sussurros & ASMR'],
    language: 'Multilíngue',
    accent: 'US',
    flagCode: 'us',
  }
}

export function parseLanguage(description?: string | null): {
  language: string
  accent: string
  flagCode: string
} {
  const d = (description ?? '').trim()
  const map: Record<string, { label: string; flag: string }> = {
    BR: { label: 'Português (BR)', flag: 'br' },
    PT: { label: 'Português (PT)', flag: 'pt' },
    US: { label: 'Inglês (US)', flag: 'us' },
    UK: { label: 'Inglês (UK)', flag: 'uk' },
    AU: { label: 'Inglês (AU)', flag: 'us' },
    ES: { label: 'Espanhol', flag: 'es' },
    FR: { label: 'Francês', flag: 'fr' },
    DE: { label: 'Alemão', flag: 'de' },
    IT: { label: 'Italiano', flag: 'it' },
    JP: { label: 'Japonês', flag: 'jp' },
    KR: { label: 'Coreano', flag: 'kr' },
    CN: { label: 'Chinês', flag: 'cn' },
    IN: { label: 'Hindi / Inglês', flag: 'in' },
  }
  const tokens = d.split(/[.s]+/).map((t) => t.trim())
  for (let i = tokens.length - 1; i >= 0; i--) {
    const key = tokens[i].toUpperCase()
    if (map[key]) return { language: map[key].label, accent: key, flagCode: map[key].flag }
  }
  return { language: 'Português (BR)', accent: 'BR', flagCode: 'br' }
}

/** Fallback offline */
export const FALLBACK_VOICES: Voice[] = [
  {
    id: 'daniel',
    name: 'Gabriel (Locutor Profissional)',
    description: 'Voz masculina encorpada, autoritária e serena. Ideal para cursos e negócios.',
    gender: 'male',
    owner: 'system',
    category: 'native',
    tags: ['Locução & Rádio', 'Comercial & Vendas'],
    previewUrl: 'https://api.lmnt.com/v1/ai/voice/daniel/preview',
    state: 'ready',
    language: 'Português (BR)',
    accent: 'BR',
    flagCode: 'br',
  },
  {
    id: 'lily',
    name: 'Helena (Storytelling & Vídeos)',
    description: 'Voz feminina natural, tom caloroso e expressivo.',
    gender: 'female',
    owner: 'system',
    category: 'native',
    tags: ['Storytelling', 'Conversa Natural'],
    previewUrl: 'https://api.lmnt.com/v1/ai/voice/lily/preview',
    state: 'ready',
    language: 'Português (BR)',
    accent: 'BR',
    flagCode: 'br',
  },
]

export function getVoiceById(id: string, list: Voice[] = []): Voice | undefined {
  const safeList = Array.isArray(list) ? list : []
  return [...safeList, ...FALLBACK_VOICES].find((v) => v.id.toLowerCase() === id?.toLowerCase())
}
