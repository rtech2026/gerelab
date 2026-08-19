'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Upload,
  Mic,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Square,
  BookOpen,
  Shuffle,
  Volume2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useVoices } from '@/components/voices-provider'
import { useCredits } from '@/components/credits-provider'

const SAMPLE_TEXTS = [
  {
    title: 'Texto 1: Narrativa & Expressão',
    category: 'Prosódia Natural',
    text: 'O sol nascia por trás das montanhas, revelando caminhos que antes pareciam invisíveis. Com voz firme e ritmo natural, decidi seguir em frente, explorando novas possibilidades e criando conexões que ecoam com autenticidade.',
  },
  {
    title: 'Texto 2: Comercial & Autoridade',
    category: 'Locução & Vendas',
    text: 'Transforme a sua comunicação com o poder da inteligência artificial. Criatividade, impacto imediato e uma presença de voz marcante para elevar seus projetos ao próximo nível de excelência.',
  },
  {
    title: 'Texto 3: Fonemas Ricos & Sotaque',
    category: 'Articulação Clara',
    text: 'Chovia suavemente naquela tarde de primavera enquanto as folhas caíam ao vento. Cada palavra pronunciada com clareza transmite verdade, autoridade e a essência única da nossa língua.',
  },
  {
    title: 'Texto 4: Conversa & Podcast',
    category: 'Casual & Fluido',
    text: 'Seja muito bem-vindo a este bate-papo. Hoje vamos conversar sobre inovação, ideias que mudam o mundo e como as novas ferramentas digitais estão transformando o nosso dia a dia.',
  },
]

export function CloneWorkspace() {
  const { addCloned } = useVoices()
  const { charsRemaining, refresh: refreshCredits } = useCredits()

  // Form State
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [gender, setGender] = React.useState<'male' | 'female'>('female')
  const [mode, setMode] = React.useState<'record' | 'upload'>('record')

  // File Upload State
  const [file, setFile] = React.useState<File | null>(null)

  // Recording State
  const [isRecording, setIsRecording] = React.useState(false)
  const [recordSeconds, setRecordSeconds] = React.useState(0)
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = React.useState<string | null>(null)
  const [isPlayingPreview, setIsPlayingPreview] = React.useState(false)

  // Prompter State
  const [activeTextIndex, setActiveTextIndex] = React.useState(0)

  // Submission State
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // References
  const nameInputRef = React.useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)

  // Gerenciamento de Gravação
  const startRecording = async () => {
    setError(null)
    setRecordedBlob(null)
    setRecordedAudioUrl(null)
    setFile(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      }

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType })
        setRecordedBlob(fullBlob)
        const url = URL.createObjectURL(fullBlob)
        setRecordedAudioUrl(url)
        
        const audioFile = new File([fullBlob], 'minha_voz_gravada.webm', { type: mimeType })
        setFile(audioFile)

        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(200)
      setIsRecording(true)
      setRecordSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      setError('Permissão de microfone negada. Verifique as permissões do seu navegador.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resetRecording = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
    }
    setIsPlayingPreview(false)
    setRecordedBlob(null)
    setRecordedAudioUrl(null)
    setFile(null)
    setRecordSeconds(0)
  }

  const togglePreviewPlay = () => {
    if (!recordedAudioUrl) return
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(recordedAudioUrl)
      previewAudioRef.current.onended = () => setIsPlayingPreview(false)
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause()
      setIsPlayingPreview(false)
    } else {
      previewAudioRef.current.play()
      setIsPlayingPreview(true)
    }
  }

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (previewAudioRef.current) previewAudioRef.current.pause()
    }
  }, [])

  const nextPrompterText = () => {
    setActiveTextIndex((prev) => (prev + 1) % SAMPLE_TEXTS.length)
  }

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Por favor, dê um nome para a sua voz.')
      if (nameInputRef.current) nameInputRef.current.focus()
      return
    }

    if (!file) {
      setError('Você precisa gravar um áudio ou fazer upload de um arquivo primeiro.')
      return
    }

    if (mode === 'record' && recordSeconds > 0 && recordSeconds < 5) {
      setError('Grave pelo menos 10 segundos de áudio para uma clonagem de alta fidelidade.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('description', description.trim() || 'Voz clonada personalizada.')
      formData.append('gender', gender)
      formData.append('file', file)

      const res = await fetch('/api/clone', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao clonar voz')
      }

      await refreshCredits()
      setSuccess('Sua voz foi clonada com sucesso! Ela já está disponível no estúdio e na sua biblioteca.')
      setName('')
      setDescription('')
      resetRecording()
      setFile(null)

      if (data.voice) {
        addCloned(data.voice)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const currentText = SAMPLE_TEXTS[activeTextIndex]
  const hasAudioSample = Boolean(file || recordedBlob)

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-border/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Clonagem Instantânea de Voz
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grave pelo microfone ou envie um áudio para criar uma réplica neural da sua voz.
          </p>
        </div>

        {/* Custo de Créditos */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-muted/40 border border-border/60 self-start sm:self-auto">
          <div className="size-1.5 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-muted-foreground">
            Custo: <strong className="text-foreground font-bold">1.000 créditos</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulário Principal */}
        <div className="md:col-span-2">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Configurar Nova Voz</CardTitle>
              <CardDescription>
                Informe o nome e grave ou envie um áudio sem ruído.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClone} className="flex flex-col gap-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Nome da Voz */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="voice-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Nome da Voz *
                  </Label>
                  <Input
                    id="voice-name"
                    ref={nameInputRef}
                    placeholder="Ex: Minha Voz Comercial, Podcast..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-lg border border-border/80 h-10 font-medium text-sm"
                  />
                </div>

                {/* Gênero e Sotaque */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="voice-gender" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Gênero
                    </Label>
                    <Select
                      value={gender}
                      onValueChange={(v: 'male' | 'female') => setGender(v)}
                    >
                      <SelectTrigger id="voice-gender" className="rounded-lg border border-border/80 h-10 text-sm">
                        <SelectValue placeholder="Selecione o gênero">
                          {gender === 'female' ? 'Feminino' : 'Masculino'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="voice-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Descrição / Sotaque (opcional)
                    </Label>
                    <Input
                      id="voice-desc"
                      placeholder="Ex: Português Brasileiro (Carioca)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-lg border border-border/80 h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Captura de Áudio: Abas Minimalistas */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Amostra de Áudio *
                    </Label>
                    <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/60">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('record')
                          setFile(null)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          mode === 'record'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Mic className="size-3.5" />
                        Gravar Áudio
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('upload')
                          resetRecording()
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          mode === 'upload'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Upload className="size-3.5" />
                        Enviar Arquivo
                      </button>
                    </div>
                  </div>

                  {/* ── MODO 1: GRAVADOR MINIMALISTA ── */}
                  {mode === 'record' && (
                    <div className="flex flex-col gap-3.5">
                      {/* Teleprompter Clean */}
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="size-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-foreground">{currentText.title}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">({currentText.category})</span>
                          </div>
                          <button
                            type="button"
                            onClick={nextPrompterText}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
                          >
                            <Shuffle className="size-3" />
                            Trocar texto
                          </button>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed italic bg-background/50 p-2.5 rounded-lg border border-border/40">
                          "{currentText.text}"
                        </p>
                      </div>

                      {/* Caixa de Gravação Minimalista */}
                      <div className="p-4 rounded-xl border border-border/70 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {isRecording ? (
                            <div className="size-3 rounded-full bg-primary animate-pulse" />
                          ) : (
                            <div className={`size-3 rounded-full ${recordedAudioUrl ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">
                              {isRecording
                                ? 'Gravando amostra...'
                                : recordedAudioUrl
                                ? 'Áudio capturado'
                                : 'Microfone pronto'}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {Math.floor(recordSeconds / 60)
                                .toString()
                                .padStart(2, '0')}
                              :{(recordSeconds % 60).toString().padStart(2, '0')}
                              {isRecording && recordSeconds < 10 && ' (mínimo recomendado: 10s)'}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2">
                          {!isRecording && !recordedAudioUrl && (
                            <Button
                              type="button"
                              onClick={startRecording}
                              variant="outline"
                              className="h-9 px-4 rounded-lg font-medium text-xs gap-2 border-border/80 hover:bg-muted"
                            >
                              <Mic className="size-3.5" />
                              Gravar
                            </Button>
                          )}

                          {isRecording && (
                            <Button
                              type="button"
                              onClick={stopRecording}
                              variant="default"
                              className="h-9 px-4 rounded-lg font-medium text-xs gap-2 bg-foreground text-background"
                            >
                              <Square className="size-3.5 fill-current" />
                              Parar ({recordSeconds}s)
                            </Button>
                          )}

                          {recordedAudioUrl && !isRecording && (
                            <>
                              <Button
                                type="button"
                                onClick={togglePreviewPlay}
                                variant="outline"
                                className="h-9 px-3 rounded-lg text-xs font-medium gap-1.5"
                              >
                                {isPlayingPreview ? (
                                  <>
                                    <Pause className="size-3 fill-current" />
                                    Pausar
                                  </>
                                ) : (
                                  <>
                                    <Play className="size-3 fill-current" />
                                    Ouvir
                                  </>
                                )}
                              </Button>

                              <Button
                                type="button"
                                onClick={resetRecording}
                                variant="ghost"
                                className="h-9 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── MODO 2: UPLOAD DE ARQUIVO ── */}
                  {mode === 'upload' && (
                    <div className="border border-dashed border-border/80 rounded-xl p-5 text-center hover:border-foreground/40 transition-colors bg-muted/10">
                      <input
                        type="file"
                        id="audio-file"
                        accept="audio/mp3,audio/wav,audio/m4a,audio/ogg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) setFile(f)
                        }}
                      />
                      <label
                        htmlFor="audio-file"
                        className="cursor-pointer flex flex-col items-center gap-1.5"
                      >
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">
                          {file ? file.name : 'Selecionar arquivo de áudio'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          MP3, WAV, M4A (10 a 60 segundos recomendados)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Botão de Envio / Clonagem (Sem ícone de estrela, clean e responsivo) */}
                <Button
                  type="submit"
                  disabled={loading || isRecording}
                  className="mt-2 h-11 rounded-lg font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="size-4" />
                      <span>Clonando voz...</span>
                    </div>
                  ) : (
                    <span>Clonar Voz (1.000 créditos)</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Dicas e Saldo */}
        <div className="flex flex-col gap-5">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Boas Práticas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span>Grave em local silencioso sem eco.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span>Mantenha ritmo natural por 10 a 30 segundos.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span>Formatos suportados: Gravação direta, MP3, WAV e M4A.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Seu Saldo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Disponível:</span>
                <span className="text-sm font-bold font-mono text-foreground">{charsRemaining.toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                25.000 créditos mensais gratuitos para sínteses e clonagens.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
