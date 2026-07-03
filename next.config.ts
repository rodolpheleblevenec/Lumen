import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autonome pour le conteneur Cloud Run (node server.js)
  output: "standalone",
  // Un package-lock.json existe dans le home (dépôt parent) : sans ceci,
  // Next se trompe de racine de workspace.
  turbopack: {
    root: __dirname,
  },
  // Le prompt de génération est lu via fs à l'exécution : l'inclure dans
  // le build standalone (Cloud Run).
  outputFileTracingIncludes: {
    "/api/cron/generate-lesson": ["./src/server/generation/prompt.md"],
  },
};

export default nextConfig;
