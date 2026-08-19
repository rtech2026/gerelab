'use client'

import * as React from 'react'
import Link from 'next/link'
import { Trash2, Plus, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { VoicePreviewButton } from '@/components/voice-preview-button'
import { useVoices } from '@/components/voices-provider'
import type { Voice } from '@/lib/voices'

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'PT-BR', label: 'PT-BR' },
  { value: 'EN-US', label: 'EN-US' },
  { value: 'ES-ES', label: 'ES-ES' },
]

function VoiceCard({
  voice,
  onDelete,
}: {
  voice: Voice
  onDelete?: (id: string) => void
}) {
  return (
    <Card className="transition-colors hover:border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
              {voice.name.slice(0, 1)}
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                {voice.name}
                <span className="font-mono text-[10px] text-muted-foreground">
                  {voice.flag}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {voice.accent} · {voice.gender === 'male' ? 'Masculina' : 'Feminina'}
              </p>
            </div>
          </div>
          {voice.category === 'cloned' ? (
            <Badge variant="secondary" className="text-[10px]">
              Clone
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              {voice.langCode}
            </Badge>
          )}
        </div>

        <p className="line-clamp-2 min-h-8 text-xs leading-relaxed text-muted-foreground">
          {voice.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {voice.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] font-normal">
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <VoicePreviewButton voice={voice} />
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto text-muted-foreground"
              aria-label={`Excluir ${voice.name}`}
              onClick={() => {
                onDelete(voice.id)
                toast.success(`Voz "${voice.name}" removida`)
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LibraryView() {
  const { native, cloned, removeCloned } = useVoices()
  const [filter, setFilter] = React.useState('all')

  const filteredNative = native.filter(
    (v) => filter === 'all' || v.langCode === filter,
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Voice Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vozes nativas de alta fidelidade e suas vozes clonadas.
          </p>
        </div>
        <ToggleGroup
          value={[filter]}
          onValueChange={(v) => setFilter((v as string[])[0] ?? 'all')}
          variant="outline"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value} className="text-xs">
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Cloned voices */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <UserRound className="size-4 text-muted-foreground" />
            Minhas vozes clonadas
          </h2>
          <Button variant="outline" size="sm" render={<Link href="/clone" />}>
            <Plus data-icon="inline-start" />
            Nova voz
          </Button>
        </div>
        {cloned.length === 0 ? (
          <Empty className="rounded-xl border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRound />
              </EmptyMedia>
              <EmptyTitle>Nenhuma voz clonada ainda</EmptyTitle>
              <EmptyDescription>
                Clone sua própria voz a partir de uma amostra de 10 a 60
                segundos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" render={<Link href="/clone" />}>
                <Plus data-icon="inline-start" />
                Clonar voz
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cloned
              .filter((v) => filter === 'all' || v.langCode === filter)
              .map((v) => (
                <VoiceCard key={v.id} voice={v} onDelete={removeCloned} />
              ))}
          </div>
        )}
      </section>

      {/* Native voices */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Vozes nativas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNative.map((v) => (
            <VoiceCard key={v.id} voice={v} />
          ))}
        </div>
      </section>
    </main>
  )
}
