import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  trustedOrigins: [
    'http://localhost:3000',
    'https://*.vercel.app',
    'https://*.vusercontent.net',
    'https://*.vercel.run',
    'https://*.v0.build',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // 1 dia
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // No preview do v0 (iframe cross-site) o cookie precisa ser
          // SameSite=None; Secure para que a sessão seja persistida.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
  plugins: [nextCookies()],
})
