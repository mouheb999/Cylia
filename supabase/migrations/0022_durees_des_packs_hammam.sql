-- Les quatre packs duraient tous une heure ; aucun ne dure une heure.
--
-- C'est la durée qui décide des créneaux proposés : à 60 minutes, le site
-- offrait pour le Pack royal des horaires que le salon ne pouvait pas tenir —
-- une épilation corps complet dure à elle seule deux heures au catalogue.
--
-- Les durées ci-dessous additionnent les étapes de l'affiche, en reprenant les
-- valeurs du catalogue quand elles existent (épilation corps complet : 120,
-- soin du visage : 60, massages : ceux des affiches) et en estimant le reste :
-- hammam 30, gommage 20, enveloppement 20, bain d'huile 20, savon noir 10,
-- brushing 30, mains et pieds 60, boisson 10.
--
-- Le total est ensuite arrondi à la demi-heure, le pas des créneaux. Les deux
-- grands packs sont arrondis vers le bas : le salon travaille à plusieurs, les
-- mains et pieds se font pendant un enveloppement. Restent des estimations —
-- à corriger dans /admin/prestations, c'est le salon qui sait.

-- 30 + 20 + 20 + 20 + 10 = 100 → 1 h 30
update prestations set duree_minutes =  90 where id = 'pack-decouverte';

-- 30 + 20 + 10 + 20 + 30 + 30 + 10 = 150 → 2 h 30
update prestations set duree_minutes = 150 where id = 'pack-evasion';

-- 30 + 20 + 20 + 20 + 10 + 30 + 60 + 30 + 30 + 10 = 260 → 4 h 30
update prestations set duree_minutes = 270 where id = 'pack-reine';

-- 30 + 20 + 45 + 20 + 20 + 20 + 10 + 120 + 60 + 60 + 30 + 10 = 445 → 6 h
update prestations set duree_minutes = 360 where id = 'pack-royal';
