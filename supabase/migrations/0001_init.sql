-- Lumen — schéma initial
-- Modèle de données du PRD §8.
--
-- ⚠️ Projet Supabase PARTAGÉ entre plusieurs apps : tout objet Lumen est
-- préfixé `lumen_`. Conséquences de conception :
--   1. Le trigger d'allowlist ne bloque JAMAIS la création d'un utilisateur
--      auth.users (les autres apps partagent le même pool d'auth) — il crée
--      simplement le profil Lumen si l'email est invité, sinon rien.
--      L'app affiche « non invité » quand la session n'a pas de profil Lumen.
--   2. Les policies RLS ne se contentent pas de `authenticated` (les
--      utilisateurs des autres apps le sont aussi) : elles vérifient
--      l'appartenance au cercle via lumen_is_member().
-- Écriture du contenu réservée au service role (routes serveur Next.js).

-- ============================================================
-- Tables
-- ============================================================

create table public.lumen_allowed_emails (
  email text primary key
);

create table public.lumen_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  notif_time time not null default '08:00',
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now()
);

create table public.lumen_lessons (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  domain text not null,
  title text not null,
  hook text not null,
  body_md text not null,
  anecdote text,
  flex_phrase text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table public.lumen_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lumen_lessons(id) on delete cascade,
  tier text not null check (tier in ('base', 'bonus')),
  position int not null,
  prompt text not null,
  choices jsonb not null, -- tableau de 4 chaînes
  answer_idx int not null check (answer_idx between 0 and 3),
  explanation text not null,
  unique (lesson_id, tier, position)
);

create table public.lumen_notions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lumen_lessons(id) on delete cascade,
  question_id uuid references public.lumen_questions(id) on delete set null,
  label text not null
);

create table public.lumen_lesson_progress (
  user_id uuid not null references public.lumen_profiles(id) on delete cascade,
  lesson_id uuid not null references public.lumen_lessons(id) on delete cascade,
  read_at timestamptz,
  quiz_completed_at timestamptz,
  score int,
  is_catchup boolean not null default false,
  primary key (user_id, lesson_id)
);

-- Cartes SRS : niveau 0 → J+2 → J+7 → J+30 → J+90 → acquise (5)
create table public.lumen_srs_cards (
  user_id uuid not null references public.lumen_profiles(id) on delete cascade,
  notion_id uuid not null references public.lumen_notions(id) on delete cascade,
  level int not null default 0 check (level between 0 and 5),
  due_date date not null,
  last_reviewed_at timestamptz,
  primary key (user_id, notion_id)
);

create table public.lumen_points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.lumen_profiles(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  source text not null check (source in ('quiz', 'bonus', 'review', 'catchup')),
  points int not null
);

create index lumen_points_ledger_user_week_idx on public.lumen_points_ledger (user_id, occurred_at);

create table public.lumen_streaks (
  user_id uuid primary key references public.lumen_profiles(id) on delete cascade,
  current int not null default 0,
  best int not null default 0,
  last_validated_date date,
  joker_used_week_of date
);

create table public.lumen_badges (
  user_id uuid not null references public.lumen_profiles(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

create table public.lumen_push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.lumen_profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.lumen_error_reports (
  id bigint generated always as identity primary key,
  user_id uuid references public.lumen_profiles(id) on delete set null,
  lesson_id uuid references public.lumen_lessons(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.lumen_domain_calendar (
  weekday int primary key check (weekday between 0 and 6), -- 0 = dimanche (convention JS)
  domain text not null
);

-- ============================================================
-- Appartenance au cercle Lumen
-- ============================================================

create or replace function public.lumen_is_member()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.lumen_profiles where id = auth.uid());
$$;

-- Création automatique du profil à l'inscription — SANS bloquer les
-- inscriptions des autres apps du projet : si l'email n'est pas invité,
-- l'utilisateur auth existe mais n'a pas de profil Lumen.
create or replace function public.lumen_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (select 1 from public.lumen_allowed_emails where lower(email) = lower(new.email)) then
    insert into public.lumen_profiles (id, display_name, avatar_url)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data ->> 'avatar_url'
    );
    insert into public.lumen_streaks (user_id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger lumen_on_auth_user_created
  after insert on auth.users
  for each row execute function public.lumen_handle_new_user();

-- Rattrapage : inviter un email dont le compte auth existe déjà
-- (l'utilisateur s'était connecté avant l'invitation).
create or replace function public.lumen_backfill_member(p_email text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  u record;
begin
  insert into public.lumen_allowed_emails (email)
  values (lower(p_email)) on conflict do nothing;

  select id, raw_user_meta_data, email into u
  from auth.users where lower(email) = lower(p_email) limit 1;

  if u.id is not null and not exists (select 1 from public.lumen_profiles where id = u.id) then
    insert into public.lumen_profiles (id, display_name, avatar_url)
    values (
      u.id,
      coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
      u.raw_user_meta_data ->> 'avatar_url'
    );
    insert into public.lumen_streaks (user_id) values (u.id);
  end if;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.lumen_allowed_emails     enable row level security; -- aucune policy : service role uniquement
alter table public.lumen_profiles           enable row level security;
alter table public.lumen_lessons            enable row level security;
alter table public.lumen_questions          enable row level security;
alter table public.lumen_notions            enable row level security;
alter table public.lumen_lesson_progress    enable row level security;
alter table public.lumen_srs_cards          enable row level security;
alter table public.lumen_points_ledger      enable row level security;
alter table public.lumen_streaks            enable row level security;
alter table public.lumen_badges             enable row level security;
alter table public.lumen_push_subscriptions enable row level security;
alter table public.lumen_error_reports      enable row level security;
alter table public.lumen_domain_calendar    enable row level security;

-- Profils : visibles par le cercle (classement), modifiables par soi
create policy "lumen_profiles_select_members" on public.lumen_profiles
  for select to authenticated using (public.lumen_is_member());
create policy "lumen_profiles_update_own" on public.lumen_profiles
  for update to authenticated using (id = auth.uid());

-- Contenu : lecture des leçons publiées pour les membres du cercle
create policy "lumen_lessons_select" on public.lumen_lessons
  for select to authenticated using (public.lumen_is_member() and status = 'published');
create policy "lumen_questions_select" on public.lumen_questions
  for select to authenticated using (
    public.lumen_is_member()
    and exists (select 1 from public.lumen_lessons l where l.id = lesson_id and l.status = 'published')
  );
create policy "lumen_notions_select" on public.lumen_notions
  for select to authenticated using (
    public.lumen_is_member()
    and exists (select 1 from public.lumen_lessons l where l.id = lesson_id and l.status = 'published')
  );

-- Progression : chacun la sienne (la FK vers lumen_profiles garantit l'appartenance)
create policy "lumen_lesson_progress_own" on public.lumen_lesson_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lumen_srs_cards_own" on public.lumen_srs_cards
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Points, streaks, badges : lisibles par le cercle (classement),
-- écrits par soi (l'intégrité fine des points passera côté serveur)
create policy "lumen_points_select_members" on public.lumen_points_ledger
  for select to authenticated using (public.lumen_is_member());
create policy "lumen_points_insert_own" on public.lumen_points_ledger
  for insert to authenticated with check (user_id = auth.uid());
create policy "lumen_streaks_select_members" on public.lumen_streaks
  for select to authenticated using (public.lumen_is_member());
create policy "lumen_streaks_update_own" on public.lumen_streaks
  for update to authenticated using (user_id = auth.uid());
create policy "lumen_badges_select_members" on public.lumen_badges
  for select to authenticated using (public.lumen_is_member());
create policy "lumen_badges_insert_own" on public.lumen_badges
  for insert to authenticated with check (user_id = auth.uid());

-- Push : strictement personnel
create policy "lumen_push_own" on public.lumen_push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Signalements : on peut en créer, seul l'admin (service role) les lit
create policy "lumen_error_reports_insert_own" on public.lumen_error_reports
  for insert to authenticated with check (user_id = auth.uid());

-- Calendrier : lecture pour le cercle
create policy "lumen_domain_calendar_select" on public.lumen_domain_calendar
  for select to authenticated using (public.lumen_is_member());

-- ============================================================
-- Seed : calendrier thématique (PRD §3)
-- ============================================================

insert into public.lumen_domain_calendar (weekday, domain) values
  (1, 'Histoire'),
  (2, 'Sciences & nature'),
  (3, 'Arts & littérature'),
  (4, 'Géopolitique & monde contemporain'),
  (5, 'Philosophie & idées'),
  (6, 'Économie & société'),
  (0, 'Carte blanche');
