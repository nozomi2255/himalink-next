import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['vafsxewrynrgpbkfbwsg.supabase.co'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠ Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // 他のオプションがあればここに追加
};

export default nextConfig;
