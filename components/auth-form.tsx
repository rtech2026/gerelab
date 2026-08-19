'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AudioWaveform, ArrowRight, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { signIn, signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const isSignUp = mode === 'sign-up'
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pending, setPending] = React.useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const result = isSignUp
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password })
    setPending(false)

    if (result.error) {
      toast.error('Não foi possível concluir. Verifique seus dados e tente novamente.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <AudioWaveform className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">AuraVoice</span>
        </div>
        <div className="relative z-10 max-w-xl">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.3em] text-brand">voz neural para criadores</p>
          <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.04em] xl:text-7xl">
            Dê uma voz marcante às suas ideias.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-background/65">
            Síntese realista, clonagem responsável e controle de estúdio em um só lugar.
          </p>
        </div>
        <p className="relative z-10 text-xs text-background/45">Plano gratuito incluso · 15.000 caracteres por ciclo</p>
        <div className="pointer-events-none absolute -right-20 top-1/2 size-96 -translate-y-1/2 rounded-full border border-background/10" />
        <div className="pointer-events-none absolute -right-4 top-1/2 size-64 -translate-y-1/2 rounded-full border border-brand/35" />
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background"><AudioWaveform className="size-4" /></span>
            <span className="font-semibold">AuraVoice</span>
          </div>
          <div className="mb-8">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-brand">{isSignUp ? 'comece agora' : 'bem-vindo de volta'}</p>
            <h2 className="text-3xl font-semibold tracking-tight">{isSignUp ? 'Crie sua conta' : 'Entre no seu estúdio'}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{isSignUp ? 'Seu plano gratuito já vem pronto para começar.' : 'Acesse suas vozes, projetos e histórico.'}</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {isSignUp && <label className="flex flex-col gap-2 text-sm font-medium">Nome<Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" autoComplete="name" /></label>}
            <label className="flex flex-col gap-2 text-sm font-medium">E-mail<Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Senha<Input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={isSignUp ? 'new-password' : 'current-password'} /></label>
            <Button className="mt-3 h-11 w-full" disabled={pending} type="submit">
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <>{isSignUp ? 'Criar conta' : 'Entrar'}<ArrowRight data-icon="inline-end" /></>}
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <Link className="font-medium text-foreground underline underline-offset-4" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Entrar' : 'Criar conta'}</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
