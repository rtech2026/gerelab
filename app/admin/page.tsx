'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  KeyRound,
  History,
  Puzzle,
  Server,
  Plus,
  RefreshCw,
  Search,
  Activity,
  Layers,
  ArrowUpRight,
  Database,
  Terminal,
  Cpu,
  LogOut,
  ChevronRight,
  Shield,
  Zap,
  Mic,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
  Sliders,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react'
import {
  getAdminStats,
  getAdminUsers,
  getAdminGenerations,
  addCreditsToUser,
  setCreditsForUser,
  changeUserPlan,
  type AdminUser
} from '@/lib/admin-actions'
import { useSession, signOut } from '@/lib/auth-client'
import { GereLabLogo } from '@/components/gerelab-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const ADMIN_EMAIL = 'contatord2023@gmail.com'

type TabType = 'overview' | 'users' | 'keys' | 'logs' | 'extension'

export default function AdminPage() {
  const { data: session, isPending: sessionLoading } = useSession()
  const [activeTab, setActiveTab] = React.useState<TabType>('overview')
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  // Dados
  const [stats, setStats] = React.useState<{ totalUsers: number; totalCredits: number; totalGenerations: number }>({
    totalUsers: 0,
    totalCredits: 0,
    totalGenerations: 0,
  })
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [generations, setGenerations] = React.useState<any[]>([])
  const [lmntState, setLmntState] = React.useState<{
    priorities: string[]
    session: { status: string; generationCount: number; lastSession?: string }
    keys: { id: string; name: string; key: string; isMaster?: boolean; requestCount?: number }[]
    currentKeyIndex: number
  }>({
    priorities: ['playground', 'api_pool', 'edge_tts'],
    session: { status: 'none', generationCount: 0 },
    keys: [],
    currentKeyIndex: 0,
  })

  // Filtros e Formulários
  const [userSearch, setUserSearch] = React.useState('')
  const [planFilter, setPlanFilter] = React.useState<'ALL' | 'FREE' | 'PRO' | 'ENTERPRISE'>('ALL')
  const [newKeyName, setNewKeyName] = React.useState('')
  const [newKeyValue, setNewKeyValue] = React.useState('')
  const [copiedExtension, setCopiedExtension] = React.useState(false)
  const [toastMsg, setToastMsg] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const loadData = async () => {
    try {
      setRefreshing(true)
      const [sRes, uRes, gRes, lRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminGenerations(50),
        fetch('/api/admin/lmnt-session').then((r) => r.json()),
      ])

      if (sRes.success && sRes.stats) setStats(sRes.stats)
      if (uRes.success && Array.isArray(uRes.users)) setUsers(uRes.users)
      if (gRes.success && Array.isArray(gRes.generations)) setGenerations(gRes.generations)
      if (lRes.success && lRes.state) setLmntState(lRes.state)
    } catch (err) {
      console.error('Erro ao carregar dados do painel:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  // Modificar créditos de usuário
  const handleAddCredits = async (userId: string, amount: number) => {
    const res = await addCreditsToUser(userId, amount)
    if (res.success) {
      showToast(`+${amount.toLocaleString('pt-BR')} caracteres adicionados com sucesso!`)
      loadData()
    } else {
      alert(res.error || 'Erro ao adicionar caracteres')
    }
  }

  const handleSetCredits = async (userId: string, currentAmount: number) => {
    const raw = prompt('Digite o saldo total exato de caracteres para este usuário:', String(currentAmount))
    if (!raw) return
    const amount = parseInt(raw, 10)
    if (isNaN(amount) || amount < 0) return alert('Valor inválido!')
    const res = await setCreditsForUser(userId, amount)
    if (res.success) {
      showToast(`Saldo atualizado para ${amount.toLocaleString('pt-BR')} caracteres!`)
      loadData()
    } else {
      alert(res.error || 'Erro ao definir saldo')
    }
  }

  const handleChangePlan = async (userId: string, plan: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    const res = await changeUserPlan(userId, plan)
    if (res.success) {
      showToast(`Plano alterado para ${plan}!`)
      loadData()
    } else {
      alert(res.error || 'Erro ao alterar plano')
    }
  }

  // Chaves do Pool
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyValue.trim()) return
    const res = await fetch('/api/admin/lmnt-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_key', name: newKeyName.trim() || 'Chave LMNT', key: newKeyValue.trim() }),
    })
    const json = await res.json()
    if (json.success) {
      setNewKeyName('')
      setNewKeyValue('')
      showToast('Chave adicionada ao Pool com sucesso!')
      loadData()
    } else {
      alert(json.error || 'Erro ao cadastrar chave')
    }
  }

  const handleRemoveKey = async (keyId: string) => {
    if (!confirm('Tem certeza que deseja remover esta chave do pool?')) return
    const res = await fetch('/api/admin/lmnt-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_key', keyId }),
    })
    const json = await res.json()
    if (json.success) {
      showToast('Chave removida do pool!')
      loadData()
    } else {
      alert(json.error || 'Erro ao remover chave')
    }
  }

  // Filtragem de Usuários
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(userSearch.toLowerCase())
    const matchPlan = planFilter === 'ALL' || u.plan === planFilter
    return matchSearch && matchPlan
  })

  // Verificação de Acesso Admin
  const isMasterAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL

  if (sessionLoading || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#090a0c] text-zinc-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Carregando painel executivo GereLab...</span>
        </div>
      </div>
    )
  }

  if (!session?.user || !isMasterAdmin) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090a0c] px-4 text-center text-zinc-100">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-950/20 p-8">
          <Lock className="mx-auto mb-4 size-12 text-red-400" />
          <h2 className="text-xl font-bold">Acesso Restrito ao Administrador</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Você está conectado como <strong className="text-zinc-200">{session?.user?.email || 'Visitante'}</strong>.
            Esta área é exclusiva para a conta mestre ({ADMIN_EMAIL}).
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/sign-in">
              <Button variant="outline" className="border-white/10 text-xs">Trocar de Conta</Button>
            </Link>
            <Link href="/">
              <Button className="bg-white text-xs font-semibold text-black hover:bg-zinc-200">Voltar ao Estúdio</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#090a0c] font-sans text-zinc-100 antialiased selection:bg-emerald-500/20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#121417]/95 px-4 py-3 text-xs font-semibold text-emerald-400 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <Check className="size-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* BARRA LATERAL (SIDEBAR) PROFISSIONAL (Estilo InsightX / Stovest) */}
      {/* ========================================================= */}
      <aside className="sticky top-0 flex h-screen w-72 flex-col justify-between border-r border-white/[0.08] bg-[#0d0e11] p-5">
        <div>
          {/* Logo & Marca */}
          <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
              <GereLabLogo />
            </Link>
            <Badge className="border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-emerald-400">
              CORE ADMIN
            </Badge>
          </div>

          {/* Navegação Principal */}
          <div className="mt-6 space-y-6">
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Menu Principal
              </p>
              <nav className="mt-2.5 space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-white text-black shadow-lg shadow-white/5'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Activity className={`size-4 ${activeTab === 'overview' ? 'text-black' : 'text-zinc-400'}`} />
                    <span>Visão Geral</span>
                  </div>
                  <ChevronRight className={`size-3.5 opacity-40 transition group-hover:translate-x-0.5 ${activeTab === 'overview' ? 'text-black' : ''}`} />
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    activeTab === 'users'
                      ? 'bg-white text-black shadow-lg shadow-white/5'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className={`size-4 ${activeTab === 'users' ? 'text-black' : 'text-zinc-400'}`} />
                    <span>Usuários & Saldos</span>
                  </div>
                  <Badge className={`border-0 px-2 py-0.2 text-[10px] font-mono ${activeTab === 'users' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-zinc-400'}`}>
                    {users.length}
                  </Badge>
                </button>

                <button
                  onClick={() => setActiveTab('keys')}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    activeTab === 'keys'
                      ? 'bg-white text-black shadow-lg shadow-white/5'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <KeyRound className={`size-4 ${activeTab === 'keys' ? 'text-black' : 'text-zinc-400'}`} />
                    <span>Motores & Chaves IA</span>
                  </div>
                  <Badge className={`border-0 px-2 py-0.2 text-[10px] font-mono ${activeTab === 'keys' ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-zinc-400'}`}>
                    {lmntState.keys.length + 1}
                  </Badge>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    activeTab === 'logs'
                      ? 'bg-white text-black shadow-lg shadow-white/5'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <History className={`size-4 ${activeTab === 'logs' ? 'text-black' : 'text-zinc-400'}`} />
                    <span>Auditoria de Vozes</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('extension')}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    activeTab === 'extension'
                      ? 'bg-white text-black shadow-lg shadow-white/5'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Puzzle className={`size-4 ${activeTab === 'extension' ? 'text-black' : 'text-zinc-400'}`} />
                    <span>Extensão Chrome</span>
                  </div>
                </button>
              </nav>
            </div>

            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Acesso Rápido
              </p>
              <div className="mt-2.5 space-y-1">
                <Link
                  href="/"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    <Mic className="size-4 text-emerald-400" />
                    <span>Abrir Estúdio de Voz</span>
                  </div>
                  <ExternalLink className="size-3.5 opacity-50" />
                </Link>
                <Link
                  href="/library"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    <Database className="size-4 text-sky-400" />
                    <span>Biblioteca de Vozes</span>
                  </div>
                  <ExternalLink className="size-3.5 opacity-50" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé da Sidebar - Perfil do Admin */}
        <div className="border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 text-xs font-bold text-emerald-300 border border-white/10">
                GL
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-bold text-zinc-200">Administrador Master</p>
                <p className="truncate text-[10px] font-mono text-zinc-500">{ADMIN_EMAIL}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut()
                window.location.href = '/sign-in'
              }}
              title="Encerrar Sessão"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* ÁREA DE CONTEÚDO PRINCIPAL (HEADER + CARDS ESPAÇOSOS) */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Superior do Painel */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#090a0c]/90 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {activeTab === 'overview' && 'Painel de Controle Executivo'}
              {activeTab === 'users' && 'Gerenciamento de Usuários & Saldos'}
              {activeTab === 'keys' && 'Arquitetura de Motores & Pool de Chaves'}
              {activeTab === 'logs' && 'Auditoria de Gerações de Voz'}
              {activeTab === 'extension' && 'Instalação da Extensão Chrome'}
            </h1>
            <p className="text-xs text-zinc-400">
              {activeTab === 'overview' && 'Monitore a capacidade do pool, volume de áudios e saúde dos motores neurais.'}
              {activeTab === 'users' && 'Controle e adicione caracteres, altere planos e gerencie limites de consumo.'}
              {activeTab === 'keys' && 'Rotacione credenciais LMNT e configure a prioridade dos nós de síntese.'}
              {activeTab === 'logs' && 'Registro detalhado de sínteses realizadas em tempo real.'}
              {activeTab === 'extension' && 'Sincronização de credenciais para síntese em modo Playground Bypass.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Status do Servidor */}
            <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 md:flex">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Motores Online (100%)</span>
            </div>

            {/* Botão de Atualizar */}
            <Button
              onClick={loadData}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-xl border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Sincronizando...' : 'Atualizar'}</span>
            </Button>
          </div>
        </header>

        {/* Corpo da Página */}
        <div className="p-8 space-y-8 max-w-7xl">
          {/* ========================================================= */}
          {/* ABA 1: VISÃO GERAL (DASHBOARD) */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* 4 Cards de Métricas GRANDES (Padrão InsightX) */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total de Caracteres */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111216] p-6 transition hover:border-emerald-500/40">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Saldo Total de Usuários</span>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="size-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-3xl font-extrabold tracking-tight text-white">
                      {stats.totalCredits.toLocaleString('pt-BR')}
                    </div>
                    <p className="mt-1 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <span>✦ Caracteres alocados</span>
                    </p>
                  </div>
                </div>

                {/* Usuários Ativos */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111216] p-6 transition hover:border-sky-500/40">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Usuários Registrados</span>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                      <Users className="size-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-3xl font-extrabold tracking-tight text-white">
                      {stats.totalUsers}
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      Cadastrados no banco de dados
                    </p>
                  </div>
                </div>

                {/* Total de Gerações */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111216] p-6 transition hover:border-purple-500/40">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sínteses de Voz</span>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <Mic className="size-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-3xl font-extrabold tracking-tight text-white">
                      {stats.totalGenerations.toLocaleString('pt-BR')}
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      Áudios processados no histórico
                    </p>
                  </div>
                </div>

                {/* Status do Pipeline */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111216] p-6 transition hover:border-amber-500/40">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Capacidade do Pool</span>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <Server className="size-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-3xl font-extrabold tracking-tight text-white">
                      3 Motores
                    </div>
                    <p className="mt-1 text-xs text-emerald-400 font-semibold">
                      Playground + Pool + EdgeTTS
                    </p>
                  </div>
                </div>
              </div>

              {/* Arquitetura dos Motores de IA */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#111216] p-7">
                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-bold text-white">Fluxo da Arquitetura de Voz (Failover Inteligente)</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      GereLab direciona as requisições em cascata para garantir zero falhas e custo zero com a melhor qualidade.
                    </p>
                  </div>
                  <Badge className="border-emerald-500/30 bg-emerald-950/40 text-xs font-semibold text-emerald-400">
                    ROTEAMENTO AUTOMÁTICO
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Camada 1 */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-[#16181e] p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-emerald-400">NÓ 1 • PRIORITÁRIO</span>
                      <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-white">LMNT Playground Bypass</h4>
                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                      Sintetiza vozes ultrarrealistas através da sessão sincronizada pela extensão Chrome sem gastar cota de API paga.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="border-white/10 bg-white/[0.04] text-[10px] font-mono text-zinc-300">
                        {lmntState.session.status === 'active' ? '🟢 SESSÃO ATIVA' : '⚪ AGUARDANDO SESSÃO'}
                      </Badge>
                    </div>
                  </div>

                  {/* Camada 2 */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#16181e] p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-sky-400">NÓ 2 • BALANCEAMENTO</span>
                      <span className="size-2 rounded-full bg-sky-400" />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-white">Pool de Chaves LMNT</h4>
                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                      Rotação inteligente Round-Robin entre múltiplas chaves oficiais para evitar bloqueios e rate limit.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="border-white/10 bg-white/[0.04] text-[10px] font-mono text-zinc-300">
                        {lmntState.keys.length} CHAVE(S) CADASTRADA(S)
                      </Badge>
                    </div>
                  </div>

                  {/* Camada 3 */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#16181e] p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-amber-400">NÓ 3 • ALTA DISPONIBILIDADE</span>
                      <span className="size-2 rounded-full bg-amber-400" />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-white">Microsoft Edge TTS</h4>
                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                      Fallback de emergência sem limites de caracteres com mais de 300 vozes neurais e alta velocidade.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge className="border-white/10 bg-white/[0.04] text-[10px] font-mono text-zinc-300">
                        ILIMITADO • 100% DISPONÍVEL
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2: USUÁRIOS & SALDOS (GERENCIADOR ESPAÇOSO E CLARO) */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Barra de Filtros e Busca */}
              <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-[#111216] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome, email ou ID do usuário..."
                    className="h-11 rounded-2xl border-white/10 bg-[#0d0e11] pl-11 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-white/30"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400 mr-1">Filtrar Plano:</span>
                  {(['ALL', 'FREE', 'PRO', 'ENTERPRISE'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlanFilter(p)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                        planFilter === p
                          ? 'bg-white text-black font-bold'
                          : 'border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {p === 'ALL' ? 'Todos' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista Espaçosa de Usuários */}
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="rounded-3xl border border-white/[0.08] bg-[#111216] p-12 text-center text-zinc-400">
                    <Users className="mx-auto size-10 opacity-30" />
                    <p className="mt-3 text-sm font-semibold">Nenhum usuário encontrado</p>
                    <p className="mt-1 text-xs text-zinc-500">Tente ajustar seus termos de busca.</p>
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="group rounded-3xl border border-white/[0.08] bg-[#111216] p-6 transition hover:border-white/20"
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Identificação do Usuário */}
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-700 text-sm font-bold text-white border border-white/10 shadow-inner">
                            {(u.name || u.email || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h4 className="text-sm font-bold text-white">{u.name || 'Sem Nome'}</h4>
                              <Badge
                                className={`border-0 px-2.5 py-0.5 text-[10px] font-bold ${
                                  u.plan === 'ENTERPRISE'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : u.plan === 'PRO'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                {u.plan}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-400 font-mono">{u.email}</p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">ID: {u.id}</p>
                          </div>
                        </div>

                        {/* Barra de Saldo / Créditos */}
                        <div className="w-full lg:w-72">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-zinc-400">Saldo Disponível:</span>
                            <span className="font-mono text-emerald-400 text-sm font-bold">
                              {u.credits.toLocaleString('pt-BR')} <span className="text-[11px] font-normal text-zinc-500">chars</span>
                            </span>
                          </div>
                          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(5, (u.credits / 100000) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Botões Rápidos de Ação */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => handleAddCredits(u.id, 10000)}
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-200 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40"
                          >
                            +10k
                          </Button>
                          <Button
                            onClick={() => handleAddCredits(u.id, 50000)}
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-200 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40"
                          >
                            +50k
                          </Button>
                          <Button
                            onClick={() => handleAddCredits(u.id, 100000)}
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-200 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40"
                          >
                            +100k
                          </Button>
                          <Button
                            onClick={() => handleSetCredits(u.id, u.credits)}
                            size="sm"
                            className="h-9 rounded-xl bg-white text-xs font-bold text-black hover:bg-zinc-200"
                          >
                            Definir Saldo
                          </Button>

                          {/* Seletor de Plano Rápido */}
                          <div className="ml-2 flex rounded-xl border border-white/10 bg-black/40 p-0.5">
                            {(['FREE', 'PRO', 'ENTERPRISE'] as const).map((p) => (
                              <button
                                key={p}
                                onClick={() => handleChangePlan(u.id, p)}
                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                  u.plan === p
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: MOTORES DE IA & POOL DE CHAVES */}
          {/* ========================================================= */}
          {activeTab === 'keys' && (
            <div className="space-y-8">
              {/* Card Adicionar Chave */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#111216] p-7">
                <h3 className="text-base font-bold text-white">Adicionar Nova Chave LMNT ao Pool</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Chaves adicionadas aqui são distribuídas de forma transparente em todas as requisições de síntese.
                </p>

                <form onSubmit={handleAddKey} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Identificador (ex: Chave Secundária 01)"
                      className="h-11 rounded-2xl border-white/10 bg-[#0d0e11] text-xs text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <Input
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="Cole a chave de API (ex: ak_nhWTGWch6HY...)"
                      type="password"
                      className="h-11 rounded-2xl border-white/10 bg-[#0d0e11] text-xs text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" className="h-11 w-full rounded-2xl bg-white text-xs font-bold text-black hover:bg-zinc-200">
                      <Plus className="mr-1.5 size-4" /> Cadastrar
                    </Button>
                  </div>
                </form>
              </div>

              {/* Lista de Chaves Ativas */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#111216] p-7">
                <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-bold text-white">Chaves Cadastradas no Pool Round-Robin</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">O sistema distribui a carga igualmente entre as chaves abaixo.</p>
                  </div>
                  <Badge className="border-white/10 bg-white/[0.04] text-xs font-mono text-zinc-300">
                    {lmntState.keys.length} Chaves
                  </Badge>
                </div>

                <div className="mt-5 space-y-3">
                  {lmntState.keys.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4">Nenhuma chave cadastrada no pool dinâmico.</p>
                  ) : (
                    lmntState.keys.map((k, idx) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#16181e] p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] text-xs font-mono font-bold text-emerald-400 border border-white/10">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{k.name}</h4>
                              {k.isMaster && (
                                <Badge className="border-0 bg-emerald-500/20 text-[10px] text-emerald-300">MASTER</Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] font-mono text-zinc-400">
                              Chave: ••••••••••••••••{k.key ? k.key.substring(k.key.length - 6) : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 font-mono">
                            {k.requestCount || 0} requisições
                          </span>
                          {!k.isMaster && (
                            <Button
                              onClick={() => handleRemoveKey(k.id)}
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 4: AUDITORIA DE GERAÇÕES */}
          {/* ========================================================= */}
          {activeTab === 'logs' && (
            <div className="rounded-3xl border border-white/[0.08] bg-[#111216] p-7">
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-base font-bold text-white">Histórico de Sínteses Realizadas</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Últimas 50 gerações processadas pelo ecossistema GereLab.</p>
                </div>
                <Badge className="border-white/10 bg-white/[0.04] text-xs font-mono text-zinc-300">
                  {generations.length} Registros
                </Badge>
              </div>

              <div className="mt-6 divide-y divide-white/[0.04]">
                {generations.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma geração registrada ainda.</p>
                ) : (
                  generations.map((g) => (
                    <div key={g.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-300 border border-white/10">
                          <Mic className="size-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{g.voiceName || 'Voz Padrão'}</span>
                            <Badge className="border-0 bg-white/[0.06] text-[10px] font-mono text-zinc-400">
                              {g.voiceId || 'lmnt'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 max-w-lg truncate text-xs text-zinc-400">{g.textPrompt || 'Síntese de texto'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-bold font-mono text-white">
                            {g.characterCount || 0} <span className="text-[10px] text-zinc-500">chars</span>
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {g.createdAt ? new Date(g.createdAt).toLocaleTimeString('pt-BR') : 'Hoje'}
                          </p>
                        </div>
                        <Badge className="border-0 bg-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                          CONCLUÍDO
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 5: EXTENSÃO CHROME */}
          {/* ========================================================= */}
          {activeTab === 'extension' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/[0.08] bg-[#111216] p-8">
                <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Puzzle className="size-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Extensão Chrome GereLab Sync</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      A extensão captura tokens de sessão do navegador para alimentar o motor Playground Bypass.
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#16181e] p-6">
                    <span className="text-xs font-bold text-zinc-300">Passo a Passo de Instalação (Sem Compilação):</span>
                    <ol className="mt-4 space-y-3 text-xs text-zinc-400 list-decimal list-inside leading-relaxed">
                      <li>Abra o navegador Google Chrome e acesse <strong className="text-zinc-200">chrome://extensions</strong>.</li>
                      <li>Ative a chave <strong className="text-emerald-400">Modo do desenvolvedor</strong> no canto superior direito.</li>
                      <li>Clique no botão <strong className="text-zinc-200">Carregar sem compactação</strong>.</li>
                      <li>Selecione a pasta da extensão no caminho abaixo:</li>
                    </ol>

                    <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-[#0d0e11] p-3.5">
                      <code className="text-xs font-mono text-emerald-300 truncate">
                        C:\Users\User\Desktop\gerelab\public\extension
                      </code>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText('C:\\Users\\User\\Desktop\\gerelab\\public\\extension')
                          setCopiedExtension(true)
                          showToast('Caminho copiado para a área de transferência!')
                          setTimeout(() => setCopiedExtension(false), 3000)
                        }}
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-lg border-white/10 bg-white/[0.05] text-xs text-zinc-200 hover:bg-white/10"
                      >
                        {copiedExtension ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                        <span>{copiedExtension ? 'Copiado!' : 'Copiar Caminho'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
