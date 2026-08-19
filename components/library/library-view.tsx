'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Play,
  Pause,
  Plus,
  Trash2,
  UserCheck,
  Search,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  Volume2,
  Mic2,
  Globe2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useVoices } from '@/components/voices-provider'
import { usePlayer } from '@/components/player/player-provider'
import { FlagIcon } from '@/components/studio/language-flags'
import type { Voice } from '@/lib/voices'

/* ─────────────────────────────────────────────────────────────
   Voice Card — ElevenLabs SaaS Premium Style (Bordas sólidas, Alto contraste)
   ───────────────────────────────────────────────────────────── */
function VoiceCard({
  voice,
  onDelete,
}: {
  voice: Voice
  onDelete?: (id: string) => void
}) {
  const { current, isPlaying, loadAndPlay, togglePlay } = usePlayer()
  const isThis = current?.id === voice.id
  const isPlayingThis = isThis && isPlaying
  const isClone =
    voice.category === 'cloned' ||
    voice.id.startsWith('v_') ||
    voice.name.toLowerCase().includes('clone')

  const playPreview = () => {
    if (isThis) {
      togglePlay()
      return
    }
    if (!voice.previewUrl) return
    loadAndPlay({
      id: voice.id,
      title: `Amostra: ${voice.name}`,
      voiceName: voice.name,
      url: voice.previewUrl,
      format: 'mp3',
      chars: 0,
      createdAt: Date.now(),
      engine: 'GereLab Voice',
    })
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-card p-5 hover:border-foreground/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar com Badge de Bandeira */}
          <div className="relative flex size-12 items-center justify-center rounded-xl bg-muted border border-border/80 shrink-0 font-bold text-foreground text-base shadow-sm">
            {voice.name.charAt(0).toUpperCase()}
            <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background border-2 border-border shadow-sm">
              <FlagIcon code={voice.flagCode || 'br'} className="size-3.5 rounded-full" />
            </div>
          </div>

          {/* Identificação da Voz */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-base truncate">
                {voice.name}
              </h3>
              {isClone && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  Clone
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
              <span>{voice.gender === 'female' ? 'Feminina' : 'Masculina'}</span>
              <span>•</span>
              <span className="truncate">{voice.language || 'Português'}</span>
              {voice.accent && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-muted-foreground/80">{voice.accent}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botão Play destacado */}
        <button
          type="button"
          onClick={playPreview}
          disabled={!voice.previewUrl}
          className={`flex size-11 items-center justify-center rounded-xl border-2 transition-all duration-150 shrink-0 ${
            isPlayingThis
              ? 'bg-foreground text-background border-foreground shadow-md scale-105'
              : 'bg-muted/70 text-foreground border-border hover:bg-foreground hover:text-background hover:border-foreground hover:scale-105'
          } ${!voice.previewUrl ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isPlayingThis ? 'Pausar' : 'Ouvir amostra de voz'}
        >
          {isPlayingThis ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Descrição sutil se houver */}
      {voice.description && (
        <p className="mt-3 text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
          {voice.description}
        </p>
      )}

      {/* Rodapé do Card: Tags e Botão de Ação */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {voice.tags && voice.tags.length > 0 ? (
            voice.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/50"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/50">
              Voz Natural
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onDelete && voice.owner === 'me' && (
            <button
              type="button"
              onClick={() => onDelete(voice.id)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir clone"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-all"
          >
            <span>Usar voz</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Library View — ElevenLabs SaaS Layout
   ───────────────────────────────────────────────────────────── */
export function LibraryView() {
  const { native, cloned, removeCloned, loading } = useVoices()
  const [filter, setFilter] = React.useState('all')
  const [genderFilter, setGenderFilter] = React.useState<'all' | 'female' | 'male'>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showAllNative, setShowAllNative] = React.useState(false)

  const FILTERS = [
    { value: 'all', label: 'Todas as Vozes', flag: null, count: native.length + cloned.length },
    { value: 'br', label: 'Português', flag: 'br', count: native.filter(v => v.flagCode === 'br' || v.language?.toLowerCase().includes('português')).length },
    { value: 'us', label: 'Inglês', flag: 'us', count: native.filter(v => v.flagCode === 'us' || v.flagCode === 'uk' || v.language?.toLowerCase().includes('inglês')).length },
    { value: 'es', label: 'Espanhol', flag: 'es', count: native.filter(v => v.flagCode === 'es' || v.language?.toLowerCase().includes('espanhol')).length },
    { value: 'cloned', label: 'Meus Clones', flag: null, icon: true, count: cloned.length },
  ]

  const filteredNative = native.filter((v) => {
    if (filter === 'cloned') return false
    if (filter === 'br' && !v.language?.toLowerCase().includes('português') && v.flagCode !== 'br') return false
    if (filter === 'us' && !v.language?.toLowerCase().includes('inglês') && v.flagCode !== 'us' && v.flagCode !== 'uk') return false
    if (filter === 'es' && !v.language?.toLowerCase().includes('espanhol') && v.flagCode !== 'es') return false
    if (genderFilter !== 'all' && v.gender !== genderFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        v.name.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const filteredCloned = cloned.filter((v) => {
    if (filter !== 'all' && filter !== 'cloned') return false
    if (searchQuery.trim()) return v.name.toLowerCase().includes(searchQuery.toLowerCase())
    return true
  })

  const VISIBLE_COUNT = 18
  const displayedNative = showAllNative ? filteredNative : filteredNative.slice(0, VISIBLE_COUNT)
  const hasMore = filteredNative.length > VISIBLE_COUNT

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 flex flex-col gap-8">

      {/* ── Header Principal ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Biblioteca de Vozes
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Explore {native.length + cloned.length} vozes ultra-realistas com sotaques, emoções e estilos prontos para seu projeto.
          </p>
        </div>
        <Link
          href="/clone"
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Clonar Nova Voz</span>
        </Link>
      </div>

      {/* ── Barra de Filtros ElevenLabs — Grande, Clara e Confortável ── */}
      <div className="flex flex-col gap-4">
        {/* Linha 1: Idiomas e Categorias Principais */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {FILTERS.map((f) => {
            const isActive = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                  isActive
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card text-foreground border-border/80 hover:border-foreground/50 hover:bg-muted'
                }`}
              >
                {f.flag && <FlagIcon code={f.flag} className="size-4 rounded-full" />}
                {f.icon && <UserCheck className="size-4" />}
                <span>{f.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                }`}>
                  {f.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Linha 2: Busca e Filtro de Gênero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl border-2 border-border/80 bg-card">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, tag ou estilo..."
              className="w-full bg-transparent pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Toggle de Gênero */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 self-start sm:self-auto">
            {(['all', 'female', 'male'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  genderFilter === g
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {g === 'all' ? 'Todos' : g === 'female' ? 'Femininas' : 'Masculinas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grade de Vozes ── */}
      <div className="flex flex-col gap-8">
        {/* Clones do Usuário */}
        {filteredCloned.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <UserCheck className="size-4" />
              <span>Minhas Vozes Clonadas ({filteredCloned.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCloned.map((voice) => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  onDelete={(id) => removeCloned(id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Vozes Oficiais da Biblioteca */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-4" />
              <span>Vozes Disponíveis ({filteredNative.length})</span>
            </div>
            {filteredNative.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                Mostrando {displayedNative.length} de {filteredNative.length}
              </span>
            )}
          </div>

          {displayedNative.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {displayedNative.map((voice) => (
                <VoiceCard key={voice.id} voice={voice} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <Volume2 className="size-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-foreground text-base">Nenhuma voz encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Tente ajustar os filtros ou termos da sua busca para encontrar outras opções.
              </p>
            </div>
          )}

          {/* Botão Ver Mais */}
          {hasMore && !showAllNative && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAllNative(true)}
                className="rounded-xl border-2 border-border/80 px-8 font-semibold hover:border-foreground/40"
              >
                Carregar todas as {filteredNative.length} vozes
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
