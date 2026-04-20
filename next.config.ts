import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "standalone" output for Vercel compatibility
  // Vercel handles its own build output format
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow all origins for development/preview
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,PATCH,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
        ],
      },
    ];
  },
};

export default nextConfig;
