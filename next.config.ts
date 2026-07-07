import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Build autocontenuto per Docker/Coolify: .next/standalone con server.js e solo le dipendenze necessarie
  output: "standalone",
};

export default nextConfig;
