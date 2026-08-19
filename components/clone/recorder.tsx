'use client'

import * as React from 'react'
import { Mic, Square, RotateCcw, Play, Pause } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function Recorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob | null, seconds: number) => void
}) {
  const [recording, setRecording] = React.useState(false)
  const [seconds, setSeconds] = React.useState(0)
  const [level, setLevel] = React.useState(0)
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [playing, setPlaying] = React.useState(false)

  const mediaRef = React.useRef<MediaRecorder | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const rafRef = React.useRef<number>(0)
  const audioCtxRef = React.useRef<AudioContext | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const previewRef = React.useRef<HTMLAudioElement | null>(null)

  const cleanupMeter = () => {
    cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
  }

  React.useEffect(() => () => cleanupMeter(), [])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      setBlobUrl(null)
      setSeconds(0)

      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        onRecorded(blob, secondsRef.current)
        cleanupMeter()
        setLevel(0)
      }
      mr.start()

      // VU meter
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        setLevel(Math.min(1, sum / data.length / 128))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      setRecording(true)
    } catch {
      toast.error('Não foi possível acessar o microfone')
    }
  }

  const secondsRef = React.useRef(0)
  React.useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  const stop = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  const reset = () => {
    setBlobUrl(null)
    setSeconds(0)
    onRecorded(null, 0)
  }

  const togglePreview = () => {
    if (!previewRef.current) return
    if (previewRef.current.paused) {
      void previewRef.current.play()
      setPlaying(true)
    } else {
      previewRef.current.pause()
      setPlaying(false)
    }
  }

  const bars = 28

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-5">
      <div className="flex h-16 items-center justify-center gap-1">
        {Array.from({ length: bars }).map((_, i) => {
          const center = Math.abs(i - bars / 2) / (bars / 2)
          const h = recording
            ? Math.max(0.08, level * (1 - center * 0.7) * (0.6 + Math.random() * 0.6))
            : 0.08
          return (
            <span
              key={i}
              className={cn(
                'w-1 rounded-full transition-all duration-75',
                recording ? 'bg-brand' : 'bg-border',
              )}
              style={{ height: `${h * 100}%` }}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="font-mono text-sm tabular-nums text-foreground">
          {fmt(seconds)}
        </span>
        {!recording && !blobUrl && (
          <Button onClick={start}>
            <Mic data-icon="inline-start" />
            Gravar
          </Button>
        )}
        {recording && (
          <Button variant="destructive" onClick={stop}>
            <Square data-icon="inline-start" />
            Parar
          </Button>
        )}
        {blobUrl && !recording && (
          <>
            <Button variant="outline" onClick={togglePreview}>
              {playing ? (
                <Pause data-icon="inline-start" />
              ) : (
                <Play data-icon="inline-start" />
              )}
              Ouvir
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw data-icon="inline-start" />
              Regravar
            </Button>
          </>
        )}
      </div>

      {seconds > 0 && seconds < 10 && recording && (
        <p className="text-center text-xs text-muted-foreground">
          Grave pelo menos 10 segundos de áudio limpo.
        </p>
      )}

      {blobUrl && (
        <audio
          ref={previewRef}
          src={blobUrl}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  )
}
