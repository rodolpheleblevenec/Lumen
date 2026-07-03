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

## Production

- **App** : https://lumen.rodserver.fr (alias : https://lumen-429795756050.europe-west1.run.app)
- **Cloud Run** `lumen` (projet GCP `lumen-501322`, europe-west1, scale-to-zero, image via Dockerfile)
- **Cloud Scheduler** : `lumen-generate-lesson` (4h30 Paris, génère la leçon) et
  `lumen-send-push` (8h00 Paris, notifications) — auth `Authorization: Bearer $CRON_SECRET`
- Déploiement manuel : `gcloud run deploy lumen --source . --region europe-west1 --project lumen-501322`
  (les secrets vivent dans les variables d'env du service ; les `NEXT_PUBLIC_*` publics dans `.env.production`)

## Coût de fonctionnement

~3 $/mois de tokens (une génération/nuit avec gpt-5.5) — tout le reste tient dans les free tiers
et le scale-to-zero de Cloud Run.
