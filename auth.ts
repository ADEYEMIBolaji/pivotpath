import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

async function getUserByEmail(email: string) {
  if (!process.env.DATABASE_URL) return null
  try {
    const { query } = await import('./lib/db')
    const rows = await query<{ id: string; email: string; name: string | null; image: string | null; password_hash: string | null }>(
      'SELECT id, email, name, image, password_hash FROM users WHERE email = $1',
      [email],
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
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
  },

  session: { strategy: 'jwt' },

  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-production',
})
