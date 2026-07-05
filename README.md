# Lumen

Webapp mobile-first de culture générale pour un cercle privé de proches.
Chaque nuit, l'IA génère une leçon partagée ; chaque matin, on la lit (5-7 min),
on passe un quiz adaptatif, et la répétition espacée ancre les notions pour de bon.
Streaks, classement hebdo, duels et badges entretiennent l'émulation.

📄 **Toute la spec : [docs/PRD.md](docs/PRD.md)** · Design system : [docs/design.md](docs/design.md) · Analyse marché : [docs/benchmark.md](docs/benchmark.md)

## Fonctionnalités

- **Leçon du jour** générée la nuit (calendrier thématique lun→dim), lecture
  5-7 min, quiz 3 questions + 2 bonus sur sans-faute, barème PRD §4.
- **Répétition espacée** : 5 notions/leçon, J+2/J+7/J+30/J+90, max 10 cartes/jour.
- **Streaks & joker** : le quiz du jour valide la journée ; 1 joker/semaine pour
  rattraper la leçon d'hier ; **mode vacances** (gel du streak, 14 j/an max).
- **Classement hebdo** + stats du cercle ; **duels amicaux** asynchrones
  (5 questions communes, 24h, face-à-face score + temps, trophées, gage libre).
- **Bibliothèque** de toutes les leçons (rattrapage 5 pts/réponse).
- **IA à la demande** (jamais pré-générée) : « Creuser » une partie de leçon
  (~300 mots, cache partagé au cercle) et **audio TTS** de la leçon
  (généré au premier clic, servi à tous ensuite).
- **Votes du cercle** : thème « Carte blanche » du dimanche (jeu→sam) et
  **fil rouge mensuel** (série de 4 épisodes sur les 4 dimanches du mois).
- **Récap mensuel** (`/recap`) : tes stats + le mois du cercle, publié le 1er.
- **Push web** à l'heure choisie par chacun (profil, 0-23h Paris) ; PWA
  installable (marque « Le Levant »).
- **Desktop** (≥ 1024px) : rail latéral + colonne de lecture élargie.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind 4), PWA — design system
  « Le Studio » ([docs/design.md](docs/design.md))
- **Supabase** — Auth Google + Postgres/RLS (migrations dans [supabase/migrations/](supabase/migrations/)),
  Storage (bucket `lumen-audio`)
- **OpenAI API** — `gpt-5.5` Structured Outputs (leçons, séries, approfondissements,
  prompt versionné dans [src/server/generation/prompt.md](src/server/generation/prompt.md)),
  `gpt-4o-mini-tts` (audio)
- **GCP** — Cloud Run (hébergement) + Cloud Scheduler (génération nocturne, push horaire)

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les clés
npm run dev
```

## Production

- **App** : https://lumen.rodserver.fr (alias : https://lumen-429795756050.europe-west1.run.app)
- **Cloud Run** `lumen` (projet GCP `lumen-501322`, europe-west1, scale-to-zero, image via Dockerfile)
- **Cloud Scheduler** : `lumen-generate-lesson` (4h30 Paris — leçon du jour ;
  le jeudi ouvre le vote du dimanche, le dernier jeudi du mois celui de la série)
  et `lumen-send-push` (toutes les heures — notifie les profils dont `push_hour`
  correspond) — auth `Authorization: Bearer $CRON_SECRET`
- **Déploiement** : automatique à chaque push sur `main` (GitHub Actions →
  Cloud Run, voir [.github/workflows/deploy.yml](.github/workflows/deploy.yml)).
  Manuel si besoin : `gcloud run deploy lumen --source . --region europe-west1 --project lumen-501322`
  (les secrets vivent dans les variables d'env du service ; les `NEXT_PUBLIC_*` publics dans `.env.production`)

## Coût de fonctionnement

~3-4 $/mois de tokens (une génération/nuit + votes hebdo/mensuels avec gpt-5.5 ;
creuser/audio à la demande) — tout le reste tient dans les free tiers et le
scale-to-zero de Cloud Run.
