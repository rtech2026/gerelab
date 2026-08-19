'use client'

import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/components/player/player-provider'
import type { Voice } from '@/lib/voices'

export function VoicePreviewButton({
  voice,
  label = 'Testar',
}: {
  voice: Voice
  label?: string
}) {
  const { loadAndPlay, current, isPlaying, togglePlay } = usePlayer()
  const trackId = `preview-${voice.id}`
  const isThis = current?.id === trackId

  const play = () => {
    if (isThis) {
      togglePlay()
      return
    }
    // O preview da LMNT é gratuito e não consome créditos da conta.
    loadAndPlay({
      id: trackId,
      title: `Preview · ${voice.name}`,
      voiceName: voice.name,
      url: voice.previewUrl,
      createdAt: Date.now(),
      engine: 'LMNT Preview',
      chars: 0,
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={play} disabled={!voice.previewUrl}>
      {isThis && isPlaying ? (
        <Square data-icon="inline-start" />
      ) : (
        <Play data-icon="inline-start" />
      )}
      {label}
    </Button>
  )
}
