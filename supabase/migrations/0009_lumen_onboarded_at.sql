-- L'onboarding (bulles tutorielles) est lié au compte, plus au
-- localStorage du navigateur : vu une fois = vu partout.
alter table public.lumen_profiles
  add column if not exists onboarded_at timestamptz;

-- Les membres existants l'ont déjà vu : pas de re-affichage.
update public.lumen_profiles set onboarded_at = now() where onboarded_at is null;
