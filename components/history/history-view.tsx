'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Play,
  Pause,
  Download,
  Trash2,
  History as HistoryIcon,
  Plus,
  Copy,
  Check,
  Volume2,
  Calendar,
  Sparkles,
  Archive,
  CheckSquare,
  Square,
  CheckCircle2,
  Layers,
  Combine,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { usePlayer } from '@/components/player/player-provider'
import { getHistory, type GenerationRecord } from '@/app/actions/history'
import { mergeAudioBlobs } from '@/lib/audio-stitcher'
import { toast } from 'sonner'
import JSZip from 'jszip'

function timeAgo(dateString: string) {
  const ts = new Date(dateString).getTime()
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'agora há pouco'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryView() {
  const {
    current,
    isPlaying,
    loadAndPlay,
    togglePlay,
  } = usePlayer()

  const [records, setRecords] = React.useState<GenerationRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [copiedId, setCopiedId] = React.useState<number | null>(null)
  const [generatingId, setGeneratingId] = React.useState<number | null>(null)

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [isZipping, setIsZipping] = React.useState(false)
  const [isMerging, setIsMerging] = React.useState(false)
  const [actionProgress, setActionProgress] = React.useState<string>('')

  const fetchRecords = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getHistory(50)
      setRecords(data)
    } catch (err) {
      console.log('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const copyText = (id: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Alternar seleção de um item
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Selecionar ou desmarcar todos
  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)))
    }
  }

  const handlePlayOrReplay = async (rec: GenerationRecord) => {
    const isThis = current?.id === String(rec.id)
    if (isThis) {
      togglePlay()
      return
    }

    setGeneratingId(rec.id)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rec.text,
          voice: rec.voiceId,
          format: rec.format || 'mp3',
        }),
      })

      if (!res.ok) throw new Error('Falha ao reproduzir áudio')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      loadAndPlay({
        id: String(rec.id),
        title: rec.text.slice(0, 48) + (rec.text.length > 48 ? '…' : ''),
        voiceName: rec.voiceName,
        url,
        format: rec.format || 'mp3',
        chars: rec.charCount,
        createdAt: new Date(rec.createdAt).getTime(),
        engine: 'GereLab Neural HD',
      })
    } catch (e) {
      console.log('Erro ao gerar play:', e)
    } finally {
      setGeneratingId(null)
    }
  }

  const downloadSingle = async (rec: GenerationRecord) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rec.text,
          voice: rec.voiceId,
          format: rec.format || 'mp3',
        }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gerelab_${rec.voiceName}_${rec.id}.${rec.format || 'mp3'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success('Download concluído!')
    } catch (e) {
      console.log('Erro ao baixar:', e)
      toast.error('Erro ao baixar áudio.')
    }
  }

  // Mesclar selecionados em um único áudio
  const handleMergeSelectedAudios = async (targetRecords: GenerationRecord[]) => {
    if (targetRecords.length < 2) {
      toast.error('Selecione pelo menos 2 áudios para emendar.')
      return
    }

    setIsMerging(true)
    setActionProgress(`Obtendo ${targetRecords.length} áudios para unificação...`)
    toast.info(`Processando emenda de ${targetRecords.length} áudios...`)

    try {
      const blobs: Blob[] = []
      for (let i = 0; i < targetRecords.length; i++) {
        const rec = targetRecords[i]
        setActionProgress(`Baixando parte ${i + 1} de ${targetRecords.length}...`)
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: rec.text,
            voice: rec.voiceId,
            format: rec.format || 'mp3',
          }),
        })
        if (res.ok) {
          const blob = await res.blob()
          blobs.push(blob)
        }
      }

      setActionProgress('Costurando áudios com pausa respiratória natural...')
      const result = await mergeAudioBlobs(blobs, 0.6)
      const mergedId = `merged-hist-${Date.now()}`

      loadAndPlay({
        id: mergedId,
        title: `Histórico Unificado (${targetRecords.length} falas)`,
        voiceName: 'Vozes Mescladas',
        url: result.url,
        format: 'wav',
        chars: targetRecords.reduce((acc, r) => acc + r.charCount, 0),
        createdAt: Date.now(),
        engine: 'GereLab Concatenador',
      })

      const a = document.createElement('a')
      a.href = result.url
      a.download = `gerelab_historico_mesclado_${Date.now()}.wav`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast.success(`Áudios emendados com sucesso! Duração total: ${Math.round(result.duration)}s`)
    } catch (err: any) {
      console.error('Erro ao emendar áudios:', err)
      toast.error('Falha ao mesclar áudios do histórico.')
    } finally {
      setIsMerging(false)
      setActionProgress('')
    }
  }

  // Baixar selecionados ou todos em pacote ZIP
  const handleBatchDownloadZip = async (targetRecords: GenerationRecord[]) => {
    if (targetRecords.length === 0) {
      toast.error('Nenhum áudio selecionado para download.')
      return
    }

    setIsZipping(true)
    setActionProgress(`Preparando ${targetRecords.length} áudio(s)...`)
    toast.info(`Iniciando download de ${targetRecords.length} áudios em ZIP...`)

    try {
      const zip = new JSZip()
      const folder = zip.folder('gerelab_historico_audios') || zip

      for (let i = 0; i < targetRecords.length; i++) {
        const rec = targetRecords[i]
        setActionProgress(`Baixando áudio ${i + 1} de ${targetRecords.length}...`)

        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: rec.text,
              voice: rec.voiceId,
              format: rec.format || 'mp3',
            }),
          })

          if (res.ok) {
            const blob = await res.blob()
            const cleanText = rec.text
              .slice(0, 25)
              .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ\s_-]/g, '')
              .trim()
              .replace(/\s+/g, '_')
            const filename = `${String(i + 1).padStart(2, '0')}_${rec.voiceName}_${cleanText || 'audio'}.${rec.format || 'mp3'}`
            folder.file(filename, blob)
          }
        } catch (err) {
          console.error('Erro no item do zip:', err)
        }
      }

      setActionProgress('Compactando arquivo ZIP final...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(zipBlob)

      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `gerelab_historico_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast.success(`Pacote ZIP com ${targetRecords.length} áudios baixado com sucesso!`)
    } catch (err) {
      console.error(err)
      toast.error('Falha ao gerar arquivo ZIP.')
    } finally {
      setIsZipping(false)
      setActionProgress('')
    }
  }

  const selectedRecords = records.filter((r) => selectedIds.has(r.id))
  const isAllSelected = records.length > 0 && selectedIds.size === records.length

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Histórico de Gerações
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Todos os áudios e falas neurais gerados na sua conta com download individual, emenda em 1 áudio ou pacote ZIP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchDownloadZip(records)}
              disabled={isZipping || isMerging}
              className="h-9 px-3.5 rounded-xl border-2 border-border/80 text-xs font-bold gap-1.5 hover:bg-muted cursor-pointer"
            >
              {isZipping ? <Spinner className="size-3.5" /> : <Archive className="size-3.5 text-primary" />}
              <span>Baixar Todos ({records.length}) em ZIP</span>
            </Button>
          )}

          <Button asChild size="sm" className="h-9 px-4 rounded-xl font-bold text-xs bg-foreground text-background hover:opacity-90 cursor-pointer">
            <Link href="/">
              <Plus data-icon="inline-start" className="size-3.5" />
              Nova Geração
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Barra de Ações em Lote (Quando há itens selecionados) ── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 rounded-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-md p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-foreground">
              {selectedIds.size} áudio(s) selecionado(s)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Desmarcar
            </Button>

            {/* Emendar selecionados em 1 áudio */}
            {selectedIds.size >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMergeSelectedAudios(selectedRecords)}
                disabled={isMerging || isZipping}
                className="h-8 px-3.5 rounded-xl border-2 border-primary/40 bg-primary/10 text-primary font-bold text-xs gap-1.5 hover:bg-primary/20 shadow-sm cursor-pointer"
              >
                {isMerging ? <Spinner className="size-3.5" /> : <Combine className="size-3.5" />}
                <span>Emendar em 1 Áudio</span>
              </Button>
            )}

            {/* Baixar Selecionados em ZIP */}
            <Button
              size="sm"
              onClick={() => handleBatchDownloadZip(selectedRecords)}
              disabled={isZipping || isMerging}
              className="h-8 px-4 rounded-xl font-bold text-xs bg-foreground text-background hover:opacity-90 gap-1.5 shadow-sm cursor-pointer"
            >
              {isZipping ? <Spinner className="size-3.5" /> : <Archive className="size-3.5" />}
              <span>Baixar Selecionados ({selectedIds.size}) em ZIP</span>
            </Button>
          </div>
        </div>
      )}

      {/* Barra de Progresso Geral */}
      {(isZipping || isMerging) && (
        <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-3.5 flex items-center justify-between text-xs font-bold text-primary animate-pulse">
          <div className="flex items-center gap-2">
            <Spinner className="size-4" />
            <span>{actionProgress || 'Processando ação em lote...'}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-normal">Aguarde a finalização</span>
        </div>
      )}

      {/* ── Lista de Registros do Histórico ── */}
      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center">
          <Spinner className="size-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Carregando suas gerações...</p>
        </div>
      ) : records.length === 0 ? (
        <Empty className="mt-8 rounded-2xl border-2 border-dashed border-border p-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon className="size-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Nenhum áudio gerado ainda</EmptyTitle>
            <EmptyDescription>
              Suas gerações de voz serão salvas permanentemente aqui com data, texto e opções de download individual, emenda e ZIP.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" asChild className="rounded-xl font-bold">
              <Link href="/">
                <Plus data-icon="inline-start" />
                Ir para o Estúdio
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Header de Seleção Mestre */}
          <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 font-semibold hover:text-foreground transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="size-4 text-primary" />
              ) : (
                <Square className="size-4 text-muted-foreground" />
              )}
              <span>{isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
            </button>

            <span>Total: {records.length} áudio(s)</span>
          </div>

          {records.map((rec) => {
            const isThis = current?.id === String(rec.id)
            const isGen = generatingId === rec.id
            const isSelected = selectedIds.has(rec.id)

            return (
              <Card
                key={rec.id}
                className={`border-2 transition-all shadow-sm rounded-2xl ${
                  isSelected
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border/80 bg-card hover:border-foreground/20'
                }`}
              >
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                  {/* Checkbox, Play & Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Checkbox de seleção */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(rec.id)}
                      className="mt-2.5 sm:mt-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                      title={isSelected ? 'Desmarcar' : 'Selecionar'}
                    >
                      {isSelected ? (
                        <CheckSquare className="size-4 text-primary" />
                      ) : (
                        <Square className="size-4 text-muted-foreground/60" />
                      )}
                    </button>

                    {/* Botão de Play */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 size-10 rounded-xl bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      aria-label="Ouvir"
                      onClick={() => handlePlayOrReplay(rec)}
                      disabled={isGen}
                    >
                      {isGen ? (
                        <Spinner className="size-4" />
                      ) : isThis && isPlaying ? (
                        <Pause className="size-4 fill-current" />
                      ) : (
                        <Play className="size-4 fill-current" />
                      )}
                    </Button>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                        {rec.text}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[11px] font-bold bg-muted text-foreground/80 rounded-lg">
                          {rec.voiceName}
                        </Badge>
                        <span>·</span>
                        <span className="font-mono">{rec.charCount.toLocaleString('pt-BR')} caracteres</span>
                        <span>·</span>
                        <span className="uppercase text-[10px] font-semibold tracking-wider text-muted-foreground">
                          {rec.format}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(rec.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => copyText(rec.id, rec.text)}
                      title="Copiar texto"
                    >
                      {copiedId === rec.id ? (
                        <Check className="size-3.5 text-emerald-400 mr-1" />
                      ) : (
                        <Copy className="size-3.5 mr-1" />
                      )}
                      {copiedId === rec.id ? 'Copiado' : 'Copiar'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-xl border-2 border-border/80 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer gap-1"
                      onClick={() => downloadSingle(rec)}
                      title="Baixar áudio"
                    >
                      <Download className="size-3.5" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
