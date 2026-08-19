'use client'

import * as React from 'react'
import { NATIVE_VOICES, type Voice } from '@/lib/voices'

type VoicesContextValue = {
  native: Voice[]
  cloned: Voice[]
  all: Voice[]
  addCloned: (voice: Voice) => void
  removeCloned: (id: string) => void
}

const VoicesContext = React.createContext<VoicesContextValue | null>(null)

export function useVoices() {
  const ctx = React.useContext(VoicesContext)
  if (!ctx) throw new Error('useVoices must be used within VoicesProvider')
  return ctx
}

export function VoicesProvider({ children }: { children: React.ReactNode }) {
  const [cloned, setCloned] = React.useState<Voice[]>([])

  const addCloned = React.useCallback(
    (voice: Voice) => setCloned((prev) => [voice, ...prev]),
    [],
  )
  const removeCloned = React.useCallback(
    (id: string) => setCloned((prev) => prev.filter((v) => v.id !== id)),
    [],
  )

  const value: VoicesContextValue = {
    native: NATIVE_VOICES,
    cloned,
    all: [...cloned, ...NATIVE_VOICES],
    addCloned,
    removeCloned,
  }

  return (
    <VoicesContext.Provider value={value}>{children}</VoicesContext.Provider>
  )
}
