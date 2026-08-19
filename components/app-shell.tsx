'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { PlayerProvider } from '@/components/player/player-provider'
import { CreditsProvider } from '@/components/credits-provider'
import { VoicesProvider } from '@/components/voices-provider'
import { I18nProvider } from '@/lib/i18n'
import { AppSidebar } from '@/components/app-sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname === '/sign-in' || pathname === '/sign-up'
  if (isAuth) return <I18nProvider>{children}</I18nProvider>
  return (
    <I18nProvider>
      <CreditsProvider>
        <VoicesProvider>
          <PlayerProvider>
            <div className="flex min-h-screen">
              <AppSidebar />
              <main className="flex-1 overflow-x-hidden pb-28">{children}</main>
            </div>
          </PlayerProvider>
        </VoicesProvider>
      </CreditsProvider>
    </I18nProvider>
  )
}
