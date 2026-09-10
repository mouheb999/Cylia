-- Photos du site : lecture publique, dépôt réservé aux admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media lecture publique" on storage.objects;
create policy "media lecture publique" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');

drop policy if exists "media depot admin" on storage.objects;
create policy "media depot admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and est_admin());

drop policy if exists "media maj admin" on storage.objects;
create policy "media maj admin" on storage.objects
  for update to authenticated using (bucket_id = 'media' and est_admin());

drop policy if exists "media suppression admin" on storage.objects;
create policy "media suppression admin" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and est_admin());

-- Chiffres du tableau de bord, en une seule requête.
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
    'rdv_a_confirmer',(select count(*) from reservations
                        where date >= v_aujourdhui and statut = 'en_attente'),
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

grant execute on function statistiques_admin() to authenticated;
