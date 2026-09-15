-- Le Head Spa se vend en trois formules ; le site n'en proposait qu'une.
--
-- « Head Spa », ligne unique, ne disait ni ce qu'on y fait ni jusqu'où va le
-- rituel. Le salon en propose trois : Essentiel, Détente, Signature. Chacune
-- devient une carte, et son déroulé tient dans la phrase sous la durée — les
-- étapes de l'affiche, séparées par des points médians plutôt que par des
-- pictogrammes, que la carte ne saurait pas afficher.
--
-- Les durées sont des estimations : c'est la durée qui décide des créneaux
-- proposés, à corriger dans /admin/prestations. Les prix restent vides.

insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('head-spa-essentiel', 'Pack Head Spa Essentiel', 'bien-etre', 'head-spa',  60, null,
   'Nettoyage du cuir chevelu · Massage relaxant · Soin cheveux · Brushing', 1),
  ('head-spa-detente',   'Pack Head Spa Détente',   'bien-etre', 'head-spa',  90, null,
   'Nettoyage en profondeur · Massage cuir chevelu, nuque et épaules · Soin capillaire adapté · Vapeur · Brushing', 2),
  ('head-spa-signature', 'Pack Head Spa Signature', 'bien-etre', 'head-spa', 120, null,
   'Rituel Head Spa complet · Massage relaxant du cuir chevelu, nuque et épaules · Soin profond et vapeur · Soin capillaire premium · Brushing · Expérience bien-être complète', 3)
on conflict (id) do nothing;

-- L'ancienne prestation « Head Spa », seule ligne pour tout le rituel, ferait
-- doublon avec les trois packs — comme « Épilation » avant elle en 0016.
-- Masquée, pas effacée : les rendez-vous passés qui la mentionnent restent
-- lisibles.
update prestations set actif = false where id = 'head-spa';
