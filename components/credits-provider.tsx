'use client'

import * as React from 'react'

type CreditsContextValue = {
  balance: number
  plan: string
  spend: (chars: number) => void
  add: (chars: number) => void
}

const CreditsContext = React.createContext<CreditsContextValue | null>(null)

export function useCredits() {
  const ctx = React.useContext(CreditsContext)
  if (!ctx) throw new Error('useCredits must be used within CreditsProvider')
  return ctx
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = React.useState(12450)
  const [plan] = React.useState('Starter')

  const spend = React.useCallback(
    (chars: number) => setBalance((b) => Math.max(0, b - chars)),
    [],
  )
  const add = React.useCallback((chars: number) => setBalance((b) => b + chars), [])

  return (
    <CreditsContext.Provider value={{ balance, plan, spend, add }}>
      {children}
    </CreditsContext.Provider>
  )
}
