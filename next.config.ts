import type { NextConfig } from "next";
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  images: {
    domains: ['vafsxewrynrgpbkfbwsg.supabase.co'],
  },
  // 他のオプションがあればここに追加
  reactStrictMode: true,
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
  //disable: process.env.NODE_ENV === 'development'
})

export default withPWAConfig(nextConfig);
