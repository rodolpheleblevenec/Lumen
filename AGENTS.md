<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lumen

Webapp mobile-first de culture générale pour un cercle privé (~5-15 proches).
**La spec fait foi : `docs/PRD.md`** — la lire avant toute feature.

## Boucle produit

Leçon du jour partagée (générée la nuit par OpenAI) → quiz adaptatif (3 base + 2 bonus
si sans-faute) → cartes SRS (J+2/J+7/J+30/J+90, max 10 révisions/jour) → streaks,
classement hebdo, badges. Bibliothèque des leçons passées + 1 joker de rattrapage/semaine.

## Stack & conventions

- Next.js 16 App Router + TypeScript + Tailwind 4, `src/` dir, alias `@/*`.
- **Mobile-first** : une colonne max-width ~600px, barre de navigation inférieure,
  cibles tactiles ≥ 44px, dark mode auto.
- Supabase : Auth (Google OAuth + allowlist `lumen_allowed_emails`), Postgres avec RLS.
  Schéma : `supabase/migrations/`. Types générés à venir dans `src/lib/database.types.ts`.
- **Projet Supabase partagé entre plusieurs apps** (https://baqvosadoijsvvelugmp.supabase.co) :
  préfixer `lumen_` toute table, fonction SQL et edge function. Ne jamais bloquer
  auth.users (pool commun). L'appartenance au cercle se vérifie via `lumen_is_member()` /
  l'existence d'un `lumen_profiles` — être `authenticated` ne suffit pas dans les policies.
- Génération IA : `gpt-5.5` en Structured Outputs, prompt versionné dans
  `src/server/generation/prompt.md`. `OPENAI_API_KEY` et `SUPABASE_SERVICE_ROLE_KEY`
  ne doivent JAMAIS atteindre le client — serveur uniquement (routes API / Server Actions).
- Routes cron (génération, push) : protégées par `CRON_SECRET`, appelées par
  GCP Cloud Scheduler. Déploiement cible : Cloud Run (scale-to-zero).
- Contenu et UI en **français**.

## Commandes

- `npm run dev` / `npm run build` / `npm run lint`

## Barème (PRD §4)

Quiz base 10 pts/question, bonus 20 pts, révision SRS 5 pts, leçon rattrapée 5 pts/question.
Le streak se valide en terminant le quiz du jour.
