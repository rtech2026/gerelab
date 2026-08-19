'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  AudioWaveform,
  Library,
  Copy,
  History,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react'
import { GereLabLogo } from '@/components/gerelab-logo'
import { useSession, signOut } from '@/lib/auth-client'
import { useCredits } from '@/components/credits-provider'

const ADMIN_EMAIL = 'contatord2023@gmail.com'

const NAV_ITEMS = [
  { href: '/', label: 'Text to Speech', icon: AudioWaveform },
  { href: '/library', label: 'Vozes', icon: Library },
  { href: '/clone', label: 'Clonagem', icon: Copy },
  { href: '/history', label: 'Histórico', icon: History },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const { charsRemaining, charLimit } = useCredits()
  const [mounted, setMounted] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL
  const dark = resolvedTheme === 'dark'

  React.useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/sign-in'
  }

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (pathname.startsWith('/admin')) return null

  const usagePercent = charLimit > 0 ? Math.min(100, Math.round(((charLimit - charsRemaining) / charLimit) * 100)) : 0

  const navCls = (active: boolean) => {
    const base = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
    const state = active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    const col = collapsed ? 'justify-center px-2' : ''
    return [base, state, col].join(' ')
  }

  const actCls = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors' + (collapsed ? ' justify-center px-2' : '')

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-4 border-b border-border/50 shrink-0">
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
          <GereLabLogo className="size-8" textClassName="text-lg" showText={!collapsed} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={navCls(isActive)}>
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
        {isAdmin && (
          <>
            <div className="my-2 h-px bg-border/50" />
            <Link href="/admin" title={collapsed ? 'Painel Admin' : undefined} className={navCls(pathname.startsWith('/admin'))}>
              <LayoutDashboard className="size-[18px] shrink-0" />
              {!collapsed && <span>Painel Admin</span>}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-border/50 px-3 py-3 space-y-3 shrink-0">
        {!collapsed && (
          <div className="rounded-lg bg-accent/50 px-3 py-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">Créditos</span>
              <span className="text-foreground font-mono">{charsRemaining.toLocaleString('pt-BR')}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-border/80 overflow-hidden">
              <div className="h-full rounded-full bg-foreground/30 transition-all duration-300" style={{ width: usagePercent + '%' }} />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{usagePercent}% utilizado · Renova mensalmente</div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-1" title={charsRemaining.toLocaleString('pt-BR') + ' créditos restantes'}>
            <div className="size-8 rounded-lg bg-accent/50 flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground">
              {Math.round(charsRemaining / 1000)}k
            </div>
          </div>
        )}
        {mounted && (
          <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} title={dark ? 'Modo claro' : 'Modo escuro'} className={actCls}>
            {dark ? <Sun className="size-[18px] shrink-0" /> : <Moon className="size-[18px] shrink-0" />}
            {!collapsed && <span>{dark ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>
        )}
        <button type="button" onClick={toggleCollapse} title={collapsed ? 'Expandir' : 'Recolher'} className={'hidden lg:flex ' + actCls}>
          {collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && <span>Recolher</span>}
        </button>
        {session?.user && (
          <div className={'flex items-center border-t border-border/50 pt-3 ' + (collapsed ? 'flex-col gap-2' : 'gap-3')}>
            <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-foreground shrink-0">
              {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{session.user.name || 'Usuário'}</div>
                <div className="text-[10px] text-muted-foreground truncate">{session.user.email}</div>
              </div>
            )}
            <button type="button" onClick={handleSignOut} title="Sair" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const sidebarWidth = collapsed ? 'w-16' : 'w-60'

  return (
    <>
      <aside className={'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border/50 bg-card/50 backdrop-blur-sm transition-[width] duration-200 ease-in-out shrink-0 z-40 ' + sidebarWidth}>
        {sidebarContent}
      </aside>
      <button type="button" onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-3 left-3 z-50 flex size-10 items-center justify-center rounded-xl bg-card border border-border/50 text-foreground shadow-lg" aria-label="Abrir menu">
        <Menu className="size-5" />
      </button>
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 shadow-2xl animate-in slide-in-from-left duration-200">
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
              <X className="size-4" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
