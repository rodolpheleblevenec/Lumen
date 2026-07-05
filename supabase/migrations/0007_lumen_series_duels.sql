-- Fil rouge mensuel + duels amicaux.

-- Les sondages portent un type : hebdo (Carte blanche de dimanche) ou
-- série du mois (fil rouge sur les 4 dimanches). Pour une série,
-- `sunday` vaut le 1er jour du mois concerné et chaque option embarque
-- ses 4 épisodes.
alter table public.lumen_theme_polls
  add column if not exists kind text not null default 'sunday'
    check (kind in ('sunday', 'series'));
alter table public.lumen_theme_polls
  drop constraint if exists lumen_theme_polls_sunday_key;
create unique index if not exists lumen_theme_polls_sunday_kind
  on public.lumen_theme_polls (sunday, kind);

-- Traçabilité de la série sur la leçon (chip « Fil rouge · ép. n/4 »)
alter table public.lumen_lessons
  add column if not exists series_title text,
  add column if not exists series_episode int;

-- Duels amicaux : hors barème hebdo, 1 duel actif par paire, 24h.
create table public.lumen_duels (
  id uuid primary key default gen_random_uuid(),
  challenger uuid not null references public.lumen_profiles(id) on delete cascade,
  opponent uuid not null references public.lumen_profiles(id) on delete cascade,
  stake text,
  questions jsonb not null,          -- [{question_id, choice_order[4]}]
  challenger_result jsonb,           -- {score, timesMs[], answers[], playedAt}
  opponent_result jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'forfeit')),
  winner uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (challenger <> opponent)
);
alter table public.lumen_duels enable row level security;
create policy lumen_duels_select on public.lumen_duels
  for select using (auth.uid() = challenger or auth.uid() = opponent);
-- Écritures via service role uniquement (server actions).
create index lumen_duels_pair
  on public.lumen_duels (challenger, opponent, status);
