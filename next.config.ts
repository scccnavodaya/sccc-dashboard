import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ✅ Enable React strict mode
  reactStrictMode: true,

  // ✅ Do not fail builds due to ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Webpack config to resolve "@" as project root
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
      "@/app": path.resolve(__dirname, "app"),
      "@/components": path.resolve(__dirname, "components"),
      "@/hooks": path.resolve(__dirname, "hooks"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/utils": path.resolve(__dirname, "utils"),
      "@/public": path.resolve(__dirname, "public"),
    };
    return config;
  },
};

export default nextConfig;
