'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'pt-BR' | 'en'

const translations: Record<Language, any> = {
  'pt-BR': {
    nav: {
      studio: 'Estúdio',
      library: 'Biblioteca de Vozes',
      clone: 'Clonar Voz',
      history: 'Histórico',
      pricing: 'Planos & Créditos',
      admin: 'Painel Admin',
    },
    auth: {
      heroSubtitle: 'VOZ NEURAL ULTRA-REALISTA',
      heroTitle: 'Dê uma voz marcante às suas ideias.',
      heroDesc: 'Síntese realista, clonagem ultra-rápida e bypass de alta fidelidade em um só lugar.',
      footerNote: 'Acesso liberado · Tecnologia Neural LMNT + EdgeTTS',
      getStarted: 'comece agora',
      welcomeBack: 'bem-vindo de volta',
      signUpTitle: 'Crie sua conta',
      signInTitle: 'Entre no seu estúdio',
      signUpDesc: 'Seu plano gratuito já vem pronto para começar.',
      signInDesc: 'Acesse suas vozes, projetos e histórico.',
      nameLabel: 'Nome',
      namePlaceholder: 'Seu nome',
      emailLabel: 'E-mail',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Mínimo de 6 caracteres',
      createAccountBtn: 'Criar conta',
      loginBtn: 'Entrar',
      alreadyHaveAccount: 'Já tem uma conta?',
      noAccount: 'Ainda não tem uma conta?',
      loginLink: 'Entrar',
      signUpLink: 'Criar conta',
      errorDesc: 'Não foi possível concluir. Verifique seus dados e tente novamente.',
      success: 'Login efetuado com sucesso!',
    },
    header: {
      chars: 'créditos',
      settings: 'Configurações',
      apiKey: 'Configurar API Key',
      logout: 'Sair',
    },
    studio: {
      title: 'Estúdio de Voz Neural',
      subtitle: 'Converta qualquer texto em voz ultra-realista com controle de estúdio e emoção.',
      placeholder: 'Digite ou cole seu texto aqui para sintetizar em áudio...',
      enhance: 'Aprimorar pontuação',
      insertPause: 'Inserir pausa',
      clear: 'Limpar',
      voice: 'Voz Selecionada',
      language: 'Idioma',
      format: 'Formato',
      expressiveness: 'Expressividade',
      stability: 'Estabilidade',
      generate: 'Gerar áudio',
      cost: 'Custo',
      remaining: 'restam',
      plan: 'Plano',
      creditsRemaining: 'Créditos restantes',
    },
    library: {
      title: 'Biblioteca de Vozes',
      subtitle: 'Explore vozes neurais profissionais de alta fidelidade para narrações, vídeos e dublagem.',
      search: 'Buscar vozes por nome, idioma ou estilo...',
      all: 'Todas',
      native: 'Nativas',
      cloned: 'Clonadas',
      useVoice: 'Usar voz no Estúdio',
    },
    clone: {
      title: 'Clonagem Instantânea de Voz',
      subtitle: 'Envie um áudio limpo de 10 a 60 segundos para criar um clone de voz com IA.',
      voiceName: 'Nome da Voz',
      uploadAudio: 'Enviar arquivo de áudio (MP3, WAV, M4A)',
      recordAudio: 'Gravar pelo microfone',
      submit: 'Criar Clone de Voz',
    },
    pricing: {
      title: 'Planos e Pacotes de Créditos',
      subtitle: 'Escolha o plano ideal para seus projetos de áudio e narrações com IA.',
      freePlan: 'Gratuito',
      creatorPlan: 'Criador',
      proPlan: 'Profissional',
      unlimitedPlan: 'Ilimitado',
      subscribe: 'Assinar Plano',
      recharge: 'Comprar Recarga',
    },
  },
  'en': {
    nav: {
      studio: 'Studio',
      library: 'Voice Library',
      clone: 'Clone Voice',
      history: 'History',
      pricing: 'Pricing',
      admin: 'Admin Panel',
    },
    auth: {
      heroSubtitle: 'ULTRA-REALISTIC NEURAL VOICE',
      heroTitle: 'Bring your ideas to life with voice.',
      heroDesc: 'Realistic synthesis, fast cloning, and high fidelity bypass in one place.',
      footerNote: 'Access granted · LMNT + EdgeTTS Neural Technology',
      getStarted: 'get started',
      welcomeBack: 'welcome back',
      signUpTitle: 'Create your account',
      signInTitle: 'Enter your studio',
      signUpDesc: 'Your free plan is ready to start.',
      signInDesc: 'Access your voices, projects, and history.',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimum 6 characters',
      createAccountBtn: 'Create account',
      loginBtn: 'Sign in',
      alreadyHaveAccount: 'Already have an account?',
      noAccount: "Don't have an account?",
      loginLink: 'Sign in',
      signUpLink: 'Create account',
      errorDesc: 'Could not complete. Check your info and try again.',
      success: 'Logged in successfully!',
    },
    header: {
      chars: 'chars',
      settings: 'Settings',
      apiKey: 'Configure API Key',
      logout: 'Sign out',
    },
    studio: {
      title: 'Studio',
      subtitle: 'Convert text into realistic neural voice with studio control.',
      placeholder: 'Enter or paste your text here to synthesize into speech...',
      enhance: 'Enhance punctuation',
      insertPause: 'Insert pause',
      clear: 'Clear',
      voice: 'Voice',
      language: 'Language',
      format: 'Format',
      expressiveness: 'Expressiveness',
      stability: 'Stability',
      generate: 'Generate audio',
      cost: 'Cost',
      remaining: 'remaining',
      plan: 'Plan',
      creditsRemaining: 'Credits remaining',
    },
    library: {
      title: 'Voice Library',
      subtitle: 'Explore high-fidelity neural voices for narrations, videos, and dubbing.',
      search: 'Search voices by name, language or style...',
      all: 'All',
      native: 'Native',
      cloned: 'Cloned',
      useVoice: 'Use in Studio',
    },
    clone: {
      title: 'Instant Voice Cloning',
      subtitle: 'Upload a clean 10 to 60-second audio to create an AI voice clone.',
      voiceName: 'Voice Name',
      uploadAudio: 'Upload audio file (MP3, WAV, M4A)',
      recordAudio: 'Record with microphone',
      submit: 'Create Voice Clone',
    },
    pricing: {
      title: 'Pricing & Credit Packages',
      subtitle: 'Choose the best plan for your AI audio and narration projects.',
      freePlan: 'Free',
      creatorPlan: 'Creator',
      proPlan: 'Professional',
      unlimitedPlan: 'Unlimited',
      subscribe: 'Subscribe',
      recharge: 'Buy Credits',
    },
  },
}

type I18nContextType = {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
  dict: typeof translations['pt-BR']
}

function resolveKey(obj: any, path: string): string {
  const parts = path.split('.')
  let curr = obj
  for (const p of parts) {
    if (!curr || typeof curr !== 'object') return path
    curr = curr[p]
  }
  return typeof curr === 'string' ? curr : path
}

const I18nContext = createContext<I18nContextType>({
  lang: 'pt-BR',
  setLang: () => {},
  t: (key: string) => key,
  dict: translations['pt-BR'],
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('pt-BR')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_lang') as Language
      if (saved && (saved === 'pt-BR' || saved === 'en')) {
        setLangState(saved)
      }
    } catch {}
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    try {
      localStorage.setItem('app_lang', newLang)
    } catch {}
  }

  const currentDict = translations[lang] || translations['pt-BR']
  const t = (key: string): string => {
    return resolveKey(currentDict, key)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dict: currentDict }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
