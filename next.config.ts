import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite încărcarea de fișiere (atașamente taskuri) prin Server Actions.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
