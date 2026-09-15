-- Les quatre packs du hammam ont été créés depuis le panneau ; il leur manque
-- leur déroulé.
--
-- Le nom et le prix ne disent pas ce que contient un pack à 379 DT. Les
-- étapes viennent des affiches, dans leur ordre, séparées par des points
-- médians — la carte affiche une ligne de texte, pas une liste à puces.
--
-- Rien d'autre n'est touché : ni les noms, ni les prix, ni les durées, ni
-- l'ordre, qui sont ceux saisis par le salon.

update prestations
   set description = 'Hammam · Gommage · Enveloppement à l''argile verte · Bain d''huile · Thé, café ou boisson'
 where id = 'pack-decouverte';

update prestations
   set description = 'Hammam · Gommage · Savon noir · Enveloppement à la Nila bleu · Brushing simple · Massage relaxant 30 mn · Thé, café ou boisson'
 where id = 'pack-evasion';

update prestations
   set description = 'Hammam · Gommage · Enveloppement à l''argile verte · Enveloppement à la Nila bleu · Savon noir · Épilation 2 zones · Soin mains et pieds · Brushing simple · Massage relaxant 30 mn · Thé, café ou boisson'
 where id = 'pack-reine';

update prestations
   set description = 'Hammam · Gommage · Massage relaxant 45 mn · Bain d''huile · Enveloppement à l''argile verte · Enveloppement à la Nila bleu · Savon noir · Épilation corps complet · Soin de visage spécifique · Soin mains et pieds · Brushing · Thé, café ou boisson'
 where id = 'pack-royal';
