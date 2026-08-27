import type { NextConfig } from "next";
import path from "node:path";

// Monorepo root (testBMAD/) — stops Next.js from walking up to unrelated
// lockfiles outside the Git repository (e.g. ~/yarn.lock).
const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
