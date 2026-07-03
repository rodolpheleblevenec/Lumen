-- Sécurisation : activation du RLS sur les tables Rental Supervision
-- et sur les anciennes tables sans préfixe (héritées, plus utilisées).
-- (Appliquée via MCP le 03/07/2026 — migration `rental_enable_rls_lockdown`.)
--
-- Contexte : l'app Rental Supervision (Flask) se connecte en direct au
-- Postgres avec le rôle `postgres` via DATABASE_URL — propriétaire des
-- tables, donc NON soumis au RLS (pas de FORCE) : zéro impact pour elle.
-- Aucune policy n'est créée : l'API PostgREST (clés anon/authenticated,
-- exposées publiquement dans les fronts des autres apps) passe en deny-all.

alter table public.rental_logements  enable row level security;
alter table public.rental_locataires enable row level security;
alter table public.rental_baux       enable row level security;
alter table public.rental_loyers     enable row level security;
alter table public.rental_depenses   enable row level security;
alter table public.rental_prets      enable row level security;
alter table public.rental_parametres enable row level security;

-- Tables héritées sans préfixe : plus référencées par aucun code déployé
-- (seulement par la version SQLite locale). Verrouillées en attendant
-- une éventuelle suppression.
alter table public.logements  enable row level security;
alter table public.locataires enable row level security;
alter table public.baux       enable row level security;
alter table public.loyers     enable row level security;
alter table public.depenses   enable row level security;
alter table public.prets      enable row level security;
alter table public.parametres enable row level security;
