'use client'

import * as React from 'react'
import { getCredits, type CreditsInfo } from '@/app/actions/credits'
import { useSession } from '@/lib/auth-client'

type CreditsContextValue = {
  plan: string
  charLimit: number
  charsUsed: number
  charsRemaining: number
  periodEnd: string | null
  loading: boolean
  refresh: () => Promise<void>
  refreshCredits: () => Promise<void>
  setRemaining: (remaining: number) => void
}

const CreditsContext = React.createContext<CreditsContextValue | null>(null)

export function useCredits() {
  const ctx = React.useContext(CreditsContext)
  if (!ctx) throw new Error('useCredits must be used within CreditsProvider')
  return ctx
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { data: sessionData } = useSession()
  const [info, setInfo] = React.useState<CreditsInfo | null>(null)
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCredits()
      setInfo(data)
    } catch {
      setInfo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (sessionData?.user) refresh()
    else setInfo(null)
  }, [sessionData?.user, refresh])

  const setRemaining = React.useCallback((remaining: number) => {
    setInfo((prev) =>
      prev
        ? { ...prev, charsRemaining: remaining, charsUsed: prev.charLimit - remaining }
        : prev,
    )
  }, [])

  const value: CreditsContextValue = {
    plan: info?.plan ?? 'free',
    charLimit: info?.charLimit ?? 25000,
    charsUsed: info?.charsUsed ?? 0,
    charsRemaining: info?.charsRemaining ?? 0,
    periodEnd: info?.periodEnd ?? null,
    loading,
    refresh,
    refreshCredits: refresh,
    setRemaining,
  }

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  )
}
