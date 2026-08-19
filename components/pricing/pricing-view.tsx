'use client'

import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Tier = {
  id: string
  name: string
  price: string
  period: string
  tagline: string
  featured?: boolean
  cta: string
  features: { label: string; value: string | boolean }[]
}

const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 0',
    period: '/mês',
    tagline: 'Para experimentar o estúdio.',
    cta: 'Começar grátis',
    features: [
      { label: '10.000 caracteres / mês', value: true },
      { label: 'Vozes nativas PT-BR, EN, ES', value: true },
      { label: 'Slots de voz clonada', value: '1' },
      { label: 'Exportar MP3', value: true },
      { label: 'Exportar WAV de estúdio', value: false },
      { label: 'Acesso à API', value: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Studio',
    price: 'R$ 149',
    period: '/mês',
    tagline: 'Para criadores e produtores.',
    featured: true,
    cta: 'Assinar Pro Studio',
    features: [
      { label: '1.000.000 caracteres / mês', value: true },
      { label: 'Todas as vozes nativas', value: true },
      { label: 'Slots de voz clonada', value: '10' },
      { label: 'Exportar MP3', value: true },
      { label: 'Exportar WAV de estúdio', value: true },
      { label: 'Acesso à API', value: true },
    ],
  },
  {
    id: 'agency',
    name: 'Agency Scale',
    price: 'R$ 399',
    period: '/mês',
    tagline: 'Para times e escala.',
    cta: 'Falar com vendas',
    features: [
      { label: '5.000.000 caracteres / mês', value: true },
      { label: 'Todas as vozes nativas', value: true },
      { label: 'Slots de voz clonada', value: 'Ilimitado' },
      { label: 'Exportar MP3', value: true },
      { label: 'Exportar WAV de estúdio', value: true },
      { label: 'API + prioridade de fila', value: true },
    ],
  },
]

export function PricingView() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground">
          Planos que escalam com sua voz
        </h1>
        <p className="mt-3 text-pretty text-sm text-muted-foreground">
          Comece grátis e amplie créditos, slots de clonagem e acesso à API
          conforme sua produção cresce.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <Card
            key={tier.id}
            className={cn(
              'relative flex flex-col',
              tier.featured && 'overflow-visible ring-1 ring-brand/40',
            )}
          >
            {tier.featured && (
              <Badge className="absolute -top-3 left-4 z-10 bg-brand text-brand-foreground shadow-sm">
                Mais popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-base">{tier.name}</CardTitle>
              <CardDescription>{tier.tagline}</CardDescription>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {tier.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {tier.period}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
              <Button
                variant={tier.featured ? 'default' : 'outline'}
                onClick={() => toast.success(`Plano ${tier.name} selecionado`)}
              >
                {tier.cta}
              </Button>
              <ul className="flex flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li
                    key={f.label}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    {f.value === false ? (
                      <Minus className="size-4 shrink-0 text-muted-foreground/50" />
                    ) : (
                      <Check className="size-4 shrink-0 text-brand" />
                    )}
                    <span
                      className={cn(
                        'text-muted-foreground',
                        f.value === false && 'text-muted-foreground/50',
                      )}
                    >
                      {f.label}
                      {typeof f.value === 'string' && (
                        <span className="ml-1 font-medium text-foreground">
                          · {f.value}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
