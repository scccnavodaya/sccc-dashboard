// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Enable React strict mode
  reactStrictMode: true,

  // ✅ Don’t fail builds due to ESLint errors (useful while iterating)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Configure Turbopack
  turbopack: {
    // Root directory (silences "workspace root" warning)
    root: __dirname,

    // Aliases for cleaner imports
    resolveAlias: {
      "@": "./",
      "@/app": "./app",
      "@/components": "./components",
      "@/hooks": "./hooks",
      "@/lib": "./lib",
      "@/utils": "./utils",
      "@/public": "./public",
    },
  },
};

export default nextConfig;
