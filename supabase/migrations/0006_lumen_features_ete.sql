-- Features été 2026 : heure de push perso, audio TTS, contexte du jour,
-- mode vacances, approfondissements partagés, vote du thème du dimanche.

-- Heure de rappel choisie par chacun (0-23, heure de Paris)
alter table public.lumen_profiles
  add column if not exists push_hour int not null default 8
    check (push_hour between 0 and 23);

-- Audio TTS généré à la demande (chemin dans le bucket lumen-audio)
alter table public.lumen_lessons
  add column if not exists audio_path text;

-- « Contexte du jour » : lien réel entre la date et le sujet, sinon null
alter table public.lumen_lessons
  add column if not exists date_hook text;

-- Mode vacances : streak gelé sur la période déclarée (max 14 j/an)
alter table public.lumen_streaks
  add column if not exists vacation_start date,
  add column if not exists vacation_end date,
  add column if not exists vacation_days_used int not null default 0,
  add column if not exists vacation_year int;

-- Approfondissements « Creuser » : générés à la demande, partagés au cercle
create table public.lumen_deep_dives (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lumen_lessons(id) on delete cascade,
  section_key text not null,
  section_title text not null,
  content_md text not null,
  created_by uuid references public.lumen_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (lesson_id, section_key)
);
alter table public.lumen_deep_dives enable row level security;
create policy lumen_deep_dives_select on public.lumen_deep_dives
  for select using (public.lumen_is_member());
-- Écriture : service role uniquement (server action), pas de policy insert.

-- Vote du thème « Carte blanche » du dimanche (4 options proposées par l'IA)
create table public.lumen_theme_polls (
  id uuid primary key default gen_random_uuid(),
  sunday date not null unique,
  options jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.lumen_theme_polls enable row level security;
create policy lumen_theme_polls_select on public.lumen_theme_polls
  for select using (public.lumen_is_member());

create table public.lumen_theme_ballots (
  poll_id uuid not null references public.lumen_theme_polls(id) on delete cascade,
  user_id uuid not null references public.lumen_profiles(id) on delete cascade,
  option_idx int not null check (option_idx between 0 and 3),
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);
alter table public.lumen_theme_ballots enable row level security;
create policy lumen_theme_ballots_select on public.lumen_theme_ballots
  for select using (public.lumen_is_member());
create policy lumen_theme_ballots_insert on public.lumen_theme_ballots
  for insert with check (user_id = auth.uid() and public.lumen_is_member());

-- Bucket audio public (lecture seule pour tous, écriture service role)
insert into storage.buckets (id, name, public)
values ('lumen-audio', 'lumen-audio', true)
on conflict (id) do nothing;
