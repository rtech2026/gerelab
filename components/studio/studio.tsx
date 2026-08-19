'use client'

import * as React from 'react'
import {
  Play,
  Pause,
  Download,
  Volume2,
  RotateCcw,
  SlidersHorizontal,
  Mic,
  MicOff,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  AudioWaveform,
  Check,
  Layers,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VoiceSelector } from '@/components/studio/voice-selector'
import { FlagIcon } from '@/components/studio/language-flags'
import { useVoices } from '@/components/voices-provider'
import { useCredits } from '@/components/credits-provider'
import { usePlayer } from '@/components/player/player-provider'
import { BatchStudio } from '@/components/studio/batch-studio'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'

const FORMATS = [
  { value: 'mp3', label: 'MP3 (Padrão)' },
  { value: 'wav', label: 'WAV (Sem Perdas)' },
]

const STUDIO_LANGUAGES = [
  { value: 'auto', label: 'Detecção Automática', flag: 'auto', desc: 'Identifica o idioma do texto' },
  { value: 'pt', label: 'Português (Brasil)', flag: 'br', desc: 'Português Brasileiro Nativo' },
  { value: 'pt-pt', label: 'Português (Portugal)', flag: 'pt', desc: 'Português Europeu' },
  { value: 'en', label: 'Inglês (EUA)', flag: 'us', desc: 'Inglês Americano' },
  { value: 'en-gb', label: 'Inglês (Reino Unido)', flag: 'gb', desc: 'Inglês Britânico' },
  { value: 'es', label: 'Espanhol', flag: 'es', desc: 'Espanhol Latino & Castelhano' },
  { value: 'fr', label: 'Francês', flag: 'fr', desc: 'Francês Clássico' },
  { value: 'de', label: 'Alemão', flag: 'de', desc: 'Alemão Fluente' },
  { value: 'it', label: 'Italiano', flag: 'it', desc: 'Italiano Fluente' },
  { value: 'ja', label: 'Japonês', flag: 'jp', desc: 'Japonês Nativo' },
  { value: 'zh', label: 'Mandarim', flag: 'cn', desc: 'Chinês Mandarim' },
]

const QUICK_PROMPTS = [
  { label: 'Narrador de Vídeo', text: 'Bem-vindos a mais uma jornada épica de inovação e tecnologia de ponta no GereLab.' },
  { label: 'Locutor Comercial', text: 'Chegou a sua oportunidade de transformar seus vídeos com vozes ultrarrealistas de altíssima qualidade!' },
  { label: 'Conversa Natural', text: 'Olá, tudo bem com você? Hoje eu quero te contar uma novidade que vai transformar o seu fluxo de trabalho.' },
]

export function Studio() {
  const { all: voices, loading: voicesLoading } = useVoices()
  const { charsRemaining, charLimit, refresh: refreshCredits } = useCredits()
  const { loadAndPlay, isPlaying, current, togglePlay } = usePlayer()

  const [activeTab, setActiveTab] = React.useState<'single' | 'batch'>('single')
  const [text, setText] = React.useState('')
  const [voiceId, setVoiceId] = React.useState('daniel')
  const [language, setLanguage] = React.useState('auto')
  const [format, setFormat] = React.useState<'mp3' | 'wav'>('mp3')
  const [temperature, setTemperature] = React.useState(0.7)
  const [topP, setTopP] = React.useState(0.9)
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const [loading, setLoading] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null)
  const [lastGenId, setLastGenId] = React.useState<string | null>(null)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const recognitionRef = React.useRef<any>(null)
  const baseTextRef = React.useRef<string>('')

  React.useEffect(() => {
    if (voices && voices.length > 0) {
      const exists = voices.some((v) => v.id.toLowerCase() === voiceId.toLowerCase())
      if (!exists) {
        setVoiceId(voices[0].id)
      }
    }
  }, [voices, voiceId])

  const voice = (voices || []).find((v) => v.id.toLowerCase() === voiceId.toLowerCase()) || voices?.[0]
  const chars = text.length
  const userBalance = charsRemaining
  const noCredits = chars > userBalance

  const toggleListening = () => {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error('Reconhecimento de fala não suportado neste navegador.')
      return
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR'

      baseTextRef.current = text

      recognition.onstart = () => {
        setIsListening(true)
        toast.info('Microfone ativo. Fale agora...')
      }

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        const glue = baseTextRef.current && !baseTextRef.current.endsWith(' ') ? ' ' : ''
        setText(baseTextRef.current ? baseTextRef.current + glue + transcript : transcript)
      }

      recognition.onerror = (e: any) => {
        console.error('Speech error:', e)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error(err)
      setIsListening(false)
      toast.error('Erro ao iniciar microfone.')
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Digite ou dite algum texto para sintetizar a voz.')
      return
    }
    if (noCredits) {
      toast.error('Créditos insuficientes para este texto.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: voiceId,
          language: language === 'auto' ? undefined : language,
          format,
          temperature,
          top_p: topP,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Falha ao processar síntese de voz.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const genId = `gen-${Date.now()}`

      setAudioUrl(url)
      setLastGenId(genId)

      loadAndPlay({
        id: genId,
        title: text.length > 50 ? text.slice(0, 50) + '...' : text,
        voiceName: voice?.name || 'Voz Neural',
        url,
        format,
        chars,
        createdAt: Date.now(),
        engine: 'GereLab Voice AI',
      })

      await refreshCredits()
      toast.success('Áudio gerado com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao gerar áudio. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* ── Top Header com Seletor de Modo e Saldo Sincronizado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Estúdio de Voz
            </h1>
          </div>
          
          {/* Navegação entre Modo Único e Modo Cascata */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/80 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="size-3.5" />
              <span>Texto Único</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'batch'
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="size-3.5 text-primary" />
              <span>Geração em Cascata</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/40 bg-primary/10 text-primary font-extrabold">
                LOTE
              </Badge>
            </button>
          </div>
        </div>

        {/* Card de Saldo Unificado */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-card border-2 border-border/80 rounded-2xl px-5 py-2.5 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saldo Disponível</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-foreground font-mono">{userBalance.toLocaleString('pt-BR')}</span>
              <span className="text-xs text-muted-foreground font-medium">créditos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Renderização Condicional do Modo Escolhido ── */}
      {activeTab === 'batch' ? (
        <BatchStudio />
      ) : (
        <>
          {/* ── Editor Central Estilo ElevenLabs SaaS ── */}
          <div className="rounded-3xl border-2 border-border/80 bg-card shadow-xl overflow-hidden transition-all flex flex-col">
            
            {/* Barra de Ferramentas Superior: Voz, Idioma, Formato e Ajustes */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/40 p-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Seletor de Voz */}
                <VoiceSelector value={voiceId} onChange={setVoiceId} />

                <div className="h-5 w-px bg-border hidden sm:block" />

                {/* Seletor de Idiomas */}
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-9 w-auto min-w-[150px] gap-2 rounded-xl bg-card border-2 border-border/80 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer">
                    <Globe className="size-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Idioma" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {STUDIO_LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value} className="text-xs cursor-pointer">
                        <div className="flex items-center gap-2">
                          <FlagIcon code={l.flag} className="size-3.5 rounded-full" />
                          <span>{l.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Formato do Áudio */}
                <Select value={format} onValueChange={(v: 'mp3' | 'wav') => setFormat(v)}>
                  <SelectTrigger className="h-9 w-auto min-w-[110px] gap-1.5 rounded-xl bg-card border-2 border-border/80 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer">
                    <AudioWaveform className="size-3.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value} className="text-xs font-medium cursor-pointer">
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {/* Ditado por Voz */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleListening}
                  className={`h-9 px-3 rounded-xl border-2 transition-all gap-1.5 text-xs font-semibold cursor-pointer ${
                    isListening
                      ? 'border-destructive bg-destructive/10 text-destructive animate-pulse'
                      : 'border-border/80 bg-card text-foreground hover:bg-muted'
                  }`}
                  title="Ditar texto usando microfone"
                >
                  {isListening ? (
                    <>
                      <MicOff className="size-3.5" />
                      <span>Gravando...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="size-3.5 text-muted-foreground" />
                      <span>Ditar</span>
                    </>
                  )}
                </Button>

                {/* Botão de Ajustes Avançados */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`h-9 px-3 rounded-xl text-xs font-semibold border-2 transition-all gap-1.5 cursor-pointer ${
                    showAdvanced
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Ajustes</span>
                  {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </Button>
              </div>
            </div>

            {/* Painel Avançado Colapsável */}
            {showAdvanced && (
              <div className="border-b border-border/60 bg-muted/20 p-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Expressividade / Variação: {Math.round(temperature * 100)}%</span>
                    <span className="text-muted-foreground text-[11px]">Quanto maior, mais entonação</span>
                  </div>
                  <Slider
                    value={[temperature]}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    onValueChange={([v]) => setTemperature(v)}
                    className="py-1"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Estabilidade de Voz: {Math.round(topP * 100)}%</span>
                    <span className="text-muted-foreground text-[11px]">Consistência tonal</span>
                  </div>
                  <Slider
                    value={[topP]}
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    onValueChange={([v]) => setTopP(v)}
                    className="py-1"
                  />
                </div>
              </div>
            )}

            {/* Área de Texto Principal */}
            <div className="relative p-5 sm:p-6 flex-1 flex flex-col min-h-[260px]">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite ou cole aqui o seu texto para transformar em voz neural..."
                className="w-full flex-1 bg-transparent text-base sm:text-lg text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none leading-relaxed font-normal min-h-[180px]"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
              />

              {/* Prompts Rápidos de Exemplo */}
              {!text && (
                <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Sugestões rápidas:</span>
                  {QUICK_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setText(p.text)}
                      className="px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Barra Inferior com Contadores e Ação Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/60 bg-muted/30 p-4 sm:px-6">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className={`font-mono font-bold ${noCredits ? 'text-destructive' : 'text-foreground'}`}>
                    {chars.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-muted-foreground">/ {userBalance.toLocaleString('pt-BR')} caracteres</span>
                </div>

                {text.length > 0 && (
                  <>
                    <div className="h-3.5 w-px bg-border" />
                    <button
                      type="button"
                      onClick={() => setText('')}
                      className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      Limpar texto
                    </button>
                  </>
                )}
              </div>

              {/* Botão de Geração Principal */}
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !text.trim() || noCredits}
                size="lg"
                className="h-12 px-8 rounded-xl font-bold text-sm bg-foreground text-background hover:opacity-90 transition-all shadow-md gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Sintetizando fala...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Gerar Fala Neural</span>
                    <span className="text-[11px] font-normal opacity-70 ml-1 hidden sm:inline">(Ctrl + Enter)</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Card de Áudio Gerado com Player Instantâneo ── */}
          {audioUrl && (
            <div className="rounded-2xl border-2 border-border/80 bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Volume2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Áudio Gerado com Sucesso</span>
                    <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                      {format}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {voice?.name || 'Voz Neural'} · {chars.toLocaleString('pt-BR')} caracteres sintetizados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (lastGenId && current?.id === lastGenId) {
                      togglePlay()
                    } else if (lastGenId) {
                      loadAndPlay({
                        id: lastGenId,
                        title: text.length > 50 ? text.slice(0, 50) + '...' : text,
                        voiceName: voice?.name || 'Voz Neural',
                        url: audioUrl,
                        createdAt: Date.now(),
                        engine: 'GereLab Voice AI',
                        chars: chars,
                      })
                    }
                  }}
                  className="h-10 px-5 rounded-xl border-2 border-border/80 bg-card hover:bg-muted gap-2 text-xs font-bold text-foreground cursor-pointer"
                >
                  {isPlaying && current?.id === lastGenId ? (
                    <>
                      <Pause className="size-4 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-4 fill-current" />
                      <span>Ouvir</span>
                    </>
                  )}
                </Button>

                <a
                  href={audioUrl}
                  download={`gerelab-${voice?.name || 'voz'}-${Date.now()}.${format}`}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-all gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="size-4" />
                  <span>Baixar</span>
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
