-- Enregistre une commande de cosmétiques.
--
-- Le navigateur n'envoie que des identifiants de produits et des quantités :
-- prix, sous-total, frais de livraison et stock sont recalculés ici. Un prix
-- bidouillé dans la page n'a donc aucun effet.
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

  -- `for update` verrouille chaque produit le temps de la transaction : deux
  -- commandes simultanées ne peuvent pas vendre deux fois le dernier flacon.
  for v_ligne in
    select (a->>'produit_id')::uuid as produit_id,
           greatest(1, least(99, coalesce((a->>'quantite')::int, 1))) as quantite
      from jsonb_array_elements(p_articles) as a
  loop
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
        'produit_id', v_produit.id, 'nom', v_produit.nom,
        'prix', v_produit.prix, 'quantite', v_ligne.quantite
      );
    end;
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
