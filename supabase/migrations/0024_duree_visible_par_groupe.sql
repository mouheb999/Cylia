-- La durée n'est sûre que pour les massages.
--
-- Les durées du reste du catalogue sont des estimations, reprises d'affiches
-- qui n'en donnent aucune : annoncer « 1 h 30 » sur une carte de maquillage
-- engage le salon sur un chiffre que personne n'a mesuré. Les massages, eux,
-- ont leur durée sur l'affiche.
--
-- La colonne ne supprime rien : la durée reste en base et continue de décider
-- des créneaux proposés. Elle décide seulement de ce que la carte montre —
-- et c'est un réglage par groupe, modifiable depuis le panneau, pour que le
-- jour où le salon chronomètre ses manucures il n'ait pas besoin de moi.
alter table groupes
  add column if not exists duree_visible boolean not null default false;

update groupes set duree_visible = true where id = 'massages';
