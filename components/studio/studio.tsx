'use client'

import * as React from 'react'
import {
  Wand2,
  Timer,
  Eraser,
  AudioLines,
  Play,
  Sparkles,
  Waves,
  Languages,
  FileAudio2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const LANGUAGES = [
  { value: 'auto', label: 'Detecção automática' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'de', label: 'Alemão' },
  { value: 'it', label: 'Italiano' },
  { value: 'zh', label: 'Chinês' },
  { value: 'ja', label: 'Japonês' },
  { value: 'ko', label: 'Coreano' },
  { value: 'hi', label: 'Hindi' },
]

const FORMATS = [
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'aac', label: 'AAC' },
]

export function Studio() {
  const { all, loading: voicesLoading } = useVoices()
  const { loadAndPlay } = usePlayer()
  const { charsRemaining, charLimit, plan, setRemaining, refresh } = useCredits()

  const [text, setText] = React.useState(SAMPLE)
  const [voiceId, setVoiceId] = React.useState('')
  const [language, setLanguage] = React.useState('pt')
  const [format, setFormat] = React.useState('mp3')
  const [temperature, setTemperature] = React.useState(0.8)
  const [topP, setTopP] = React.useState(0.7)
  const [loading, setLoading] = React.useState(false)

  // Define a voz padrão assim que as vozes reais carregarem.
  React.useEffect(() => {
    if (!voiceId && all.length > 0) {
      const preferred =
        all.find((v) => v.language.includes('Português')) ?? all[0]
      setVoiceId(preferred.id)
    }
  }, [all, voiceId])

  const voice = getVoiceById(voiceId, all) ?? all[0]
  const chars = text.length
  const overLimit = chars > MAX
  const noCredits = chars > charsRemaining

  const insertPause = () =>
    setText((t) => `${t.trimEnd()} <break time="500ms"/> `)
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
    if (!text.trim()) return toast.error('Escreva algum texto para gerar')
    if (overLimit)
      return toast.error(`Máximo de ${MAX.toLocaleString('pt-BR')} caracteres`)
    if (!voice) return toast.error('Selecione uma voz')
    if (noCredits)
      return toast.error('Créditos insuficientes para esta geração')

    setLoading(true)
    try {
      const { url, engine, creditsRemaining } = await generateSpeech(
        text,
        voice,
        {
          language,
          format,
          temperature,
          topP,
        },
      )
      loadAndPlay({
        id: `gen-${Date.now().toString(36)}`,
        title: text.slice(0, 60),
        voiceName: voice.name,
        url,
        createdAt: Date.now(),
        engine: engineLabel(engine),
        chars,
      })
      if (typeof creditsRemaining === 'number') setRemaining(creditsRemaining)
      else refresh()
      toast.success(`Áudio gerado · ${engineLabel(engine)}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1fr_320px]">
      {/* Text studio */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={enhance}>
            <Wand2 data-icon="inline-start" />
            Aprimorar pontuação
          </Button>
          <Button variant="outline" size="sm" onClick={insertPause}>
            <Timer data-icon="inline-start" />
            Inserir pausa
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
              className="min-h-[300px] w-full resize-none bg-transparent p-5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground sm:min-h-[340px]"
            />
            <div className="flex items-center justify-between gap-2 border-t border-border/80 px-5 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <AudioLines className="size-3.5" />
                <span className="hidden sm:inline">
                  Suporta SSML {'<break/>'} para pausas
                </span>
                <span className="sm:hidden">SSML {'<break/>'}</span>
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={generate}
            disabled={loading || overLimit || noCredits || voicesLoading}
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
            Custo:{' '}
            <span className="font-mono text-foreground">
              {chars.toLocaleString('pt-BR')}
            </span>{' '}
            chars · restam{' '}
            <span
              className={
                noCredits
                  ? 'font-mono text-destructive'
                  : 'font-mono text-foreground'
              }
            >
              {charsRemaining.toLocaleString('pt-BR')}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Languages className="size-3.5" />
                  Idioma
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileAudio2 className="size-3.5" />
                  Formato
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5" />
                  Expressividade
                </Label>
                <span className="font-mono text-xs text-foreground">
                  {temperature.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[temperature]}
                min={0.3}
                max={1}
                step={0.05}
                onValueChange={(v) =>
                  setTemperature(Array.isArray(v) ? v[0] : (v as number))
                }
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Maior valor = fala mais emotiva e variada.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Waves className="size-3.5" />
                  Estabilidade
                </Label>
                <span className="font-mono text-xs text-foreground">
                  {topP.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[topP]}
                min={0.3}
                max={1}
                step={0.05}
                onValueChange={(v) =>
                  setTopP(Array.isArray(v) ? v[0] : (v as number))
                }
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Menor valor = entonação mais consistente e previsível.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand/20 bg-brand/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Plano</span>
              <span className="text-sm font-medium capitalize text-foreground">
                {plan}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">
                Créditos restantes
              </span>
              <span className="font-mono text-sm text-foreground">
                {charsRemaining.toLocaleString('pt-BR')} /{' '}
                {charLimit.toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
