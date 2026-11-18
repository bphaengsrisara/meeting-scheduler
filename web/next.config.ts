import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // The build copies only the files the server needs into .next/standalone,
  // so the Docker image needs no node_modules install.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
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
