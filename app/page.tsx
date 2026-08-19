import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Studio } from '@/components/studio/studio'

export default async function StudioPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Studio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Converta texto em voz neural realista com controle de estúdio.
        </p>
      </div>
      <Studio />
    </main>
  )
}
