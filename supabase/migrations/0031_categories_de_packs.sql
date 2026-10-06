-- Les packs se rangent maintenant par catégorie.
--
-- L'accueil alignait toutes les formules à la suite, en grille. Avec les packs
-- hammam, les packs mariée et le reste, la section devenait une liste à
-- faire défiler. L'accueil ne montre plus qu'une grande carte « Nos packs » ;
-- elle ouvre `/packs`, qui présente les catégories, et chacune ouvre ses
-- formules — `/packs/categorie/<slug>`.
--
-- Le salon crée, photographie, range et masque ses catégories depuis le
-- panneau, comme ses packs. Un pack sans catégorie reste visible : il
-- s'affiche sous les catégories, sur `/packs`.

create table if not exists categories_packs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  nom         text not null,
  description text not null default '',
  image_url   text,
  ordre       int not null default 0,
  actif       boolean not null default true,
  cree_le     timestamptz not null default now()
);

create index if not exists categories_packs_actif_idx on categories_packs (actif, ordre);

alter table categories_packs enable row level security;

drop policy if exists "lecture publique categories_packs" on categories_packs;
create policy "lecture publique categories_packs" on categories_packs
  for select to anon, authenticated using (true);

drop policy if exists "admins gerent categories_packs" on categories_packs;
create policy "admins gerent categories_packs" on categories_packs
  for all to authenticated using (est_admin()) with check (est_admin());

alter table packs
  add column if not exists categorie_id uuid references categories_packs (id) on delete set null;

-- Les trois catégories de départ ; le salon les renomme ou en ajoute ensuite.
insert into categories_packs (slug, nom, description, ordre) values
  ('hammam',  'Packs Hammam',  'Le rituel du hammam, du gommage au bain d''huile.', 1),
  ('mariage', 'Packs Mariée',  'Tout ce qu''il faut pour le grand jour.',           2),
  ('autres',  'Autres packs',  'Head spa, soins et formules de saison.',           3)
on conflict (slug) do nothing;

-- Les packs existants rejoignent leur catégorie, devinée d'après leur nom.
update packs set categorie_id = (select id from categories_packs where slug = 'hammam')
 where categorie_id is null and nom ilike '%hammam%';

update packs set categorie_id = (select id from categories_packs where slug = 'mariage')
 where categorie_id is null and (nom ilike '%mari%' or nom ilike '%wedding%');

update packs set categorie_id = (select id from categories_packs where slug = 'autres')
 where categorie_id is null;

-- Chaque catégorie prend pour photo la couverture de son premier pack.
update categories_packs c
   set image_url = (
     select coalesce(pk.images[1], pk.image_url)
       from packs pk
      where pk.categorie_id = c.id and coalesce(pk.images[1], pk.image_url) is not null
      order by pk.ordre, pk.nom
      limit 1)
 where c.image_url is null;

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
    'categories_packs',
      coalesce((select jsonb_agg(to_jsonb(cp) order by cp.ordre, cp.nom)
                  from categories_packs cp where cp.actif), '[]'::jsonb),
    'coffrets',
      coalesce((select jsonb_agg(to_jsonb(cf) order by cf.ordre, cf.nom)
                  from coffrets cf where cf.actif), '[]'::jsonb),
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
