-- Le salon ne regardait son panneau que parce qu'il pensait à le regarder.
--
-- Trois manques tenaient ensemble : rien ne poussait une nouvelle demande vers
-- l'écran ouvert, rien ne prévenait quand l'écran était fermé, et la base
-- acceptait n'importe quel enchaînement de statuts. Cette migration règle les
-- trois.

-- ------------------------------------------------------------- temps réel
-- Realtime respecte RLS : ces deux tables ne sont lisibles que par une session
-- administratrice, un abonnement anonyme ne reçoit donc rien.
do $$
begin
  alter publication supabase_realtime add table reservations;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table commandes;
exception
  when duplicate_object then null;
end;
$$;

-- Le repli du temps réel est un sondage « quoi de neuf depuis telle heure ? ».
-- Sans cet index, il relit la table entière à chaque passage.
create index if not exists reservations_cree_le_idx on reservations (cree_le desc);

-- ------------------------------------------------------ abonnements push
-- Un appareil, un abonnement. `endpoint` est l'adresse que le navigateur donne
-- au service de push ; elle est unique par appareil et par installation, donc
-- elle sert de clé : réinstaller la PWA crée une ligne, elle ne la duplique pas.
create table if not exists abonnements_push (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh   text not null,
  auth     text not null,
  agent    text,
  cree_le  timestamptz not null default now(),
  vu_le    timestamptz not null default now()
);

create index if not exists abonnements_push_user_idx on abonnements_push (user_id);

alter table abonnements_push enable row level security;

-- Chacune ne voit et ne gère que ses propres appareils. L'envoi, lui, se fait
-- côté serveur avec la clé de service : il ne passe pas par ces policies.
drop policy if exists "admins gerent leurs abonnements" on abonnements_push;
create policy "admins gerent leurs abonnements" on abonnements_push
  for all to authenticated
  using (est_admin() and user_id = auth.uid())
  with check (est_admin() and user_id = auth.uid());

-- -------------------------------------------------- transitions de statut
-- L'interface ne propose que les suites qui ont un sens — mais une action
-- serveur est joignable par un simple POST, et rien n'empêchait jusqu'ici de
-- faire passer un rendez-vous annulé directement à « terminé ». La règle vit
-- désormais là où elle fait foi.
create or replace function reservations_transition_valide()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  -- Réécrire le même statut n'est pas une transition : le panneau peut
  -- renvoyer deux fois le même clic sans que ce soit une erreur.
  if new.statut = old.statut then
    return new;
  end if;

  if not (
       (old.statut = 'en_attente' and new.statut in ('confirmee', 'annulee'))
    or (old.statut = 'confirmee'  and new.statut in ('terminee', 'annulee'))
    or (old.statut = 'terminee'   and new.statut = 'confirmee')
    or (old.statut = 'annulee'    and new.statut = 'en_attente')
  ) then
    raise exception 'TRANSITION_INVALIDE';
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_transition on reservations;
create trigger reservations_transition
  before update of statut on reservations
  for each row execute function reservations_transition_valide();

-- ------------------------------------------------- demandes oubliées
-- `rdv_a_confirmer` ne comptait que les demandes à venir. Une demande arrivée
-- vendredi pour samedi et jamais traitée sortait du compte dimanche : le
-- tableau de bord affichait zéro, et la cliente attendait toujours. Elle est
-- maintenant comptée tant qu'elle est en attente, et `rdv_en_retard` isole
-- celles dont le créneau est déjà passé — les seules qui demandent un appel
-- d'excuse plutôt qu'une confirmation.
create or replace function statistiques_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_aujourdhui date := maintenant_salon()::date;
begin
  if not est_admin() then
    raise exception 'ACCES_REFUSE';
  end if;

  return jsonb_build_object(
    'rdv_aujourdhui', (select count(*) from reservations
                        where date = v_aujourdhui and statut in ('en_attente', 'confirmee')),
    'rdv_a_venir',    (select count(*) from reservations
                        where date >= v_aujourdhui and statut in ('en_attente', 'confirmee')),
    'rdv_a_confirmer',(select count(*) from reservations where statut = 'en_attente'),
    'rdv_en_retard',  (select count(*) from reservations
                        where statut = 'en_attente' and date < v_aujourdhui),
    'rdv_semaine',    (select count(*) from reservations
                        where date between v_aujourdhui and v_aujourdhui + 6
                          and statut in ('en_attente', 'confirmee')),
    'commandes_a_traiter', (select count(*) from commandes where statut = 'en_attente'),
    'commandes_mois',      (select count(*) from commandes
                             where cree_le >= date_trunc('month', now())),
    'chiffre_mois',   (select coalesce(sum(total), 0) from commandes
                        where statut <> 'annulee' and cree_le >= date_trunc('month', now())),
    'produits_actifs',(select count(*) from produits where actif),
    'rupture_stock',  (select count(*) from produits where actif and stock = 0),
    'prestations_actives', (select count(*) from prestations where actif)
  );
end;
$$;

revoke execute on function statistiques_admin() from public, anon;
grant execute on function statistiques_admin() to authenticated;
