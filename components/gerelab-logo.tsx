'use client'

import * as React from 'react'

export function GereLabLogo({
  className = 'size-9',
  textClassName = 'text-xl',
  showText = true,
}: {
  className?: string
  textClassName?: string
  showText?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={"relative flex items-center justify-center rounded-xl bg-foreground/10 p-2 border border-border/60 shrink-0 shadow-sm " + className}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-full text-foreground"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={"font-bold tracking-tight text-foreground leading-none " + textClassName}>
            Gere<span className="text-muted-foreground font-normal">Lab</span>
          </span>
          <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground/70 mt-1">
            Voice AI
          </span>
        </div>
      )}
    </div>
  )
}
