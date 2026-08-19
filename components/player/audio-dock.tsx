'use client'

import * as React from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Gauge,
  AudioLines,
} from 'lucide-react'
import { usePlayer } from '@/components/player/player-provider'
import { Waveform } from '@/components/player/waveform'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const RATES = ['0.75', '1', '1.25', '1.5']

export function AudioDock() {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
  } = usePlayer()

  const [format, setFormat] = React.useState('mp3')

  if (!current) return null

  const progress = duration > 0 ? currentTime / duration : 0

  const download = () => {
    const a = document.createElement('a')
    a.href = current.url
    const safe = current.title.slice(0, 32).replace(/[^\w\-]+/g, '_') || 'auravoice'
    a.download = `${safe}.${format === 'wav' ? 'wav' : 'mp3'}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Track meta */}
        <div className="flex min-w-0 items-center gap-3 sm:w-56">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-brand">
            <AudioLines className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {current.title || 'Áudio gerado'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {current.voiceName} · {current.engine}
            </p>
          </div>
        </div>

        {/* Play + waveform + time */}
        <div className="flex flex-1 items-center gap-3">
          <Button
            size="icon"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            className="shrink-0 rounded-full"
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          <span className="hidden w-9 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums sm:block">
            {fmt(currentTime)}
          </span>

          <div className="h-9 flex-1">
            <Waveform
              seed={current.id}
              progress={progress}
              playing={isPlaying}
              onScrub={(r) => seek(r * duration)}
            />
          </div>

          <span className="hidden w-9 shrink-0 font-mono text-xs text-muted-foreground tabular-nums sm:block">
            {fmt(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              aria-label="Volume"
            >
              {volume > 0 ? (
                <Volume2 className="size-4" />
              ) : (
                <VolumeX className="size-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(v) =>
                setVolume(Array.isArray(v) ? v[0] : (v as number))
              }
              className="w-20"
              aria-label="Volume"
            />
          </div>

          <Select value={playbackRate.toString()} onValueChange={(v) => setPlaybackRate(Number(v))}>
            <SelectTrigger size="sm" className="w-[74px]">
              <Gauge className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RATES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger size="sm" className="w-[76px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp3">MP3</SelectItem>
              <SelectItem value="wav">WAV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={download}
          className={cn('shrink-0')}
        >
          <Download data-icon="inline-start" />
          <span className="hidden sm:inline">Baixar</span>
        </Button>
      </div>
    </div>
  )
}
