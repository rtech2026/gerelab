'use client'

import * as React from 'react'
import {
  Play,
  Pause,
  Download,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Layers,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDown,
  Archive,
  Split,
  ChevronDown,
  ChevronUp,
  Volume2,
  Check,
  Combine,
  Music2,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VoiceSelector } from '@/components/studio/voice-selector'
import { FlagIcon } from '@/components/studio/language-flags'
import { useVoices } from '@/components/voices-provider'
import { useCredits } from '@/components/credits-provider'
import { usePlayer } from '@/components/player/player-provider'
import { mergeAudioBlobs } from '@/lib/audio-stitcher'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import JSZip from 'jszip'

export interface BatchItem {
  id: string
  text: string
  voiceId: string
  status: 'idle' | 'generating' | 'success' | 'error'
  audioUrl?: string
  blob?: Blob
  error?: string
  charCount?: number
  format: 'mp3' | 'wav'
}

const DEFAULT_PROMPTS = [
  'Olá! Seja muito bem-vindo ao GereLab. Vamos criar narrações incríveis.',
  'Esta é a segunda parte do nosso roteiro, com entonação firme e clara.',
  'Finalizamos com chave de ouro, entregando uma experiência de áudio imersiva.',
]

export function BatchStudio() {
  const { all: voices } = useVoices()
  const { charsRemaining, refresh: refreshCredits } = useCredits()
  const { loadAndPlay, current, isPlaying, togglePlay } = usePlayer()

  const [items, setItems] = React.useState<BatchItem[]>(() =>
    DEFAULT_PROMPTS.map((t, idx) => ({
      id: `prompt-${Date.now()}-${idx}`,
      text: t,
      voiceId: 'daniel',
      status: 'idle',
      format: 'mp3',
    }))
  )

  const [globalVoiceId, setGlobalVoiceId] = React.useState('daniel')
  const [globalFormat, setGlobalFormat] = React.useState<'mp3' | 'wav'>('mp3')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progressCount, setProgressCount] = React.useState(0)
  const [importText, setImportText] = React.useState('')
  const [showImportModal, setShowImportModal] = React.useState(false)
  const [isZipping, setIsZipping] = React.useState(false)

  // Configuração da Mesclagem / Emenda de Áudios
  const [pauseDuration, setPauseDuration] = React.useState(0.5) // Pausa de 0.5s entre frases
  const [isMerging, setIsMerging] = React.useState(false)
  const [mergedAudio, setMergedAudio] = React.useState<{
    url: string
    duration: number
    blob: Blob
    id: string
  } | null>(null)

  const cancelRef = React.useRef(false)

  // Sincroniza primeira voz se necessário
  React.useEffect(() => {
    if (voices && voices.length > 0) {
      const exists = voices.some((v) => v.id.toLowerCase() === globalVoiceId.toLowerCase())
      if (!exists) {
        setGlobalVoiceId(voices[0].id)
      }
    }
  }, [voices, globalVoiceId])

  // Total de caracteres calculados
  const totalChars = items.reduce((acc, item) => acc + item.text.trim().length, 0)
  const completedCount = items.filter((i) => i.status === 'success' && (i.audioUrl || i.blob)).length
  const hasCredits = charsRemaining >= totalChars

  // Adicionar novo bloco
  const addItem = () => {
    const newItem: BatchItem = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: '',
      voiceId: globalVoiceId,
      status: 'idle',
      format: globalFormat,
    }
    setItems((prev) => [...prev, newItem])
  }

  // Atualizar texto do bloco
  const updateText = (id: string, text: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, text, status: item.status === 'success' ? 'idle' : item.status } : item
      )
    )
  }

  // Atualizar voz do bloco
  const updateVoice = (id: string, voiceId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, voiceId } : item))
    )
  }

  // Remover bloco
  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('Você precisa manter ao menos um bloco.')
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Duplicar bloco
  const duplicateItem = (index: number) => {
    const target = items[index]
    const duplicated: BatchItem = {
      ...target,
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'idle',
      audioUrl: undefined,
      blob: undefined,
    }
    const next = [...items]
    next.splice(index + 1, 0, duplicated)
    setItems(next)
  }

  // Aplicar voz global para todos os blocos
  const applyGlobalVoiceToAll = (newVoiceId: string) => {
    setGlobalVoiceId(newVoiceId)
    setItems((prev) => prev.map((item) => ({ ...item, voiceId: newVoiceId })))
    toast.success('Voz aplicada a todos os blocos!')
  }

  // Importar texto em múltiplos blocos
  const handleImportText = (mode: 'lines' | 'paragraphs') => {
    if (!importText.trim()) {
      toast.error('Cole um texto para importar.')
      return
    }

    const segments = mode === 'paragraphs'
      ? importText.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
      : importText.split('\n').map((s) => s.trim()).filter(Boolean)

    if (segments.length === 0) {
      toast.error('Nenhum parágrafo ou linha válido encontrado.')
      return
    }

    const newItems: BatchItem[] = segments.map((seg, idx) => ({
      id: `prompt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      text: seg,
      voiceId: globalVoiceId,
      status: 'idle',
      format: globalFormat,
    }))

    setItems(newItems)
    setImportText('')
    setShowImportModal(false)
    toast.success(`${segments.length} blocos criados com sucesso!`)
  }

  // Gerar um único item
  const generateSingleItem = async (item: BatchItem, index: number) => {
    if (!item.text.trim()) return

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: 'generating', error: undefined } : it))
    )

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text.trim(),
          voice: item.voiceId,
          format: item.format || 'mp3',
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Falha ao sintetizar áudio')
      }

      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'success',
                audioUrl,
                blob,
                charCount: item.text.trim().length,
              }
            : it
        )
      )
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'error',
                error: err.message || 'Erro de processamento',
              }
            : it
        )
      )
      throw err
    }
  }

  // Gerar Todos em Cascata
  const handleGenerateCascade = async () => {
    const pending = items.filter((i) => i.text.trim().length > 0)
    if (pending.length === 0) {
      toast.error('Preencha o texto dos blocos antes de iniciar a cascata.')
      return
    }

    if (totalChars > charsRemaining) {
      toast.error(`Saldo insuficiente: Você precisa de ${totalChars.toLocaleString('pt-BR')} créditos.`)
      return
    }

    setIsProcessing(true)
    cancelRef.current = false
    setProgressCount(0)

    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < items.length; i++) {
      if (cancelRef.current) {
        toast.info('Geração em cascata interrompida pelo usuário.')
        break
      }

      const currentItem = items[i]
      if (!currentItem.text.trim()) continue

      setProgressCount(i + 1)

      try {
        await generateSingleItem(currentItem, i)
        successCount++
      } catch (err) {
        failureCount++
      }
    }

    await refreshCredits()
    setIsProcessing(false)

    if (successCount > 0) {
      toast.success(`${successCount} áudio(s) gerado(s) com sucesso na cascata!`)
    }
    if (failureCount > 0) {
      toast.error(`${failureCount} bloco(s) falharam ao gerar.`)
    }
  }

  // Cancelar processamento
  const handleCancelCascade = () => {
    cancelRef.current = true
    setIsProcessing(false)
  }

  // Mesclar / Emendar Todos os Áudios em um Único Arquivo
  const handleMergeAllAudios = async () => {
    const readyItems = items.filter((i) => i.status === 'success' && (i.blob || i.audioUrl))
    if (readyItems.length === 0) {
      toast.error('Você precisa gerar os blocos antes de mesclar.')
      return
    }

    setIsMerging(true)
    toast.info(`Mesclando ${readyItems.length} blocos com respiro de ${pauseDuration}s...`)

    try {
      // Obter os Blobs de cada item
      const blobs: Blob[] = []
      for (const item of readyItems) {
        if (item.blob) {
          blobs.push(item.blob)
        } else if (item.audioUrl) {
          const res = await fetch(item.audioUrl)
          const b = await res.blob()
          blobs.push(b)
        }
      }

      // Executar a costura via Web Audio API com a pausa respiratória
      const result = await mergeAudioBlobs(blobs, pauseDuration)
      const mergedId = `merged-${Date.now()}`

      setMergedAudio({
        url: result.url,
        duration: result.duration,
        blob: result.blob,
        id: mergedId,
      })

      // Toca automaticamente o áudio mesclado no player
      loadAndPlay({
        id: mergedId,
        title: `Áudio Completo Mesclado (${readyItems.length} blocos)`,
        voiceName: 'Vozes Combinadas',
        url: result.url,
        format: 'wav',
        chars: totalChars,
        createdAt: Date.now(),
        engine: `GereLab Concatenador (${pauseDuration}s pausa)`,
      })

      toast.success(`Áudio único gerado com sucesso! Duração total: ${Math.round(result.duration)}s`)
    } catch (err: any) {
      console.error('Erro ao mesclar áudios:', err)
      toast.error('Falha ao mesclar áudios: ' + (err.message || 'Erro de áudio'))
    } finally {
      setIsMerging(false)
    }
  }

  // Baixar Todos em Arquivo ZIP
  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((i) => i.status === 'success' && (i.audioUrl || i.blob))
    if (readyItems.length === 0) {
      toast.error('Nenhum áudio concluído para baixar.')
      return
    }

    setIsZipping(true)
    toast.info('Empacotando áudios no arquivo ZIP...')

    try {
      const zip = new JSZip()
      const folder = zip.folder('gerelab_cascata_audios') || zip

      for (let idx = 0; idx < readyItems.length; idx++) {
        const it = readyItems[idx]
        let blob = it.blob
        if (!blob && it.audioUrl) {
          const response = await fetch(it.audioUrl)
          blob = await response.blob()
        }
        if (!blob) continue

        const voiceName = voices?.find((v) => v.id.toLowerCase() === it.voiceId.toLowerCase())?.name || it.voiceId
        const cleanSnippet = it.text
          .slice(0, 25)
          .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ\s_-]/g, '')
          .trim()
          .replace(/\s+/g, '_')

        const filename = `${String(idx + 1).padStart(2, '0')}_${voiceName}_${cleanSnippet || 'audio'}.${it.format || 'mp3'}`
        folder.file(filename, blob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(zipBlob)

      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `gerelab_cascata_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast.success('Download do ZIP concluído com sucesso!')
    } catch (err: any) {
      console.error('Erro ao gerar zip:', err)
      toast.error('Falha ao empacotar arquivo ZIP.')
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* ── Barra de Controle Superior da Cascata ── */}
      <div className="rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
              <Layers className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  Geração em Cascata (Multi-Prompts)
                </h2>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/40 bg-primary/10 text-primary">
                  LOTE PRO
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crie dezenas de falas em sequência, emende em 1 só áudio contínuo ou baixe tudo em ZIP.
              </p>
            </div>
          </div>

          {/* Saldo e Métricas */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-muted/50 border border-border/70 rounded-2xl px-4 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Blocos</span>
                <span className="text-sm font-bold font-mono text-foreground">{items.length} prompts</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Caracteres</span>
                <span className="text-sm font-bold font-mono text-foreground">{totalChars.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Saldo Restante</span>
                <span className={`text-sm font-bold font-mono ${!hasCredits ? 'text-destructive' : 'text-emerald-500'}`}>
                  {charsRemaining.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ajuste de Pausa Respiratória (Silêncio entre blocos) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 border border-border/60 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Sliders className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Pausa Respiratória entre Frases:</span>
                <span className="font-mono text-primary font-extrabold">{pauseDuration}s</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tempo de respiro/silêncio natural adicionado entre cada bloco ao emendar em 1 áudio único.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-56 flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground">0.1s</span>
            <Slider
              value={[pauseDuration]}
              min={0.1}
              max={2.5}
              step={0.1}
              onValueChange={([v]) => setPauseDuration(Number(v.toFixed(1)))}
              className="flex-1 py-1"
            />
            <span className="text-[10px] font-bold text-muted-foreground">2.5s</span>
          </div>
        </div>

        {/* Barra de Ferramentas: Voz Padrão, Importador e Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-2xl border border-border/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Voz Padrão:</span>
            <VoiceSelector
              value={globalVoiceId}
              onChange={(newV) => applyGlobalVoiceToAll(newV)}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(!showImportModal)}
              className="h-9 px-3 rounded-xl border-2 border-border/80 text-xs font-semibold gap-1.5 hover:bg-muted cursor-pointer"
            >
              <Split className="size-3.5 text-primary" />
              <span>Importar Roteiro Longo</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="h-9 px-3 rounded-xl border-2 border-border/80 text-xs font-semibold gap-1.5 hover:bg-muted cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Adicionar Bloco</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão de Emendar / Mesclar em 1 Áudio Único */}
            {completedCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMergeAllAudios}
                disabled={isMerging}
                className="h-9 px-4 rounded-xl border-2 border-primary/40 bg-primary/10 text-primary font-bold text-xs gap-1.5 hover:bg-primary/20 shadow-sm cursor-pointer"
              >
                {isMerging ? <Spinner className="size-3.5" /> : <Combine className="size-3.5" />}
                <span>Emendar em 1 Áudio Único ({completedCount})</span>
              </Button>
            )}

            {/* Botão de Baixar Todos em ZIP */}
            {completedCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="h-9 px-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs gap-1.5 hover:bg-emerald-500/20 shadow-sm cursor-pointer"
              >
                {isZipping ? <Spinner className="size-3.5" /> : <Archive className="size-3.5" />}
                <span>Baixar ZIP ({completedCount})</span>
              </Button>
            )}

            {isProcessing ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleCancelCascade}
                className="h-9 px-4 rounded-xl font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                <Spinner className="size-3.5" />
                <span>Interromper Cascata</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleGenerateCascade}
                disabled={!hasCredits || items.length === 0}
                className="h-9 px-5 rounded-xl font-bold text-xs bg-foreground text-background hover:opacity-90 transition-all gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Gerar Todos em Cascata ({items.length})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Modal de Importação Rápida de Texto */}
        {showImportModal && (
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex flex-col gap-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Importar e Dividir Roteiro em Blocos</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImportModal(false)}
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Fechar
              </Button>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole aqui seu texto completo. Cada parágrafo ou linha se transformará em um bloco independente pronto para ser gerado..."
              rows={4}
              className="w-full bg-card border-2 border-border/80 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleImportText('lines')}
                className="h-8 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Dividir por Linhas (\n)
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleImportText('paragraphs')}
                className="h-8 rounded-xl text-xs font-bold bg-primary text-primary-foreground cursor-pointer"
              >
                Dividir por Parágrafos (Blocos Maiores)
              </Button>
            </div>
          </div>
        )}

        {/* Barra de Progresso Global da Cascata */}
        {isProcessing && (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 flex flex-col gap-2 animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-primary">
              <div className="flex items-center gap-2">
                <Spinner className="size-4" />
                <span>Processando cascata: Bloco {progressCount} de {items.length}</span>
              </div>
              <span>{Math.round((progressCount / items.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-primary/20 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progressCount / items.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Card de Áudio Mesclado / Emendado (Se Existir) ── */}
      {mergedAudio && (
        <div className="rounded-3xl border-2 border-primary/60 bg-primary/5 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-4 min-w-0">
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
              <Music2 className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Áudio Único Mesclado com Sucesso!
                </h3>
                <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary font-bold text-[10px]">
                  {Math.round(mergedAudio.duration)}s DURAÇÃO
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedCount} blocos emendados com pausa de {pauseDuration}s de respiro entre cada frase.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (current?.id === mergedAudio.id && isPlaying) {
                  togglePlay()
                } else {
                  loadAndPlay({
                    id: mergedAudio.id,
                    title: `Áudio Completo Mesclado (${completedCount} blocos)`,
                    voiceName: 'Vozes Combinadas',
                    url: mergedAudio.url,
                    format: 'wav',
                    chars: totalChars,
                    createdAt: Date.now(),
                    engine: `GereLab Concatenador (${pauseDuration}s pausa)`,
                  })
                }
              }}
              className="h-10 px-5 rounded-xl border-2 border-border/80 bg-card hover:bg-muted gap-2 text-xs font-bold text-foreground cursor-pointer shadow-sm"
            >
              {isPlaying && current?.id === mergedAudio.id ? (
                <>
                  <Pause className="size-4 fill-current" />
                  <span>Pausar Áudio Único</span>
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" />
                  <span>Ouvir Áudio Completo</span>
                </>
              )}
            </Button>

            <a
              href={mergedAudio.url}
              download={`gerelab_audio_completo_${Date.now()}.wav`}
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-all gap-1.5 shadow-md cursor-pointer"
            >
              <Download className="size-4" />
              <span>Baixar Áudio Único (.wav)</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Lista de Blocos de Prompt em Cascata ── */}
      <div className="flex flex-col gap-4">
        {items.map((item, index) => {
          const itemVoice = voices?.find((v) => v.id.toLowerCase() === item.voiceId.toLowerCase())
          const isThisPlaying = current?.id === item.id && isPlaying

          return (
            <div
              key={item.id}
              className={`rounded-2xl border-2 p-4 sm:p-5 transition-all shadow-sm flex flex-col gap-3.5 bg-card ${
                item.status === 'generating'
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : item.status === 'success'
                  ? 'border-emerald-500/40 bg-card'
                  : item.status === 'error'
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'border-border/80 hover:border-foreground/30'
              }`}
            >
              {/* Topo do Bloco: Número, Voz e Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-muted border border-border/80 font-mono text-xs font-bold text-foreground">
                    #{String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Seletor de voz individual */}
                  <VoiceSelector
                    value={item.voiceId}
                    onChange={(vId) => updateVoice(item.id, vId)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Indicator */}
                  {item.status === 'idle' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60">
                      <Clock className="size-3" />
                      Pendente
                    </span>
                  )}
                  {item.status === 'generating' && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/30 animate-pulse">
                      <Spinner className="size-3" />
                      Sintetizando...
                    </span>
                  )}
                  {item.status === 'success' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="size-3" />
                      Concluído
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/30">
                      <AlertCircle className="size-3" />
                      Erro
                    </span>
                  )}

                  {/* Botão Duplicar */}
                  <button
                    type="button"
                    onClick={() => duplicateItem(index)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Duplicar este bloco"
                  >
                    <Copy className="size-3.5" />
                  </button>

                  {/* Botão Deletar */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Remover este bloco"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Textarea do Bloco */}
              <textarea
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                placeholder={`Texto ou diálogo para o bloco #${index + 1}...`}
                rows={2}
                className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 resize-y focus:outline-none leading-relaxed font-normal min-h-[60px]"
              />

              {/* Rodapé do Bloco: Contadores & Player Individual */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="font-mono">{item.text.trim().length} caracteres</span>
                  {item.error && (
                    <span className="text-destructive font-medium text-xs">{item.error}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Se tiver gerado com sucesso, exibe Player e Download individual */}
                  {item.status === 'success' && (item.audioUrl || item.blob) && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (isThisPlaying) {
                            togglePlay()
                          } else {
                            const url = item.audioUrl || (item.blob ? URL.createObjectURL(item.blob) : '')
                            loadAndPlay({
                              id: item.id,
                              title: `Bloco #${index + 1}: ${item.text.slice(0, 30)}...`,
                              voiceName: itemVoice?.name || 'Voz Neural',
                              url,
                              format: item.format,
                              chars: item.text.length,
                              createdAt: Date.now(),
                              engine: 'GereLab Cascata',
                            })
                          }
                        }}
                        className="h-8 px-3 rounded-lg border-2 border-border/80 bg-card hover:bg-muted font-bold text-xs gap-1.5 cursor-pointer"
                      >
                        {isThisPlaying ? (
                          <>
                            <Pause className="size-3.5 fill-current" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="size-3.5 fill-current" />
                            <span>Ouvir Bloco</span>
                          </>
                        )}
                      </Button>

                      <a
                        href={item.audioUrl || (item.blob ? URL.createObjectURL(item.blob) : '#')}
                        download={`bloco_${index + 1}_${itemVoice?.name || 'voz'}.${item.format}`}
                        className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-all gap-1 shadow-sm cursor-pointer"
                        title="Baixar áudio deste bloco"
                      >
                        <Download className="size-3" />
                        <span>Baixar</span>
                      </a>
                    </>
                  )}

                  {/* Gerar este bloco individualmente */}
                  {item.status !== 'generating' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateSingleItem(item, index)}
                      disabled={!item.text.trim() || isProcessing}
                      className="h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    >
                      <Sparkles className="size-3 mr-1" />
                      {item.status === 'success' ? 'Regerar' : 'Gerar este'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Botão Adicionar Bloco ao Final */}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-foreground/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Adicionar Novo Bloco de Fala (#{items.length + 1})</span>
        </button>
      </div>
    </div>
  )
}
