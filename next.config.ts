import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['exceljs'],
  cacheComponents: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
