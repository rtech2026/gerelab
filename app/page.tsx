import { Studio } from '@/components/studio/studio'

export default function StudioPage() {
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
