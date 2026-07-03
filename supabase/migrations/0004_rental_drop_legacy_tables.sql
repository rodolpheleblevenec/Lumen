-- Nettoyage du projet partagé (appliqué via MCP le 03/07/2026 en deux
-- migrations : `rental_prefix_legacy_tables` puis `rental_drop_legacy_tables`).
--
-- Les 7 tables héritées sans préfixe (logements, locataires, baux, loyers,
-- depenses, prets, parametres) n'étaient référencées par aucun code déployé
-- (seule la version locale SQLite de Rental Supervision utilise ces noms,
-- sur rental.db). Toutes vides, sauf parametres dont les 2 lignes étaient
-- des coquilles vides (valeurs null) — données réelles dans rental_parametres.
-- Elles ont été renommées rental_legacy_* puis supprimées.

alter table public.logements  rename to rental_legacy_logements;
alter table public.locataires rename to rental_legacy_locataires;
alter table public.baux       rename to rental_legacy_baux;
alter table public.loyers     rename to rental_legacy_loyers;
alter table public.depenses   rename to rental_legacy_depenses;
alter table public.prets      rename to rental_legacy_prets;
alter table public.parametres rename to rental_legacy_parametres;

drop table public.rental_legacy_logements;
drop table public.rental_legacy_locataires;
drop table public.rental_legacy_baux;
drop table public.rental_legacy_loyers;
drop table public.rental_legacy_depenses;
drop table public.rental_legacy_prets;
drop table public.rental_legacy_parametres;
