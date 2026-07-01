import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { REVIEWER_DEMO_USER_ID } from './lib/demo'

type DbUser = { id: string; email: string; name: string | null; image: string | null; password_hash: string | null }

async function getUserByEmail(email: string): Promise<DbUser | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { query } = await import('./lib/db')
    const rows = await query<DbUser>('SELECT id, email, name, image, password_hash FROM users WHERE email = $1', [email])
    return rows[0] ?? null
  } catch {
    return null
  }
}

async function upsertOAuthUser(email: string, name: string | null, image: string | null): Promise<DbUser | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { query } = await import('./lib/db')
    const rows = await query<DbUser>(
      `INSERT INTO users (email, name, image, email_verified)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE
         SET name  = COALESCE(users.name, EXCLUDED.name),
             image = COALESCE(users.image, EXCLUDED.image),
             updated_at = NOW()
       RETURNING id, email, name, image, password_hash`,
      [email, name, image],
    )
    return rows[0] ?? null
  } catch {
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Credentials({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        if (!email || !password) return null

        // Screenshot/demo mode: accept a hardcoded demo account
        if (
          process.env.SCREENSHOT_MODE === '1' &&
          email === 'demo@screenshot.pivotpath' &&
          password === 'screenshot-demo-2024'
        ) {
          return { id: 'demo-user-screenshot', email, name: 'Alex Johnson', image: null }
        }

        // Reviewer demo account — lets payment-provider approval teams sign in and
        // see the full (paid) product. Credentials come from env so nothing is in
        // the repo; enabled only when REVIEWER_DEMO_ENABLED=1.
        if (
          process.env.REVIEWER_DEMO_ENABLED === '1' &&
          process.env.REVIEWER_DEMO_PASSWORD &&
          email.toLowerCase() === (process.env.REVIEWER_DEMO_EMAIL ?? 'reviewer@pivotpath.uk').toLowerCase() &&
          password === process.env.REVIEWER_DEMO_PASSWORD
        ) {
          return { id: REVIEWER_DEMO_USER_ID, email, name: 'PivotPath Reviewer', image: null }
        }

        const user = await getUserByEmail(email)
        if (!user?.password_hash) return null

        const valid = await compare(password, user.password_hash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name ?? undefined, image: user.image ?? undefined }
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    newUser: '/onboarding',
  },

  callbacks: {
    async signIn({ user, account }) {
      // Persist OAuth users (Google etc.) into the users table on first sign-in
      if (account?.provider !== 'credentials' && user.email) {
        const dbUser = await upsertOAuthUser(user.email, user.name ?? null, user.image ?? null)
        if (dbUser) user.id = dbUser.id
      }
      return true
    },

    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.name) session.user.name = token.name as string
      if (token.picture) session.user.image = token.picture as string
      return session
    },

    async jwt({ token, user, trigger, session }) {
      if (user?.id) token.sub = user.id
      // Allow session.update() to refresh name in token
      if (trigger === 'update' && session?.name) token.name = session.name
      return token
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days — keep users signed in across visits
  },

  // Required on Vercel so the session cookie is trusted across preview/prod hosts.
  // Without this, NextAuth v5 can drop the session when the request host differs
  // from NEXTAUTH_URL — which is exactly what logs users out on navigation.
  trustHost: true,

  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-secret-change-in-production',
})
