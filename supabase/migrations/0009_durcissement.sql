-- `search_path` figé : sans lui, un schéma placé devant `pg_catalog` par
-- l'appelante pourrait détourner `now()`.
create or replace function maintenant_salon()
returns timestamp
language sql
stable
set search_path = pg_catalog, public
as $$
  select (now() at time zone 'Africa/Tunis')::timestamp;
$$;

-- Surface publique réduite au strict nécessaire. `creer_reservation`,
-- `creer_commande` et `occupation_du_jour` restent ouverts à `anon` : c'est
-- exactement leur raison d'être, une visiteuse doit pouvoir réserver sans
-- compte. Les autres n'ont rien à faire dans l'API publique.
revoke execute on function est_admin() from public, anon;
revoke execute on function statistiques_admin() from public, anon;
revoke execute on function maintenant_salon() from public, anon;
revoke execute on function reference_libre(text, date) from public, anon, authenticated;

-- Les policies s'exécutent avec le rôle de l'appelante : `authenticated` doit
-- garder l'accès à `est_admin()`, sinon plus aucune écriture d'administration
-- ne passerait.
grant execute on function est_admin() to authenticated;
grant execute on function statistiques_admin() to authenticated;
