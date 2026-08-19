'use client'

import * as React from 'react'
import { Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/studio/spinner'
import { usePlayer } from '@/components/player/player-provider'
import { generateSpeech, engineLabel } from '@/lib/tts-client'
import type { Voice } from '@/lib/voices'

const SAMPLES: Record<string, string> = {
  'PT-BR': 'Olá, esta é uma amostra da minha voz no AuraVoice Studio.',
  'EN-US': 'Hi, this is a quick sample of my voice on AuraVoice Studio.',
  'ES-ES': 'Hola, esta es una muestra de mi voz en AuraVoice Studio.',
}

export function VoicePreviewButton({
  voice,
  label = 'Testar',
}: {
  voice: Voice
  label?: string
}) {
  const { loadAndPlay, current, isPlaying, togglePlay } = usePlayer()
  const [loading, setLoading] = React.useState(false)
  const trackId = `preview-${voice.id}`
  const isThis = current?.id === trackId

  const play = async () => {
    if (isThis) {
      togglePlay()
      return
    }
    setLoading(true)
    try {
      const sample = SAMPLES[voice.langCode] ?? SAMPLES['EN-US']
      const { url, engine } = await generateSpeech(sample, voice)
      loadAndPlay({
        id: trackId,
        title: `Preview · ${voice.name}`,
        voiceName: voice.name,
        url,
        createdAt: Date.now(),
        engine: engineLabel(engine),
        chars: sample.length,
      })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={play} disabled={loading}>
      {loading ? (
        <Spinner data-icon="inline-start" />
      ) : isThis && isPlaying ? (
        <Square data-icon="inline-start" />
      ) : (
        <Play data-icon="inline-start" />
      )}
      {label}
    </Button>
  )
}
