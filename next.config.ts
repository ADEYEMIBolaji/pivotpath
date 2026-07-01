import type { NextConfig } from 'next'

// test-mode: no-op marker commit to force a Vercel preview build for this branch
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow screenshot script to use a separate build dir (avoids .next/trace lock conflicts)
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  webpack(config) {
    return config
  },
}

export default nextConfig
