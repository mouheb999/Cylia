-- Un prix qui annonce un point de départ, pas un tarif fixe.
--
-- Une coloration ne coûte pas le même prix sur des cheveux courts et sur des
-- cheveux longs : le salon annonçait donc le plus bas des deux, et la cliente
-- lisait un tarif ferme qui ne l'était pas. Les prestations concernées se
-- marquent maintenant « à partir de » depuis le panneau, prestation par
-- prestation — le prix reste celui de la colonne `prix`, seule la façon de
-- l'annoncer change.
--
-- Rien n'est annoncé sans prix : la contrainte refuse la mention seule, qui
-- ne voudrait rien dire sur une prestation dont le tarif se donne au salon.
alter table prestations
  add column if not exists prix_a_partir_de boolean not null default false;

alter table prestations drop constraint if exists prestations_a_partir_de_avec_prix;
alter table prestations
  add constraint prestations_a_partir_de_avec_prix
  check (not prix_a_partir_de or prix is not null);
