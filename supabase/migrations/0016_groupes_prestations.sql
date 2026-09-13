-- Un étage entre la catégorie et la prestation.
--
-- « Esthétique » mélangeait quinze épilations, cinq soins du visage et quatre
-- technologies dans une seule liste à faire défiler. La catégorie répond à
-- « quel univers », le groupe à « quel geste » : Épilation, Soins du visage,
-- Massages, Head Spa. C'est le groupe qui porte la photo — une par geste, pas
-- une par ligne de tarif, sinon le salon devrait photographier quinze fois la
-- même cire.

create table if not exists groupes (
  id           text primary key,
  categorie_id text not null references categories (id) on delete cascade,
  nom          text not null,
  description  text not null default '',
  image_url    text,
  ordre        int not null default 0,
  actif        boolean not null default true,
  cree_le      timestamptz not null default now()
);

create index if not exists groupes_categorie_idx on groupes (actif, categorie_id, ordre);

alter table prestations
  add column if not exists groupe_id text references groupes (id) on delete set null;

create index if not exists prestations_groupe_idx on prestations (groupe_id, ordre);

alter table groupes enable row level security;

drop policy if exists "lecture publique groupes" on groupes;
create policy "lecture publique groupes" on groupes
  for select to anon, authenticated using (true);

drop policy if exists "admins gerent groupes" on groupes;
create policy "admins gerent groupes" on groupes
  for all to authenticated using (est_admin()) with check (est_admin());

insert into groupes (id, categorie_id, nom, description, ordre) values
  ('coupe-coiffage',    'coiffure',   'Coupe & coiffage',            'Coupe, brushing, mise en forme',        1),
  ('coloration',        'coiffure',   'Coloration & mèches',         'Couleur, balayage, éclaircissement',    2),
  ('soins-capillaires', 'coiffure',   'Soins capillaires',           'Masques et soins profonds',             3),
  ('soins-visage',      'esthetique', 'Soins du visage',             'Nettoyage, éclat, anti-âge',            1),
  ('technologies',      'esthetique', 'Technologies visage & corps', 'HIFU, OxyGeneo, Microneedling',         2),
  ('epilation',         'esthetique', 'Épilation (cire / fil)',      'Douceur, précision & élégance',         3),
  ('ongles',            'esthetique', 'Ongles',                      'Manucure, pose et vernis',              4),
  ('maquillage',        'esthetique', 'Maquillage',                  'Jour, soirée, mariée',                  5),
  ('massages',          'bien-etre',  'Massages',                    'Relaxant, drainant, pierres chaudes',   1),
  ('head-spa',          'bien-etre',  'Head Spa',                    'Rituel du cuir chevelu',                2),
  ('hammam',            'bien-etre',  'Hammam & Spa',                'Gommage, vapeur, rituels du corps',     3)
on conflict (id) do nothing;

-- Le Head Spa était rangé en coiffure. C'est un rituel de détente : il rejoint
-- le bien-être, avec les massages et le hammam.
update prestations set categorie_id = 'bien-etre', groupe_id = 'head-spa' where id = 'head-spa';

update prestations set groupe_id = 'coupe-coiffage'    where id = 'coupe-brushing';
update prestations set groupe_id = 'coloration'        where id in ('coloration', 'balayage');
update prestations set groupe_id = 'soins-capillaires' where id = 'soin-capillaire';
update prestations set groupe_id = 'technologies'      where id in ('hifu', 'hydrafacial');
update prestations set groupe_id = 'ongles'            where id = 'ongles';
update prestations set groupe_id = 'maquillage'        where id = 'make-up';
update prestations set groupe_id = 'massages'
 where id in ('massage-relaxant', 'pierres-chaudes', 'huiles-essentielles', 'drainant', 'massage-duo');

-- Les tarifs relevés sur l'affiche « Épilation (cire / fil) ». Les prix sont
-- ceux du salon ; les durées, elles, sont des estimations à corriger dans
-- /admin/prestations — c'est la durée qui décide des créneaux proposés.
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, ordre) values
  ('epil-sourcils-cire',      'Sourcils à la cire',                'esthetique', 'epilation',  15,  10.00,  1),
  ('epil-sourcils-fil',       'Sourcils au fil',                   'esthetique', 'epilation',  15,  10.00,  2),
  ('epil-browlift-lashlift',  'Browlift / Lashlift',               'esthetique', 'epilation',  60,  80.00,  3),
  ('epil-visage-fil',         'Visage au fil',                     'esthetique', 'epilation',  30,  40.00,  4),
  ('epil-visage-cou-azulene', 'Visage + cou + masque à l''azulène','esthetique', 'epilation',  45,  40.00,  5),
  ('epil-moustaches',         'Moustaches',                        'esthetique', 'epilation',  10,   7.00,  6),
  ('epil-aisselles',          'Aisselles',                         'esthetique', 'epilation',  15,  10.00,  7),
  ('epil-demi-bras',          'Demi-bras',                         'esthetique', 'epilation',  15,  15.00,  8),
  ('epil-bras-complets',      'Bras complets',                     'esthetique', 'epilation',  25,  25.00,  9),
  ('epil-demi-jambes',        'Demi-jambes',                       'esthetique', 'epilation',  25,  20.00, 10),
  ('epil-jambes-completes',   'Jambes complètes',                  'esthetique', 'epilation',  40,  45.00, 11),
  ('epil-zone-intime',        'Zone intime',                       'esthetique', 'epilation',  30,  30.00, 12),
  ('epil-dos',                'Dos',                               'esthetique', 'epilation',  25,  30.00, 13),
  ('epil-ventre',             'Ventre',                            'esthetique', 'epilation',  20,  30.00, 14),
  ('epil-corps-complet',      'Corps complet',                     'esthetique', 'epilation', 120, 120.00, 15)
on conflict (id) do nothing;

-- L'ancienne prestation « Épilation », seule ligne pour tout le rayon, ferait
-- doublon avec les quinze ci-dessus. Masquée, pas effacée : les rendez-vous
-- passés qui la mentionnent restent lisibles.
update prestations set actif = false where id = 'epilation';

-- Relevé sur l'affiche « L'esthétique / Soins visage & corps ». Sans tarif :
-- l'affiche n'en donne pas, et un prix inventé serait pire qu'un prix absent.
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, ordre) values
  ('soin-visage',     'Soins du visage',        'esthetique', 'soins-visage', 60, null, 1),
  ('dermaplaning',    'Dermaplaning',           'esthetique', 'soins-visage', 45, null, 2),
  ('peeling',         'Peeling',                'esthetique', 'soins-visage', 45, null, 3),
  ('soin-anti-age',   'Soins anti-âge & éclat', 'esthetique', 'soins-visage', 60, null, 4),
  ('rajeunissement',  'Rajeunissement',         'esthetique', 'soins-visage', 60, null, 5),
  ('oxygeneo',        'OxyGeneo',               'esthetique', 'technologies', 60, null, 3),
  ('microneedling',   'Microneedling',          'esthetique', 'technologies', 60, null, 4)
on conflict (id) do nothing;

-- Les groupes voyagent avec le reste : une lecture, un cache, comme les autres.
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
