import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable strict mode for better development warnings
  reactStrictMode: true,
  // Allow SVG imports as React components in the future
  webpack(config) {
    return config
  },
}

export default nextConfig
