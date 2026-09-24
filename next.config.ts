import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [] },
  // Required for Arena's proxied live preview during development.
  allowedDevOrigins: ['3000-i6bt15jsddnny210rl1be.e2b.app']
};

export default nextConfig;
