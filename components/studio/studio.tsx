'use client'

import * as React from 'react'
import {
  Info,
  Wand2,
  Timer,
  Eraser,
  AudioLines,
  Play,
  Gauge,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/studio/spinner'
import { VoiceSelector } from '@/components/studio/voice-selector'
import { useVoices } from '@/components/voices-provider'
import { usePlayer } from '@/components/player/player-provider'
import { useCredits } from '@/components/credits-provider'
import { getVoiceById } from '@/lib/voices'
import { generateSpeech, engineLabel } from '@/lib/tts-client'

const MAX = 5000
const SAMPLE =
  'Bem-vindo ao AuraVoice Studio. Transforme qualquer texto em uma voz neural realista em segundos, com controle total de ritmo, entonação e clareza de estúdio.'

export function Studio() {
  const { all } = useVoices()
  const { loadAndPlay } = usePlayer()
  const { balance, spend } = useCredits()

  const [text, setText] = React.useState(SAMPLE)
  const [voiceId, setVoiceId] = React.useState('ptbr-francisca')
  const [speed, setSpeed] = React.useState(1)
  const [pitch, setPitch] = React.useState(0)
  const [stability, setStability] = React.useState(true)
  const [loading, setLoading] = React.useState(false)

  const voice = getVoiceById(voiceId, all) ?? all[all.length - 1]
  const chars = text.length
  const overLimit = chars > MAX

  const insertPause = () => setText((t) => `${t.trimEnd()} <break time="500ms"/> `)
  const enhance = () => {
    setText((t) =>
      t
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/([.!?])(?=[A-Za-zÀ-ú])/g, '$1 ')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    )
    toast.success('Pontuação aprimorada')
  }

  const generate = async () => {
    if (!text.trim()) {
      toast.error('Escreva algum texto para gerar')
      return
    }
    if (overLimit) {
      toast.error(`Máximo de ${MAX.toLocaleString('pt-BR')} caracteres`)
      return
    }
    if (!voice) return
    setLoading(true)
    try {
      const { url, engine } = await generateSpeech(text, voice, { speed, pitch })
      loadAndPlay({
        id: `gen-${Date.now().toString(36)}`,
        title: text.slice(0, 60),
        voiceName: voice.name,
        url,
        createdAt: Date.now(),
        engine: engineLabel(engine),
        chars,
      })
      spend(chars)
      toast.success(`Áudio gerado · ${engineLabel(engine)}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1fr_300px]">
      {/* Text studio */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={enhance}>
            <Wand2 data-icon="inline-start" />
            Aprimorar pontuação
          </Button>
          <Button variant="outline" size="sm" onClick={insertPause}>
            <Timer data-icon="inline-start" />
            Inserir pausa [500ms]
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setText('')}
            className="text-muted-foreground"
          >
            <Eraser data-icon="inline-start" />
            Limpar
          </Button>
        </div>

        <Card className="overflow-hidden py-0">
          <CardContent className="relative p-0">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva ou cole seu texto aqui..."
              spellCheck={false}
              className="min-h-[340px] w-full resize-none bg-transparent p-5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between border-t border-border/80 px-5 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <AudioLines className="size-3.5" />
                Suporta SSML {'<break/>'} para pausas
              </span>
              <span
                className={
                  overLimit
                    ? 'font-mono text-destructive'
                    : 'font-mono text-muted-foreground'
                }
              >
                {chars.toLocaleString('pt-BR')} / {MAX.toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            onClick={generate}
            disabled={loading || overLimit}
            className="min-w-40"
          >
            {loading ? (
              <>
                <Spinner data-icon="inline-start" />
                Sintetizando
              </>
            ) : (
              <>
                <Play data-icon="inline-start" />
                Gerar áudio
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Custo estimado:{' '}
            <span className="font-mono text-foreground">
              {chars.toLocaleString('pt-BR')}
            </span>{' '}
            chars · saldo{' '}
            <span className="font-mono text-foreground">
              {balance.toLocaleString('pt-BR')}
            </span>
          </p>
        </div>
      </div>

      {/* Controls panel */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-5 p-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Voz</Label>
              <VoiceSelector value={voiceId} onChange={setVoiceId} />
              {voice && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {voice.description}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gauge className="size-3.5" />
                  Velocidade
                </Label>
                <span className="font-mono text-xs text-foreground">
                  {speed.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[speed]}
                min={0.5}
                max={2}
                step={0.05}
                onValueChange={(v) =>
                  setSpeed(Array.isArray(v) ? v[0] : (v as number))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Activity className="size-3.5" />
                  Tom (pitch)
                </Label>
                <span className="font-mono text-xs text-foreground">
                  {pitch > 0 ? `+${pitch}` : pitch} Hz
                </span>
              </div>
              <Slider
                value={[pitch]}
                min={-50}
                max={50}
                step={1}
                onValueChange={(v) =>
                  setPitch(Array.isArray(v) ? v[0] : (v as number))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="stability" className="text-sm">
                  Estabilidade
                </Label>
                <span className="text-xs text-muted-foreground">
                  Reduz variação entre gerações
                </span>
              </div>
              <Switch
                id="stability"
                checked={stability}
                onCheckedChange={setStability}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand/20 bg-brand/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Sem chave LMNT configurada, o estúdio usa o motor{' '}
              <span className="text-foreground">Edge Neural</span> gratuito.
              Adicione sua chave em Configurações para síntese premium
              &lt;200ms.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
