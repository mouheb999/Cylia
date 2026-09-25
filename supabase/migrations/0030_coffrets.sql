-- « Nos coffrets » : des produits de la boutique, vendus ensemble.
--
-- Les packs (0028) sont des formules de soins, réservées au salon. Un coffret,
-- c'est l'autre moitié : un shampooing, un masque et une huile réunis sous un
-- prix, livrés comme le reste de la boutique. Le salon le compose de deux
-- façons, au choix :
--
--   - il choisit des produits déjà au catalogue — `produit_ids`. Le coffret
--     suit alors leur stock : il s'épuise avec le premier flacon qui manque,
--     et chaque vente décrémente chacun d'eux ;
--   - ou il pose seulement une photo du coffret tout prêt — `produit_ids`
--     vide. Rien n'est suivi en stock : c'est au salon de le masquer.
--
-- Dans les deux cas, le prix est celui du coffret, fixé par le salon, jamais
-- la somme de ses flacons.

create table if not exists coffrets (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  description text not null default '',
  prix        numeric(10, 2) not null check (prix >= 0),
  image_url   text,
  produit_ids uuid[] not null default '{}',
  ordre       int not null default 0,
  actif       boolean not null default true,
  cree_le     timestamptz not null default now()
);

create index if not exists coffrets_actif_idx on coffrets (actif, ordre);

alter table coffrets enable row level security;

drop policy if exists "lecture publique coffrets" on coffrets;
create policy "lecture publique coffrets" on coffrets
  for select to anon, authenticated using (true);

drop policy if exists "admins gerent coffrets" on coffrets;
create policy "admins gerent coffrets" on coffrets
  for all to authenticated using (est_admin()) with check (est_admin());

-- Une ligne de commande dit désormais si elle vient d'un coffret : le panneau
-- des commandes la lit comme telle, et l'historique survit au coffret retiré.
alter table commande_articles
  add column if not exists coffret_id uuid references coffrets (id) on delete set null;

-- ------------------------------------------------------ données publiques

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

-- ------------------------------------------------------------- la commande
--
-- Une ligne du panier porte soit `produit_id`, soit `coffret_id`. Pour un
-- coffret, le prix est relu ici, et chaque produit qui le compose est
-- verrouillé puis décrémenté dans la même transaction que les flacons vendus
-- seuls : un coffret et un flacon du même produit dans un panier se
-- partagent donc bien le même stock. Le reste est identique à la 0004.
create or replace function creer_commande(
  p_articles  jsonb,
  p_nom       text,
  p_telephone text,
  p_adresse   text,
  p_ville     text,
  p_email     text default null,
  p_note      text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reglages   reglages;
  v_commande   commandes;
  v_ligne      record;
  v_sous_total numeric(10, 2) := 0;
  v_livraison  numeric(10, 2) := 0;
  v_nb         int := 0;
  v_nom        text := btrim(coalesce(p_nom, ''));
  v_tel        text := btrim(coalesce(p_telephone, ''));
  v_adresse    text := btrim(coalesce(p_adresse, ''));
  v_ville      text := btrim(coalesce(p_ville, ''));
  v_email      text := nullif(btrim(coalesce(p_email, '')), '');
  v_note       text := nullif(btrim(coalesce(p_note, '')), '');
  v_articles   jsonb := '[]'::jsonb;
begin
  select * into v_reglages from reglages where id = 1;
  if not found or not v_reglages.boutique_active then
    raise exception 'BOUTIQUE_FERMEE';
  end if;

  if char_length(v_nom) < 2 or char_length(v_nom) > 80 then
    raise exception 'NOM_INVALIDE';
  end if;
  if regexp_replace(v_tel, '[^0-9]', '', 'g') !~ '^[0-9]{8,15}$' then
    raise exception 'TELEPHONE_INVALIDE';
  end if;
  if char_length(v_adresse) < 5 then raise exception 'ADRESSE_INVALIDE'; end if;
  if char_length(v_ville) < 2 then raise exception 'VILLE_INVALIDE'; end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' then
    raise exception 'EMAIL_INVALIDE';
  end if;

  if p_articles is null or jsonb_typeof(p_articles) <> 'array'
     or jsonb_array_length(p_articles) = 0
     or jsonb_array_length(p_articles) > 30 then
    raise exception 'PANIER_INVALIDE';
  end if;

  insert into commandes (reference, nom, telephone, email, adresse, ville, note,
                         sous_total, livraison, total)
  values (reference_libre('CM', current_date), v_nom, v_tel, v_email, v_adresse,
          v_ville, v_note, 0, 0, 0)
  returning * into v_commande;

  for v_ligne in
    select nullif(a->>'produit_id', '')::uuid as produit_id,
           nullif(a->>'coffret_id', '')::uuid as coffret_id,
           greatest(1, least(99, coalesce((a->>'quantite')::int, 1))) as quantite
      from jsonb_array_elements(p_articles) as a
  loop
    if v_ligne.coffret_id is not null then
      declare
        v_coffret   coffrets;
        v_composant produits;
        v_contenu   text[] := '{}';
        v_libelle   text;
      begin
        select * into v_coffret from coffrets
         where id = v_ligne.coffret_id and actif;
        if not found then raise exception 'PRODUIT_INTROUVABLE'; end if;

        -- `for update` sur chaque flacon du coffret, comme pour un flacon
        -- vendu seul. Un produit retiré du catalogue depuis la composition du
        -- coffret est ignoré : le salon l'a sorti, il ne bloque pas la vente.
        for v_composant in
          select * from produits
           where id = any (v_coffret.produit_ids) and actif
           order by id
             for update
        loop
          if v_composant.stock < v_ligne.quantite then
            raise exception 'STOCK_INSUFFISANT:%', v_coffret.nom;
          end if;
          update produits set stock = stock - v_ligne.quantite where id = v_composant.id;
          v_contenu := v_contenu || v_composant.nom;
        end loop;

        -- Le panneau des commandes montre ce qu'il faut mettre dans le colis.
        v_libelle := case
          when cardinality(v_contenu) > 0
            then v_coffret.nom || ' (' || array_to_string(v_contenu, ', ') || ')'
          else v_coffret.nom
        end;

        insert into commande_articles (commande_id, produit_id, coffret_id, nom, prix, quantite)
        values (v_commande.id, null, v_coffret.id, v_libelle, v_coffret.prix, v_ligne.quantite);

        v_sous_total := v_sous_total + v_coffret.prix * v_ligne.quantite;
        v_nb := v_nb + 1;
        v_articles := v_articles || jsonb_build_object(
          'produit_id', null, 'coffret_id', v_coffret.id, 'nom', v_coffret.nom,
          'prix', v_coffret.prix, 'quantite', v_ligne.quantite
        );
      end;
    else
      declare
        v_produit produits;
      begin
        select * into v_produit from produits
         where id = v_ligne.produit_id and actif
         for update;

        if not found then raise exception 'PRODUIT_INTROUVABLE'; end if;
        if v_produit.stock < v_ligne.quantite then
          raise exception 'STOCK_INSUFFISANT:%', v_produit.nom;
        end if;

        update produits set stock = stock - v_ligne.quantite where id = v_produit.id;

        insert into commande_articles (commande_id, produit_id, nom, prix, quantite)
        values (v_commande.id, v_produit.id, v_produit.nom, v_produit.prix, v_ligne.quantite);

        v_sous_total := v_sous_total + v_produit.prix * v_ligne.quantite;
        v_nb := v_nb + 1;
        v_articles := v_articles || jsonb_build_object(
          'produit_id', v_produit.id, 'coffret_id', null, 'nom', v_produit.nom,
          'prix', v_produit.prix, 'quantite', v_ligne.quantite
        );
      end;
    end if;
  end loop;

  if v_nb = 0 then raise exception 'PANIER_INVALIDE'; end if;

  v_livraison := v_reglages.frais_livraison;
  if v_reglages.livraison_gratuite_des is not null
     and v_sous_total >= v_reglages.livraison_gratuite_des then
    v_livraison := 0;
  end if;

  update commandes
     set sous_total = v_sous_total,
         livraison  = v_livraison,
         total      = v_sous_total + v_livraison
   where id = v_commande.id
  returning * into v_commande;

  return jsonb_build_object(
    'reference',  v_commande.reference,
    'nom',        v_commande.nom,
    'telephone',  v_commande.telephone,
    'adresse',    v_commande.adresse,
    'ville',      v_commande.ville,
    'sous_total', v_commande.sous_total,
    'livraison',  v_commande.livraison,
    'total',      v_commande.total,
    'cree_le',    v_commande.cree_le,
    'articles',   v_articles
  );
end;
$$;

grant execute on function creer_commande(jsonb, text, text, text, text, text, text) to anon, authenticated;
