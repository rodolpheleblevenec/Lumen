-- Preuve sociale : les membres du cercle voient qui a validé chaque leçon
-- (« Camille a déjà validé » sur l'écran de lecture).
-- NB : déjà appliquée en prod via MCP — fichier commité pour l'historique.

create policy lumen_lesson_progress_select_members
  on public.lumen_lesson_progress
  for select
  using (public.lumen_is_member());
