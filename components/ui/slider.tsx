'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps {
  value?: number[] | number
  defaultValue?: number[] | number
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[] | number) => void
  className?: string
  disabled?: boolean
}

export function Slider({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
  disabled = false,
}: SliderProps) {
  const resolveNum = (v: any) => {
    if (Array.isArray(v)) return v[0] ?? min
    if (typeof v === 'number') return v
    return min
  }

  const isControlled = value !== undefined
  const [internalVal, setInternalVal] = React.useState<number>(resolveNum(defaultValue))

  const currentVal = isControlled ? resolveNum(value) : internalVal
  const percentage = Math.min(Math.max(((currentVal - min) / (max - min)) * 100, 0), 100)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value)
    if (!isControlled) {
      setInternalVal(num)
    }
    if (onValueChange) {
      onValueChange([num])
    }
  }

  return (
    <div className={cn('relative flex w-full touch-none select-none items-center py-2', className)}>
      <div className="relative w-full h-2 rounded-full bg-zinc-800/90 overflow-hidden cursor-pointer">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-[width] duration-75"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentVal}
        disabled={disabled}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />
      {/* Thumb Visual */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full bg-white border-2 border-emerald-500 shadow-md shadow-emerald-500/20 pointer-events-none transition-[left] duration-75"
        style={{ left: `${percentage}%` }}
      />
    </div>
  )
}
