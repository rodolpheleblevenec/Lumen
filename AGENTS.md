<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lumen

Webapp mobile-first de culture générale pour un cercle privé (~5-15 proches).
**La spec fait foi : `docs/PRD.md`** — la lire avant toute feature.
**Toute nouvelle interface suit `docs/design.md`** (DS « Le Studio » : tokens,
recettes de composants, do/don't) — le lire avant d'écrire du JSX.

## Boucle produit

Leçon du jour partagée (générée la nuit par OpenAI) → quiz adaptatif (3 base + 2 bonus
si sans-faute) → cartes SRS (J+2/J+7/J+30/J+90, max 10 révisions/jour) → streaks,
classement hebdo, badges. Bibliothèque des leçons passées + 1 joker de rattrapage/semaine.

## Stack & conventions

- Next.js 16 App Router + TypeScript + Tailwind 4, `src/` dir, alias `@/*`.
- **Mobile-first** : une colonne max-width ~600px, nav inférieure en pill flottante,
  cibles tactiles ≥ 44px. Desktop (≥ lg) : rail latéral (`SideNav`) + colonne ~680px.
- **Design system « Le Studio »** : indigo `--primary` + corail `--accent` sur crème,
  Instrument Serif (titres, toujours weight 400) + Archivo (le reste), cartes blanches
  `shadow-card`, boutons « à pousser » (`push-cta`/`push-cta-primary`/`push-pill`),
  **zéro emoji dans l'UI** (icônes lucide), marque « Le Levant » (`src/components/logo.tsx`).
  Tokens dans `globals.css` + `@theme inline`. Dark mode : structure conservée mais
  non couvert par le redesign (reprend le clair) — à retravailler.
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
  GCP Cloud Scheduler (jobs `lumen-generate-lesson` 4h30 et `lumen-send-push` 8h,
  Europe/Paris). Prod : Cloud Run `lumen`, projet GCP `lumen-501322`, europe-west1 —
  **https://lumen.rodserver.fr** (CNAME OVH → ghs.googlehosted.com, alias run.app).
  Déploiement manuel par `gcloud run deploy lumen --source .` (pas de trigger auto sur push).
- Contenu et UI en **français**.

## Commandes

- `npm run dev` / `npm run build` / `npm run lint`

## Barème (PRD §4)

Quiz base 10 pts/question, bonus 20 pts, révision SRS 5 pts, leçon rattrapée 5 pts/question.
Le streak se valide en terminant le quiz du jour.
