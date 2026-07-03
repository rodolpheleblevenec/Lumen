-- Sécurisation des fonctions SECURITY DEFINER de Lumen : par défaut,
-- PostgREST expose toute fonction de `public` en RPC à anon/authenticated.
-- (Appliquée via MCP le 03/07/2026 — migration `lumen_revoke_definer_exec`.)
--
-- lumen_backfill_member : réservé à l'admin (service role / SQL editor) —
--   sinon n'importe qui pourrait s'auto-inviter dans l'allowlist.
-- lumen_handle_new_user : fonction trigger, jamais appelée en RPC.
-- lumen_is_member : requis par les policies RLS pour `authenticated`
--   (les policies s'exécutent avec les droits du requêteur), mais retiré à `anon`.

revoke execute on function public.lumen_backfill_member(text) from public, anon, authenticated;
revoke execute on function public.lumen_handle_new_user() from public, anon, authenticated;
revoke execute on function public.lumen_is_member() from public, anon;
