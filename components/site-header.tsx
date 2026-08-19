'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AudioWaveform, Settings, KeyRound, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCredits } from '@/components/credits-provider'
import { ApiKeyDialog } from '@/components/api-key-dialog'

const NAV = [
  { href: '/', label: 'Studio' },
  { href: '/library', label: 'Voice Library' },
  { href: '/clone', label: 'Clone Voice' },
  { href: '/history', label: 'History' },
  { href: '/pricing', label: 'Pricing' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { balance } = useCredits()
  const [apiOpen, setApiOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <AudioWaveform className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            AuraVoice
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hidden gap-1.5 font-mono text-xs font-normal sm:flex"
          >
            <Coins className="size-3 text-brand" />
            {balance.toLocaleString('pt-BR')} chars
          </Badge>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Configurar API Key"
            onClick={() => setApiOpen(true)}
          >
            <KeyRound className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Configurações">
            <Settings className="size-4" />
          </Button>
          <Avatar className="size-7">
            <AvatarFallback className="bg-brand/15 text-xs text-brand">
              AV
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <ApiKeyDialog open={apiOpen} onOpenChange={setApiOpen} />
    </header>
  )
}
