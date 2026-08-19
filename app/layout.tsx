import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { PlayerProvider } from '@/components/player/player-provider'
import { CreditsProvider } from '@/components/credits-provider'
import { VoicesProvider } from '@/components/voices-provider'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'AuraVoice Studio — Neural Text-to-Speech & Voice Cloning',
  description:
    'Estúdio de voz neural realista com síntese em tempo real, clonagem instantânea de voz e exportação de áudio de estúdio.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <CreditsProvider>
          <VoicesProvider>
            <PlayerProvider>
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <div className="flex-1 pb-28">{children}</div>
              </div>
            </PlayerProvider>
          </VoicesProvider>
        </CreditsProvider>
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
