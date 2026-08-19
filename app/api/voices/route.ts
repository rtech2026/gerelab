import { NextResponse } from 'next/server'
import { NATIVE_VOICES } from '@/lib/voices'

export const runtime = 'nodejs'

export async function GET() {
  // In a full deployment, cloned voices would be merged in from the DB /
  // LMNT account here. Native voices are always available.
  return NextResponse.json(
    { voices: NATIVE_VOICES },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
