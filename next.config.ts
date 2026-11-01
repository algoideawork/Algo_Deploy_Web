import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure server components and API routes can resolve native crypto/node packages cleanly
  serverExternalPackages: ["@prisma/client", "prisma", "crypto"],
};

export default nextConfig;

