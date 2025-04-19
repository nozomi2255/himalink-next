declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  interface RuntimeCachingOptions {
    cacheName?: string;
    networkTimeoutSeconds?: number;
    expiration?: {
      maxEntries?: number;
      maxAgeSeconds?: number;
    };
    cacheableResponse?: {
      statuses?: number[];
      headers?: Record<string, string>;
    };
  }

  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    scope?: string
    sw?: string
    skipWaiting?: boolean
    runtimeCaching?: Array<{
      urlPattern: RegExp | string
      handler: 'CacheFirst' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate'
      options?: RuntimeCachingOptions
    }>
  }

  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export = withPWA
} 