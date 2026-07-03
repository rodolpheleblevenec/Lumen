# Lumen ☀️

Webapp mobile-first de culture générale pour un cercle privé de proches.
Chaque nuit, l'IA génère une leçon partagée ; chaque matin, on la lit (5-7 min),
on passe un quiz adaptatif, et la répétition espacée ancre les notions pour de bon.
Streaks, classement hebdo et badges entretiennent l'émulation.

📄 **Toute la spec : [docs/PRD.md](docs/PRD.md)** · Analyse marché : [docs/benchmark.md](docs/benchmark.md)

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind 4), PWA
- **Supabase** — Auth Google + Postgres/RLS (migrations dans [supabase/migrations/](supabase/migrations/))
- **OpenAI API** (`gpt-5.5`, Structured Outputs) — prompt dans [src/server/generation/prompt.md](src/server/generation/prompt.md)
- **GCP** — Cloud Run (hébergement) + Cloud Scheduler (génération nocturne, push)

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les clés
npm run dev
```

## Coût de fonctionnement

~3 $/mois de tokens (une génération/nuit avec gpt-5.5) — tout le reste tient dans les free tiers.
