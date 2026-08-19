'use client'

import Link from 'next/link'
import { Play, Pause, Download, Trash2, History as HistoryIcon, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { usePlayer } from '@/components/player/player-provider'

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return new Date(ts).toLocaleDateString('pt-BR')
}

export function HistoryView() {
  const {
    history,
    current,
    isPlaying,
    loadAndPlay,
    togglePlay,
    removeFromHistory,
    clearHistory,
  } = usePlayer()

  const download = (url: string, title: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.slice(0, 32).replace(/[^\w\-]+/g, '_') || 'auravoice'}.mp3`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Áudios gerados nesta sessão.
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 data-icon="inline-start" />
            Limpar tudo
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Empty className="mt-8 rounded-xl border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhum áudio gerado ainda</EmptyTitle>
            <EmptyDescription>
              Gere seu primeiro áudio no Studio para vê-lo aqui.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" render={<Link href="/" />}>
              <Plus data-icon="inline-start" />
              Ir para o Studio
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {history.map((track) => {
            const isThis = current?.id === track.id
            return (
              <Card key={track.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-full"
                    aria-label={isThis && isPlaying ? 'Pausar' : 'Reproduzir'}
                    onClick={() =>
                      isThis ? togglePlay() : loadAndPlay(track)
                    }
                  >
                    {isThis && isPlaying ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4" />
                    )}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {track.title || 'Áudio gerado'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{track.voiceName}</span>
                      <span>·</span>
                      <span>{track.chars.toLocaleString('pt-BR')} chars</span>
                      <span>·</span>
                      <span>{timeAgo(track.createdAt)}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="hidden text-[10px] sm:flex">
                    {track.engine}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Baixar"
                    onClick={() => download(track.url, track.title)}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    aria-label="Remover"
                    onClick={() => removeFromHistory(track.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
