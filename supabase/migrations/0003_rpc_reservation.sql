-- Le salon est à Sousse : « aujourd'hui » se juge à l'heure de Tunis,
-- jamais à celle du serveur.
--
-- Note : `search_path` est figé par la migration 0009.
create or replace function maintenant_salon()
returns timestamp
language sql
stable
as $$
  select (now() at time zone 'Africa/Tunis')::timestamp;
$$;

-- Créneaux déjà pris un jour donné, sans aucune donnée personnelle :
-- c'est tout ce dont la visiteuse a besoin pour voir les disponibilités.
create or replace function occupation_du_jour(p_date date)
returns table (debut int, fin int)
language sql
stable
security definer
set search_path = public
as $$
  select heure_minutes, heure_minutes + duree_minutes
    from reservations
   where date = p_date
     and statut in ('en_attente', 'confirmee');
$$;

create or replace function reference_libre(p_prefixe text, p_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_essai int := 0;
begin
  loop
    v_ref := p_prefixe || '-' || to_char(p_date, 'DDMM') || '-' ||
             upper(substr(md5(random()::text || clock_timestamp()::text), 1, 3));
    exit when not exists (select 1 from reservations where reference = v_ref)
         and not exists (select 1 from commandes where reference = v_ref);
    v_essai := v_essai + 1;
    if v_essai > 20 then
      raise exception 'REFERENCE_INDISPONIBLE';
    end if;
  end loop;
  return v_ref;
end;
$$;

-- Enregistre un rendez-vous.
--
-- Tout est revérifié ici : durées et prix sont relus dans `prestations`, jamais
-- repris du navigateur, et la place est recomptée au moment de l'écriture — ce
-- qui ferme la course entre deux clientes qui visent le même créneau.
--
-- Version définitive dans la migration 0007 (refus des doublons).
create or replace function creer_reservation(
  p_prestation_ids text[],
  p_date           date,
  p_heure_minutes  int,
  p_nom            text,
  p_telephone      text,
  p_note           text default null
)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reglages    reglages;
  v_nb          int;
  v_duree       int;
  v_prix        numeric(10, 2);
  v_noms        text[];
  v_simultanes  int;
  v_maintenant  timestamp := maintenant_salon();
  v_reservation reservations;
  v_nom         text := btrim(coalesce(p_nom, ''));
  v_tel         text := btrim(coalesce(p_telephone, ''));
  v_note        text := nullif(btrim(coalesce(p_note, '')), '');
begin
  select * into v_reglages from reglages where id = 1;
  if not found or not v_reglages.reservation_active then
    raise exception 'RESERVATIONS_FERMEES';
  end if;

  if char_length(v_nom) < 2 or char_length(v_nom) > 80 then
    raise exception 'NOM_INVALIDE';
  end if;

  if regexp_replace(v_tel, '[^0-9]', '', 'g') !~ '^[0-9]{8,15}$' then
    raise exception 'TELEPHONE_INVALIDE';
  end if;

  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'NOTE_TROP_LONGUE';
  end if;

  if p_prestation_ids is null or cardinality(p_prestation_ids) = 0
     or cardinality(p_prestation_ids) > 10 then
    raise exception 'PRESTATIONS_INVALIDES';
  end if;

  select count(*)::int,
         coalesce(sum(p.duree_minutes), 0)::int,
         case when count(*) filter (where p.prix is null) > 0
              then null else sum(p.prix) end,
         array_agg(p.nom order by u.ord)
    into v_nb, v_duree, v_prix, v_noms
    from unnest(p_prestation_ids) with ordinality as u(id, ord)
    join prestations p on p.id = u.id and p.actif;

  if v_nb is null or v_nb <> cardinality(p_prestation_ids) then
    raise exception 'PRESTATIONS_INVALIDES';
  end if;

  if p_date < v_maintenant::date then
    raise exception 'DATE_PASSEE';
  end if;

  if p_date > (v_maintenant::date + v_reglages.jours_proposes) then
    raise exception 'DATE_TROP_LOIN';
  end if;

  if p_heure_minutes < v_reglages.ouverture_minutes
     or p_heure_minutes + v_duree > v_reglages.fermeture_minutes
     or (p_heure_minutes - v_reglages.ouverture_minutes) % v_reglages.pas_minutes <> 0 then
    raise exception 'HORAIRE_INVALIDE';
  end if;

  if p_date = v_maintenant::date
     and p_heure_minutes < (extract(hour from v_maintenant) * 60
                            + extract(minute from v_maintenant)
                            + v_reglages.delai_minimum_minutes) then
    raise exception 'CRENEAU_TROP_PROCHE';
  end if;

  if exists (select 1 from fermetures f
              where p_date between f.date_debut and f.date_fin) then
    raise exception 'SALON_FERME';
  end if;

  select count(*)::int into v_simultanes
    from reservations r
   where r.date = p_date
     and r.statut in ('en_attente', 'confirmee')
     and r.heure_minutes < p_heure_minutes + v_duree
     and p_heure_minutes < r.heure_minutes + r.duree_minutes;

  if v_simultanes >= v_reglages.capacite_simultanee then
    raise exception 'CRENEAU_INDISPONIBLE';
  end if;

  insert into reservations (
    reference, prestation_ids, prestations_nom, date, heure_minutes,
    duree_minutes, nom, telephone, note, prix_total
  ) values (
    reference_libre('CY', p_date), p_prestation_ids, v_noms, p_date,
    p_heure_minutes, v_duree, v_nom, v_tel, v_note, v_prix
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;

grant execute on function occupation_du_jour(date) to anon, authenticated;
grant execute on function creer_reservation(text[], date, int, text, text, text) to anon, authenticated;
revoke execute on function reference_libre(text, date) from public;
