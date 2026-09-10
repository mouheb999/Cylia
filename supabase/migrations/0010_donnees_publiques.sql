-- Tout ce que le site public affiche, en un seul appel.
--
-- Le site lisait six tables par navigation, soit six allers-retours réseau
-- vers Francfort avant de pouvoir peindre une page. Ces données sont les mêmes
-- pour toutes les visiteuses et changent rarement : autant les livrer d'un
-- bloc, et laisser Next les garder en cache.
create or replace function donnees_publiques()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'reglages',
      (select to_jsonb(r) from reglages r where r.id = 1),
    'categories',
      coalesce((select jsonb_agg(to_jsonb(c) order by c.ordre, c.nom)
                  from categories c where c.actif), '[]'::jsonb),
    'prestations',
      coalesce((select jsonb_agg(to_jsonb(p) order by p.ordre, p.nom)
                  from prestations p where p.actif), '[]'::jsonb),
    'produits',
      coalesce((select jsonb_agg(to_jsonb(pr) order by pr.ordre, pr.nom)
                  from produits pr where pr.actif), '[]'::jsonb),
    'galerie',
      coalesce((select jsonb_agg(to_jsonb(g) order by g.ordre, g.cree_le)
                  from galerie g where g.actif), '[]'::jsonb),
    'contenus',
      coalesce((select jsonb_object_agg(cn.cle, cn.valeur) from contenus cn), '{}'::jsonb),
    'fermetures',
      coalesce((select jsonb_agg(jsonb_build_object('debut', f.date_debut, 'fin', f.date_fin))
                  from fermetures f
                 where f.date_fin >= (now() at time zone 'Africa/Tunis')::date), '[]'::jsonb)
  );
$$;

grant execute on function donnees_publiques() to anon, authenticated;
