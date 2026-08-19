'use client'

import * as React from 'react'

function makeBars(seed: string, count: number) {
  // Deterministic pseudo-random bar heights from a string seed.
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    const r = ((h >>> 0) % 1000) / 1000
    // shape envelope so the middle is a bit taller
    const env = 0.55 + 0.45 * Math.sin((i / count) * Math.PI)
    bars.push(0.15 + r * 0.85 * env)
  }
  return bars
}

type WaveformProps = {
  seed: string
  progress: number // 0..1
  playing: boolean
  onScrub?: (ratio: number) => void
  bars?: number
  className?: string
}

export function Waveform({
  seed,
  progress,
  playing,
  onScrub,
  bars = 96,
  className,
}: WaveformProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const rafRef = React.useRef<number>(0)
  const barData = React.useMemo(() => makeBars(seed, bars), [seed, bars])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const styles = getComputedStyle(document.documentElement)
    const played = `oklch(0.72 0.13 235)` // brand
    const base = styles.getPropertyValue('--muted-foreground').trim()

    let t = 0
    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const gap = 2
      const barW = (w - gap * (barData.length - 1)) / barData.length
      const mid = h / 2

      for (let i = 0; i < barData.length; i++) {
        const ratio = i / barData.length
        const isPlayed = ratio <= progress
        let amp = barData[i]
        if (playing) {
          // subtle live motion near the playhead
          const dist = Math.abs(ratio - progress)
          const pulse = Math.max(0, 1 - dist * 12) * 0.25
          amp = Math.min(1, amp + pulse * Math.sin(t * 0.15 + i))
        }
        const barH = Math.max(2, amp * (h - 6))
        const x = i * (barW + gap)
        ctx.fillStyle = isPlayed ? played : `oklch(0.55 0 0 / 0.45)`
        if (isPlayed) ctx.fillStyle = played
        else ctx.fillStyle = base ? `${base}` : 'rgba(150,150,150,0.4)'
        const radius = Math.min(barW / 2, 2)
        roundRect(ctx, x, mid - barH / 2, barW, barH, radius)
        ctx.fill()
      }
      t += 1
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [barData, progress, playing])

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onScrub) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    onScrub(ratio)
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointer}
      className={className}
      style={{ width: '100%', height: '100%', cursor: onScrub ? 'pointer' : 'default' }}
      aria-hidden="true"
    />
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
