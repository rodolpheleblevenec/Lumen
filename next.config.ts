import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Un package-lock.json existe dans le home (dépôt parent) : sans ceci,
  // Next se trompe de racine de workspace.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
