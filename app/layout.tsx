import type { Metadata } from 'next'
import { Newsreader, DM_Sans, DM_Mono } from 'next/font/google'
import { SessionProvider } from '@/components/SessionProvider'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// ─── Font loading ─────────────────────────────────────────────────────────────
// Newsreader: display serif — optical-size variable font, weights 400/500/600
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

// DM Sans: body — weights 400/500/600/700
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

// DM Mono: labels / meta — static weights
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

// ─── Site metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  // Canonical host is the www subdomain (matches sitemap, robots and the Vercel
  // primary domain). Keep this consistent everywhere or Google reports the
  // non-canonical host's pages as "Page with redirect".
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pivotpath.uk',
  ),
  title: {
    default: 'PivotPath, Career Transition Intelligence',
    template: '%s · PivotPath',
  },
  description:
    "You're not underqualified. You're untranslated. PivotPath reads the experience you already have and rewrites it in the language your target field hires for.",
  // Favicon comes from app/icon.svg (amber tile + navy pivot arrow, matching the logo)
  openGraph: {
    siteName: 'PivotPath',
    locale: 'en_US',
    type: 'website',
  },
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="font-body antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
