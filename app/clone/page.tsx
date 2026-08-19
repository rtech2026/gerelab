import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { CloneWorkspace } from '@/components/clone/clone-workspace'

export default async function ClonePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return <CloneWorkspace />
}
