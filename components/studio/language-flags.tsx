'use client'

import * as React from 'react'

export function FlagIcon({ code, className = 'size-4' }: { code: string; className?: string }) {
  const norm = (code || '').toLowerCase()

  if (norm === 'auto' || norm === 'globe') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    )
  }

  // Circular flags with pure SVG vector shapes
  if (norm === 'br' || norm === 'pt-br') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#009c3b" />
        <polygon points="16,5 28,16 16,27 4,16" fill="#ffdf00" />
        <circle cx="16" cy="16" r="6" fill="#002776" />
        <path d="M10.5 16 A 6 6 0 0 0 21.5 16" stroke="#ffffff" strokeWidth="1.2" fill="none" />
      </svg>
    )
  }

  if (norm === 'pt' || norm === 'pt-pt') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="pt-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#pt-clip)">
          <rect width="13" height="32" fill="#046A38" />
          <rect x="13" width="19" height="32" fill="#DA291C" />
          <circle cx="13" cy="16" r="5" fill="#FFC72C" />
          <circle cx="13" cy="16" r="3" fill="#003399" />
        </g>
      </svg>
    )
  }

  if (norm === 'us' || norm === 'en-us' || norm === 'en') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="us-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#us-clip)">
          <rect width="32" height="32" fill="#b22234" />
          <path d="M0 4.5h32M0 9.5h32M0 14.5h32M0 19.5h32M0 24.5h32M0 29.5h32" stroke="#ffffff" strokeWidth="2.5" />
          <rect width="15" height="15" fill="#3c3b6e" />
          <circle cx="4" cy="4" r="1" fill="#fff" />
          <circle cx="8" cy="4" r="1" fill="#fff" />
          <circle cx="12" cy="4" r="1" fill="#fff" />
          <circle cx="6" cy="8" r="1" fill="#fff" />
          <circle cx="10" cy="8" r="1" fill="#fff" />
          <circle cx="4" cy="12" r="1" fill="#fff" />
          <circle cx="8" cy="12" r="1" fill="#fff" />
          <circle cx="12" cy="12" r="1" fill="#fff" />
        </g>
      </svg>
    )
  }

  if (norm === 'uk' || norm === 'gb' || norm === 'en-gb') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="uk-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#uk-clip)">
          <rect width="32" height="32" fill="#012169" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#ffffff" strokeWidth="5" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#c8102e" strokeWidth="2.5" />
          <path d="M16 0 v32 M0 16 h32" stroke="#ffffff" strokeWidth="8" />
          <path d="M16 0 v32 M0 16 h32" stroke="#c8102e" strokeWidth="4.5" />
        </g>
      </svg>
    )
  }

  if (norm === 'es' || norm === 'es-es') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="es-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#es-clip)">
          <rect width="32" height="32" fill="#AA151B" />
          <rect y="8" width="32" height="16" fill="#F1BF00" />
          <circle cx="9" cy="16" r="3" fill="#AA151B" />
        </g>
      </svg>
    )
  }

  if (norm === 'fr' || norm === 'fr-fr') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="fr-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#fr-clip)">
          <rect width="11" height="32" fill="#0055A4" />
          <rect x="11" width="10" height="32" fill="#FFFFFF" />
          <rect x="21" width="11" height="32" fill="#EF4135" />
        </g>
      </svg>
    )
  }

  if (norm === 'de' || norm === 'de-de') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="de-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#de-clip)">
          <rect width="32" height="11" fill="#000000" />
          <rect y="11" width="32" height="10" fill="#DD0000" />
          <rect y="21" width="32" height="11" fill="#FFCE00" />
        </g>
      </svg>
    )
  }

  if (norm === 'it' || norm === 'it-it') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="it-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#it-clip)">
          <rect width="11" height="32" fill="#009246" />
          <rect x="11" width="10" height="32" fill="#FFFFFF" />
          <rect x="21" width="11" height="32" fill="#CE2B37" />
        </g>
      </svg>
    )
  }

  if (norm === 'cn' || norm === 'zh') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#de2910" />
        <polygon points="8,7 9.5,11.5 6,8.5 10,8.5 6.5,11.5" fill="#ffde00" />
      </svg>
    )
  }

  if (norm === 'jp' || norm === 'ja') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx="16" cy="16" r="6.5" fill="#bc002d" />
      </svg>
    )
  }

  if (norm === 'kr' || norm === 'ko') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx="16" cy="16" r="6" fill="#c60c30" />
        <path d="M10 16 A 6 6 0 0 0 22 16" fill="#003478" />
      </svg>
    )
  }

  if (norm === 'in' || norm === 'hi') {
    return (
      <svg className={className} viewBox="0 0 32 32">
        <clipPath id="in-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
        <g clipPath="url(#in-clip)">
          <rect width="32" height="11" fill="#FF9933" />
          <rect y="11" width="32" height="10" fill="#FFFFFF" />
          <rect y="21" width="32" height="11" fill="#128807" />
          <circle cx="16" cy="16" r="3" fill="#000080" />
        </g>
      </svg>
    )
  }

  // Fallback icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  )
}
