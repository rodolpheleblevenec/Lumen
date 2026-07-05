-- Accès ouvert : plus d'allowlist. N'importe quel compte Google qui se
-- connecte à Lumen devient membre, le profil est créé par l'app au
-- premier accès (self-serve). On ne touche pas aux inscriptions des
-- autres apps du pool auth partagé : pas de trigger global.

-- L'appareillage d'invitation disparaît
drop trigger if exists lumen_on_auth_user_created on auth.users;
drop function if exists public.lumen_handle_new_user();
drop function if exists public.lumen_backfill_member(text);
drop table if exists public.lumen_allowed_emails;

-- Self-provisioning : un utilisateur authentifié peut créer SON profil
-- et SON compteur de streak (lumen_is_member() reste inchangée : être
-- membre = avoir un profil).
create policy lumen_profiles_insert_own on public.lumen_profiles
  for insert with check (id = auth.uid());
create policy lumen_streaks_insert_own on public.lumen_streaks
  for insert with check (user_id = auth.uid());
