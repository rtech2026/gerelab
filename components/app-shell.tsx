'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { PlayerProvider } from '@/components/player/player-provider'
import { CreditsProvider } from '@/components/credits-provider'
import { VoicesProvider } from '@/components/voices-provider'
import { SiteHeader } from '@/components/site-header'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname === '/sign-in' || pathname === '/sign-up'
  if (isAuth) return <>{children}</>
  return (
    <CreditsProvider>
      <VoicesProvider>
        <PlayerProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1 pb-28">{children}</div>
          </div>
        </PlayerProvider>
      </VoicesProvider>
    </CreditsProvider>
  )
}
