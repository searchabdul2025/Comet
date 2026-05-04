import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Vercel
  reactStrictMode: true,
  
  // Environment variables that should be available on the client
  env: {
    // Add any public env vars here if needed
  },
  
  // Image optimization
  images: {
    domains: [],
    unoptimized: false,
  },
};

export default nextConfig;
