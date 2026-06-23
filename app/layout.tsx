import type { Metadata } from 'next'
import { Newsreader, DM_Sans, DM_Mono } from 'next/font/google'
import { SessionProvider } from '@/components/SessionProvider'
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
  title: {
    default: 'PivotPath — Career Transition Intelligence',
    template: '%s · PivotPath',
  },
  description:
    "You're not underqualified. You're untranslated. PivotPath reads the experience you already have and rewrites it in the language your target field hires for.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%230F1923'/%3E%3Ccircle cx='5' cy='18.5' r='2.3' fill='%23E8A838'/%3E%3Cpath d='M5 18.5 H13 V9' stroke='%23E8A838' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M9.6 11.5 L13 7 L16.4 11.5' stroke='%23E8A838' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
        type: 'image/svg+xml',
      },
    ],
  },
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
      </body>
    </html>
  )
}
