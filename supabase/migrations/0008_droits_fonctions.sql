-- Supabase accorde par défaut l'exécution des fonctions du schéma `public` à
-- `anon` et `authenticated`. Un simple `revoke ... from public` ne suffit donc
-- pas : il faut retirer les droits nommément.
--
-- `reference_libre` n'est qu'un utilitaire interne de `creer_reservation` et
-- `creer_commande`, qui tournent en `security definer` et n'ont pas besoin que
-- l'appelante y ait accès.
revoke execute on function reference_libre(text, date) from public, anon, authenticated;
revoke execute on function est_admin() from anon;
