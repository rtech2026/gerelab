'use client'

import * as React from 'react'
import {
  Search,
  Check,
  Play,
  Pause,
  ChevronDown,
  UserCheck,
  Sparkles,
  SlidersHorizontal,
  Volume2,
  X,
} from 'lucide-react'
import { useVoices } from '@/components/voices-provider'
import { getVoiceById, type Voice } from '@/lib/voices'
import { FlagIcon } from '@/components/studio/language-flags'
import { usePlayer } from '@/components/player/player-provider'
import { Badge } from '@/components/ui/badge'

export function VoiceSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const { native, cloned, all, loading } = useVoices()
  const { current, isPlaying, loadAndPlay, togglePlay } = usePlayer()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'all' | 'br' | 'other' | 'cloned'>('all')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selected = getVoiceById(value, all) || all[0]

  // Fecha dropdown ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Filtragem
  const filteredVoices = (all || []).filter((v) => {
    const isClone = v.category === 'cloned' || v.owner === 'me'
    if (activeTab === 'cloned' && !isClone) return false
    if (activeTab === 'br' && v.flagCode !== 'br' && !v.language?.toLowerCase().includes('português')) return false
    if (activeTab === 'other' && (v.flagCode === 'br' || isClone)) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        v.name.toLowerCase().includes(q) ||
        v.language?.toLowerCase().includes(q) ||
        v.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const playVoicePreview = (e: React.MouseEvent, v: Voice) => {
    e.stopPropagation()
    const isThis = current?.id === v.id
    if (isThis) {
      togglePlay()
      return
    }
    if (!v.previewUrl) return
    loadAndPlay({
      id: v.id,
      title: `Amostra: ${v.name}`,
      voiceName: v.name,
      url: v.previewUrl,
      format: 'mp3',
      chars: 0,
      createdAt: Date.now(),
      engine: 'GereLab Voice AI',
    })
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* ── Botão Trigger Principal ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 h-10 px-3.5 rounded-xl bg-card border-2 border-border/80 hover:border-foreground/40 text-foreground transition-all shadow-sm focus:outline-none"
      >
        {selected ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div className="relative flex size-6 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0">
              {selected.name.charAt(0)}
              <div className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-background border border-border shadow-xs">
                <FlagIcon code={selected.flagCode || 'br'} className="size-2.5 rounded-full" />
              </div>
            </div>

            {/* Nome da Voz */}
            <span className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[160px] sm:max-w-[200px]">
              {selected.name}
            </span>

            {/* Tag em Português */}
            <span className="hidden sm:inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50 truncate max-w-[110px]">
              {selected.tags?.[0] || 'Voz Neural'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {loading ? 'Carregando vozes...' : 'Selecione uma voz'}
          </span>
        )}

        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Dropdown / Modal Flutuante ElevenLabs ── */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-[340px] sm:w-[420px] max-w-[95vw] rounded-2xl border-2 border-border/90 bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          
          {/* Header do Dropdown com Busca */}
          <div className="p-3 border-b border-border/60 bg-muted/30 flex flex-col gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, idioma ou estilo..."
                className="w-full bg-background pl-9 pr-8 py-2 rounded-xl border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filtros em Abas */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'br', label: 'Português (BR)', flag: 'br' },
                { id: 'cloned', label: 'Clonadas', icon: UserCheck },
                { id: 'other', label: 'Internacionais' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-foreground text-background shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.flag && <FlagIcon code={tab.flag} className="size-2.5 rounded-full" />}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Vozes */}
          <div className="max-h-[340px] overflow-y-auto p-1.5 space-y-1 divide-y divide-border/40">
            {filteredVoices.length > 0 ? (
              filteredVoices.map((v) => {
                const isSelected = (selected?.id || value) === v.id
                const isThisPlaying = current?.id === v.id && isPlaying

                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      onChange(v.id)
                      setOpen(false)
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/20 text-foreground font-semibold'
                        : 'hover:bg-muted/70 text-foreground'
                    }`}
                  >
                    {/* Info da Voz */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar com Bandeira */}
                      <div className="relative flex size-9 items-center justify-center rounded-xl bg-muted border border-border shrink-0 font-bold text-xs">
                        {v.name.charAt(0)}
                        <div className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background border border-border shadow-xs">
                          <FlagIcon code={v.flagCode || 'br'} className="size-2.5 rounded-full" />
                        </div>
                      </div>

                      {/* Nome + Detalhes em Português */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {v.name}
                          </span>
                          {v.category === 'cloned' && (
                            <span className="inline-flex items-center rounded-md bg-primary/15 text-primary px-1.5 py-0.2 text-[9px] font-bold uppercase">
                              Clone
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                          <span>{v.gender === 'female' ? 'Feminina' : 'Masculina'}</span>
                          <span>•</span>
                          <span className="truncate text-foreground/80 font-medium">{v.tags?.[0] || 'Voz Natural'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações: Play Amostra & Check */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {v.previewUrl && (
                        <button
                          type="button"
                          onClick={(e) => playVoicePreview(e, v)}
                          className={`flex size-7 items-center justify-center rounded-lg border transition-all ${
                            isThisPlaying
                              ? 'bg-foreground text-background border-foreground shadow-xs'
                              : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          title="Ouvir amostra"
                        >
                          {isThisPlaying ? (
                            <Pause className="size-3 fill-current" />
                          ) : (
                            <Play className="size-3 fill-current ml-0.5" />
                          )}
                        </button>
                      )}

                      {isSelected && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhuma voz encontrada para os filtros selecionados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
