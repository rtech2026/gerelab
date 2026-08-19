'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, Mic, FileAudio, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/studio/spinner'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Recorder } from '@/components/clone/recorder'
import { useVoices } from '@/components/voices-provider'
import { cn } from '@/lib/utils'
import type { Voice } from '@/lib/voices'

const LANGS = [
  { code: 'PT-BR', label: 'Português (Brasil)' },
  { code: 'EN-US', label: 'English (US)' },
  { code: 'ES-ES', label: 'Español (España)' },
]

function StepBadge({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-full border border-border font-mono text-[11px] text-muted-foreground">
        {n}
      </span>
      <span className="text-sm font-medium text-foreground">{title}</span>
    </div>
  )
}

export function CloneWorkspace() {
  const router = useRouter()
  const { addCloned } = useVoices()

  const [name, setName] = React.useState('')
  const [lang, setLang] = React.useState('PT-BR')
  const [gender, setGender] = React.useState('female')
  const [consent, setConsent] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    if (!/\.(mp3|wav|m4a|webm|ogg)$/i.test(f.name)) {
      toast.error('Formato não suportado (use MP3, WAV ou M4A)')
      return
    }
    setFile(f)
  }

  const onRecorded = (blob: Blob | null, seconds: number) => {
    if (!blob) {
      setFile(null)
      return
    }
    if (seconds < 5) {
      toast.error('Gravação muito curta (mín. 10s recomendado)')
      return
    }
    setFile(new File([blob], `gravacao-${Date.now()}.webm`, { type: blob.type }))
  }

  const canSubmit = name.trim() && file && consent && !submitting

  const submit = async () => {
    if (!name.trim()) return toast.error('Informe um nome para a voz')
    if (!file) return toast.error('Adicione uma amostra de áudio')
    if (!consent) return toast.error('Confirme o consentimento')

    setSubmitting(true)
    try {
      const langInfo = LANGS.find((l) => l.code === lang)
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append(
        'description',
        `Voz clonada · ${langInfo?.label ?? lang}`,
      )
      fd.append('gender', gender)
      fd.append('consent', 'true')
      fd.append('audio', file)

      const res = await fetch('/api/clone', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Falha na clonagem')

      addCloned(data.voice as Voice)
      toast.success('Voz clonada com sucesso na LMNT!')
      router.push('/library')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Clone Voice
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Crie uma voz neural personalizada a partir de uma amostra curta.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="sr-only">Nova voz clonada</CardTitle>
          <CardDescription className="sr-only">
            Preencha os detalhes, envie uma amostra e confirme o consentimento.
          </CardDescription>
          <StepBadge n={1} title="Detalhes da voz" />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="voice-name">Nome da voz</FieldLabel>
              <Input
                id="voice-name"
                placeholder="Ex.: Minha Voz Narração"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Idioma</FieldLabel>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGS.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Categoria</FieldLabel>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Feminina</SelectItem>
                    <SelectItem value="male">Masculina</SelectItem>
                    <SelectItem value="neutral">Neutra</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>

          <Separator />

          <div className="flex flex-col gap-4">
            <StepBadge n={2} title="Fonte de áudio" />
            <Tabs defaultValue="upload">
              <TabsList>
                <TabsTrigger value="upload">
                  <UploadCloud data-icon="inline-start" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="record">
                  <Mic data-icon="inline-start" />
                  Gravar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    handleFiles(e.dataTransfer.files)
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors',
                    dragOver
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-muted-foreground/40',
                  )}
                >
                  <UploadCloud className="size-6 text-muted-foreground" />
                  <p className="text-sm text-foreground">
                    Arraste um arquivo ou clique para enviar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV ou M4A · mínimo 10s de áudio limpo
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,audio/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="record" className="mt-4">
                <Recorder onRecorded={onRecorded} />
              </TabsContent>
            </Tabs>

            {file && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <FileAudio className="size-4 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setFile(null)}
                  aria-label="Remover amostra"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <StepBadge n={3} title="Consentimento" />
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={consent}
                onCheckedChange={(c) => setConsent(c === true)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed text-muted-foreground">
                Confirmo que possuo ou tenho permissão para clonar esta voz e
                que o uso está de acordo com as leis aplicáveis.
              </span>
            </label>

            <Button onClick={submit} disabled={!canSubmit} className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Sintetizando clone neural
                </>
              ) : (
                <>
                  <Check data-icon="inline-start" />
                  Criar clone de voz
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
