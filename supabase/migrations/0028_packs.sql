-- « Nos packs » : les formules que le salon compose lui-même.
--
-- L'accueil portait jusqu'ici un encart figé, « Prenez soin de vous » : une
-- photo, deux lignes de titre, un lien. Le salon ne pouvait rien y annoncer
-- sans redéploiement. Les packs prennent sa place — le salon en ajoute, les
-- photographie, les range et les retire depuis le panneau, comme ses produits.
--
-- Le prix est facultatif : un pack « sur devis » se laisse annoncer sans
-- chiffre, et la carte n'affiche alors rien à cet endroit.

create table if not exists packs (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  description text not null default '',
  prix        numeric(10, 2) check (prix is null or prix >= 0),
  image_url   text,
  ordre       int not null default 0,
  actif       boolean not null default true,
  cree_le     timestamptz not null default now()
);

create index if not exists packs_actif_idx on packs (actif, ordre);

alter table packs enable row level security;

create policy "lecture publique packs" on packs
  for select to anon, authenticated using (true);

create policy "admins gerent packs" on packs
  for all to authenticated using (est_admin()) with check (est_admin());

-- `donnees_publiques()` sert tout le site en un aller-retour : les packs y
-- entrent, sans quoi l'accueil en demanderait un second.
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
    'groupes',
      coalesce((select jsonb_agg(to_jsonb(g) order by g.ordre, g.nom)
                  from groupes g where g.actif), '[]'::jsonb),
    'prestations',
      coalesce((select jsonb_agg(to_jsonb(p) order by p.ordre, p.nom)
                  from prestations p where p.actif), '[]'::jsonb),
    'produits',
      coalesce((select jsonb_agg(to_jsonb(pr) order by pr.ordre, pr.nom)
                  from produits pr where pr.actif), '[]'::jsonb),
    'packs',
      coalesce((select jsonb_agg(to_jsonb(pk) order by pk.ordre, pk.nom)
                  from packs pk where pk.actif), '[]'::jsonb),
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
