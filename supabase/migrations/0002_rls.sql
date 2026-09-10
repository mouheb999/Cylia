-- RLS : le public lit le catalogue et le contenu, seuls les admins écrivent.
-- Les réservations et les commandes ne sont jamais accessibles directement :
-- elles passent par les fonctions `security definer` de la migration 0003.

alter table administrateurs   enable row level security;
alter table reglages          enable row level security;
alter table fermetures        enable row level security;
alter table categories        enable row level security;
alter table prestations       enable row level security;
alter table reservations      enable row level security;
alter table contenus          enable row level security;
alter table galerie           enable row level security;
alter table produits          enable row level security;
alter table commandes         enable row level security;
alter table commande_articles enable row level security;

-- Un admin voit la liste des admins ; personne d'autre.
create policy "admins lisent les admins" on administrateurs
  for select to authenticated using (est_admin());

-- Lecture publique du catalogue et du contenu.
create policy "lecture publique reglages" on reglages
  for select to anon, authenticated using (true);
create policy "lecture publique fermetures" on fermetures
  for select to anon, authenticated using (true);
create policy "lecture publique categories" on categories
  for select to anon, authenticated using (true);
create policy "lecture publique prestations" on prestations
  for select to anon, authenticated using (true);
create policy "lecture publique contenus" on contenus
  for select to anon, authenticated using (true);
create policy "lecture publique galerie" on galerie
  for select to anon, authenticated using (true);
create policy "lecture publique produits" on produits
  for select to anon, authenticated using (true);

-- Écriture réservée aux admins.
create policy "admins gerent reglages" on reglages
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent fermetures" on fermetures
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent categories" on categories
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent prestations" on prestations
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent contenus" on contenus
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent galerie" on galerie
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent produits" on produits
  for all to authenticated using (est_admin()) with check (est_admin());

-- Réservations et commandes : lecture et gestion par les admins uniquement.
-- Une cliente ne peut ni les lister ni les modifier — elle passe par les RPC.
create policy "admins gerent reservations" on reservations
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent commandes" on commandes
  for all to authenticated using (est_admin()) with check (est_admin());
create policy "admins gerent commande_articles" on commande_articles
  for all to authenticated using (est_admin()) with check (est_admin());
