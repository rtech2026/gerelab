'use client'

import * as React from 'react'
import { AudioDock } from '@/components/player/audio-dock'

export type Track = {
  id: string
  title: string
  voiceName: string
  url: string
  createdAt: number
  engine: string
  chars: number
}

type PlayerState = {
  current: Track | null
  history: Track[]
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
}

type PlayerContextValue = PlayerState & {
  loadAndPlay: (track: Track) => void
  togglePlay: () => void
  seek: (time: number) => void
  setVolume: (v: number) => void
  setPlaybackRate: (r: number) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  audioEl: HTMLAudioElement | null
}

const PlayerContext = React.createContext<PlayerContextValue | null>(null)

export function usePlayer() {
  const ctx = React.useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [current, setCurrent] = React.useState<Track | null>(null)
  const [history, setHistory] = React.useState<Track[]>([])
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolumeState] = React.useState(1)
  const [playbackRate, setPlaybackRateState] = React.useState(1)

  React.useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration || 0)
    const onEnded = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  const loadAndPlay = React.useCallback((track: Track) => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = track.url
    audio.playbackRate = playbackRateRef.current
    audio.volume = volumeRef.current
    audio.currentTime = 0
    void audio.play().catch(() => {})
    setCurrent(track)
    setHistory((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev
      return [track, ...prev].slice(0, 50)
    })
  }, [])

  // refs to avoid stale closures inside loadAndPlay
  const playbackRateRef = React.useRef(playbackRate)
  const volumeRef = React.useRef(volume)
  React.useEffect(() => {
    playbackRateRef.current = playbackRate
  }, [playbackRate])
  React.useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (audio.paused) void audio.play().catch(() => {})
    else audio.pause()
  }, [current])

  const seek = React.useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const setVolume = React.useCallback((v: number) => {
    setVolumeState(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const setPlaybackRate = React.useCallback((r: number) => {
    setPlaybackRateState(r)
    if (audioRef.current) audioRef.current.playbackRate = r
  }, [])

  const removeFromHistory = React.useCallback((id: string) => {
    setHistory((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearHistory = React.useCallback(() => setHistory([]), [])

  const value: PlayerContextValue = {
    current,
    history,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    loadAndPlay,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    removeFromHistory,
    clearHistory,
    audioEl: audioRef.current,
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <AudioDock />
    </PlayerContext.Provider>
  )
}
