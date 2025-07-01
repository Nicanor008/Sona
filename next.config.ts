import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // transpilePackages: ['@vapi-ai/web']
  output: 'export',
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
