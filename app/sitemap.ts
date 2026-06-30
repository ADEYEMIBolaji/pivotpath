import type { MetadataRoute } from 'next'

// Canonical host is the www apex (matches NEXTAUTH_URL and the Vercel domain).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pivotpath.uk').replace(/\/$/, '')

/**
 * Public, indexable routes only. App/authenticated pages (onboarding, results,
 * settings, checkout) and API routes are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/',               priority: 1.0, changeFrequency: 'weekly' },
    { path: '/pricing',        priority: 0.9, changeFrequency: 'weekly' },
    { path: '/auth/signup',    priority: 0.6, changeFrequency: 'monthly' },
    { path: '/legal/terms',    priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/privacy',  priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/refunds',  priority: 0.3, changeFrequency: 'yearly' },
  ]

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
