-- CYLIA Maison de Beauté — schéma initial
-- Réservations, boutique de cosmétiques, contenu éditable.

-- ---------------------------------------------------------------- admins
create table if not exists administrateurs (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  nom        text,
  cree_le    timestamptz not null default now()
);

-- `security definer` : la fonction lit `administrateurs` sans passer par RLS,
-- sinon la policy qui l'appelle s'appellerait elle-même (récursion infinie).
create or replace function est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from administrateurs where user_id = auth.uid());
$$;

-- ------------------------------------------------------------- réglages
create table if not exists reglages (
  id                     int primary key default 1 check (id = 1),
  ouverture_minutes      int not null default 600,
  fermeture_minutes      int not null default 1200,
  pas_minutes            int not null default 30,
  capacite_simultanee    int not null default 3,
  delai_minimum_minutes  int not null default 60,
  jours_proposes         int not null default 14,
  devise                 text not null default 'DT',
  frais_livraison        numeric(10, 2) not null default 7,
  livraison_gratuite_des numeric(10, 2),
  reservation_active     boolean not null default true,
  boutique_active        boolean not null default true,
  maj_le                 timestamptz not null default now()
);

insert into reglages (id) values (1) on conflict (id) do nothing;

-- Jours ou périodes où le salon est fermé (congés, fériés).
create table if not exists fermetures (
  id         uuid primary key default gen_random_uuid(),
  date_debut date not null,
  date_fin   date not null,
  motif      text,
  cree_le    timestamptz not null default now(),
  constraint fermetures_ordre check (date_fin >= date_debut)
);

-- ----------------------------------------------------------- catalogue
create table if not exists categories (
  id          text primary key,
  nom         text not null,
  description text not null default '',
  ordre       int not null default 0,
  actif       boolean not null default true
);

create table if not exists prestations (
  id            text primary key,
  nom           text not null,
  categorie_id  text not null references categories (id) on delete cascade,
  duree_minutes int not null check (duree_minutes > 0),
  prix          numeric(10, 2),
  description   text not null default '',
  image_url     text,
  ordre         int not null default 0,
  actif         boolean not null default true,
  cree_le       timestamptz not null default now()
);

create index if not exists prestations_categorie_idx on prestations (categorie_id, ordre);

-- -------------------------------------------------------- réservations
create table if not exists reservations (
  id             uuid primary key default gen_random_uuid(),
  reference      text unique not null,
  prestation_ids text[] not null,
  -- Noms figés à la réservation : renommer une prestation ne doit pas
  -- réécrire l'historique du salon.
  prestations_nom text[] not null default '{}',
  date           date not null,
  heure_minutes  int not null check (heure_minutes between 0 and 1439),
  duree_minutes  int not null check (duree_minutes > 0),
  nom            text not null,
  telephone      text not null,
  note           text,
  prix_total     numeric(10, 2),
  statut         text not null default 'en_attente'
                 check (statut in ('en_attente', 'confirmee', 'terminee', 'annulee')),
  cree_le        timestamptz not null default now()
);

create index if not exists reservations_date_idx on reservations (date, heure_minutes);
create index if not exists reservations_statut_idx on reservations (statut, date desc);

-- -------------------------------------------------------------- contenu
-- Chaque bloc modifiable du site porte une clé stable, ex. « hero.titre ».
create table if not exists contenus (
  cle    text primary key,
  valeur text not null default '',
  type   text not null default 'texte' check (type in ('texte', 'image', 'lien')),
  maj_le timestamptz not null default now()
);

create table if not exists galerie (
  id        uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt       text not null default '',
  ordre     int not null default 0,
  actif     boolean not null default true,
  cree_le   timestamptz not null default now()
);

-- -------------------------------------------------------------- boutique
create table if not exists produits (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  nom         text not null,
  marque      text not null default '',
  description text not null default '',
  prix        numeric(10, 2) not null check (prix >= 0),
  ancien_prix numeric(10, 2),
  image_url   text,
  categorie   text not null default 'soin',
  stock       int not null default 0 check (stock >= 0),
  ordre       int not null default 0,
  actif       boolean not null default true,
  cree_le     timestamptz not null default now()
);

create index if not exists produits_actif_idx on produits (actif, ordre);

create table if not exists commandes (
  id          uuid primary key default gen_random_uuid(),
  reference   text unique not null,
  nom         text not null,
  telephone   text not null,
  email       text,
  adresse     text not null,
  ville       text not null,
  note        text,
  sous_total  numeric(10, 2) not null,
  livraison   numeric(10, 2) not null default 0,
  total       numeric(10, 2) not null,
  statut      text not null default 'en_attente'
              check (statut in ('en_attente', 'confirmee', 'expediee', 'livree', 'annulee')),
  cree_le     timestamptz not null default now()
);

create index if not exists commandes_statut_idx on commandes (statut, cree_le desc);

create table if not exists commande_articles (
  id          uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes (id) on delete cascade,
  produit_id  uuid references produits (id) on delete set null,
  nom         text not null,
  prix        numeric(10, 2) not null,
  quantite    int not null check (quantite > 0)
);

create index if not exists commande_articles_commande_idx on commande_articles (commande_id);
