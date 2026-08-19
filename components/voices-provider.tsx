'use client'

import * as React from 'react'
import { FALLBACK_VOICES, type Voice } from '@/lib/voices'
import { useSession } from '@/lib/auth-client'

type VoicesContextValue = {
  native: Voice[]
  cloned: Voice[]
  all: Voice[]
  loading: boolean
  error: string | null
  addCloned: (voice: Voice) => void
  removeCloned: (id: string) => void
  refresh: () => void
}

const VoicesContext = React.createContext<VoicesContextValue | null>(null)

export function useVoices() {
  const ctx = React.useContext(VoicesContext)
  if (!ctx) throw new Error('useVoices must be used within VoicesProvider')
  return ctx
}

export function VoicesProvider({ children }: { children: React.ReactNode }) {
  const { data: sessionData } = useSession()
  const [voices, setVoices] = React.useState<Voice[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/voices')
      if (!res.ok) throw new Error('Falha ao carregar vozes')
      const data = (await res.json()) as { voices: Voice[] }
      setVoices(data.voices ?? [])
    } catch (err) {
      setError((err as Error).message)
      setVoices(FALLBACK_VOICES)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (sessionData?.user) load()
    else setVoices([])
  }, [sessionData?.user, load])

  const addCloned = React.useCallback(
    (voice: Voice) => setVoices((prev) => [voice, ...prev]),
    [],
  )
  const removeCloned = React.useCallback(
    (id: string) => setVoices((prev) => prev.filter((v) => v.id !== id)),
    [],
  )

  const native = voices.filter((v) => v.category === 'native')
  const cloned = voices.filter((v) => v.category === 'cloned')

  const value: VoicesContextValue = {
    native,
    cloned,
    all: [...cloned, ...native],
    loading,
    error,
    addCloned,
    removeCloned,
    refresh: load,
  }

  return (
    <VoicesContext.Provider value={value}>{children}</VoicesContext.Provider>
  )
}
