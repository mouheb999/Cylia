-- L'affiche « Nos services » détaille trois rayons que le site résumait en
-- deux lignes : « Make-up » et « Manucure & pose d'ongles ».
--
-- Vingt-sept prestations derrière ces deux noms. Une cliente qui veut une
-- dépose de semi-permanent ou une réparation d'ongle ne pouvait pas la
-- demander en ligne — et « Ongles », seule ligne, mélangeait les mains et les
-- pieds là où l'affiche fait deux colonnes.
--
-- Durées estimées, comme pour les autres affiches : c'est la durée qui décide
-- des créneaux, à corriger dans /admin/prestations. Aucun prix — l'affiche
-- n'en donne pas.

-- --------------------------------------------------------------- les groupes
--
-- « Ongles » devient « Manucure » et garde son identifiant, donc sa photo et
-- l'historique de ses rendez-vous. La pédicure prend le groupe qui lui
-- manquait ; elle démarre sans photo, son bandeau restera vide jusqu'au
-- premier dépôt.
update groupes
   set nom = 'Manucure', description = 'Classique, spa, gel et nail art'
 where id = 'ongles';

insert into groupes (id, categorie_id, nom, description, ordre) values
  ('pedicure', 'esthetique', 'Pédicure', 'Soin des pieds, vernis et callosités', 5)
on conflict (id) do nothing;

update groupes set ordre = 6 where id = 'maquillage';

-- ---------------------------------------------------------------- le make-up
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('mu-jour',         'Maquillage de jour',        'esthetique', 'maquillage', 45, null, 'Un teint frais et un regard net, pour la journée.',        1),
  ('mu-soiree',       'Maquillage de soirée',      'esthetique', 'maquillage', 60, null, 'Des yeux plus intenses, une tenue qui passe la nuit.',    2),
  ('mu-mariee',       'Maquillage de mariée',      'esthetique', 'maquillage', 90, null, 'Le maquillage du grand jour, pensé pour les photos.',     3),
  ('mu-fiancailles',  'Maquillage de fiançailles', 'esthetique', 'maquillage', 75, null, 'Habillé et lumineux, pour la cérémonie.',                 4),
  ('mu-evenements',   'Maquillage pour événements','esthetique', 'maquillage', 60, null, 'Anniversaire, soirée, séance photo — selon l''occasion.', 5),
  ('mu-nude',         'Maquillage naturel (Nude)', 'esthetique', 'maquillage', 45, null, 'Presque rien : les traits rehaussés, pas redessinés.',    6),
  ('mu-faux-cils',    'Pose de faux cils',         'esthetique', 'maquillage', 20, null, 'Bande entière ou touffes, posées à la colle.',            7),
  ('mu-essai-mariee', 'Essai maquillage mariée',   'esthetique', 'maquillage', 60, null, 'La répétition avant le jour J : on décide ensemble.',     8)
on conflict (id) do nothing;

-- --------------------------------------------------------------- la manucure
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('manu-classique',        'Manucure classique',            'esthetique', 'ongles', 45, null, 'Ongles limés, cuticules repoussées, mains soignées.',    1),
  ('manu-spa',              'Manucure spa',                  'esthetique', 'ongles', 60, null, 'La manucure, précédée d''un gommage et d''un masque.',   2),
  ('manu-vernis-classique', 'Pose de vernis classique',      'esthetique', 'ongles', 20, null, 'Une couleur posée, séchage à l''air.',                   3),
  ('manu-vernis-semi',      'Pose de vernis semi-permanent', 'esthetique', 'ongles', 45, null, 'Une couleur qui tient deux à trois semaines.',           4),
  ('manu-depose-semi',      'Dépose de semi-permanent',      'esthetique', 'ongles', 30, null, 'Le retrait du semi-permanent, sans abîmer l''ongle.',    5),
  ('manu-gainage',          'Gainage des ongles',            'esthetique', 'ongles', 60, null, 'Une fine couche de renfort sur l''ongle naturel.',       6),
  ('manu-pose-gel',         'Pose de gel',                   'esthetique', 'ongles', 90, null, 'Des extensions en gel, longueur et forme au choix.',     7),
  ('manu-remplissage-gel',  'Remplissage gel',               'esthetique', 'ongles', 75, null, 'La reprise à la repousse, toutes les trois semaines.',   8),
  ('manu-nail-art',         'Nail Art',                      'esthetique', 'ongles', 30, null, 'Un décor sur un ongle, ou sur les dix.',                 9),
  ('manu-reparation',       'Réparation d''ongle',           'esthetique', 'ongles', 15, null, 'Un ongle cassé reconstruit, sans refaire la pose.',     10)
on conflict (id) do nothing;

-- --------------------------------------------------------------- la pédicure
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('pedi-classique',        'Pédicure classique',            'esthetique', 'pedicure', 45, null, 'Ongles coupés et limés, cuticules repoussées.',        1),
  ('pedi-spa',              'Pédicure spa',                  'esthetique', 'pedicure', 60, null, 'La pédicure, précédée d''un bain et d''un gommage.',   2),
  ('pedi-soin-complet',     'Soin complet des pieds',        'esthetique', 'pedicure', 75, null, 'Le protocole entier, des ongles aux talons.',          3),
  ('pedi-gommage',          'Gommage des pieds',             'esthetique', 'pedicure', 30, null, 'Les peaux mortes retirées, la peau redevient douce.',  4),
  ('pedi-masque',           'Masque hydratant',              'esthetique', 'pedicure', 20, null, 'Un masque nourrissant, posé sous une chaleur douce.',  5),
  ('pedi-massage',          'Massage des pieds',             'esthetique', 'pedicure', 30, null, 'Quelques minutes de pressions, pieds délassés.',       6),
  ('pedi-callosites',       'Traitement des callosités',     'esthetique', 'pedicure', 45, null, 'Les zones dures poncées, talons compris.',             7),
  ('pedi-vernis-classique', 'Pose de vernis classique',      'esthetique', 'pedicure', 20, null, 'Une couleur posée, séchage à l''air.',                 8),
  ('pedi-vernis-semi',      'Pose de vernis semi-permanent', 'esthetique', 'pedicure', 45, null, 'Une couleur qui tient deux à trois semaines.',         9)
on conflict (id) do nothing;

-- ------------------------------------------------------- les deux fourre-tout
--
-- « Make-up » et « Manucure & pose d'ongles » feraient doublon avec les
-- vingt-sept ci-dessus — comme « Épilation » en 0016 et « Head Spa » en 0019.
-- Masquées, pas effacées : les rendez-vous passés qui les mentionnent restent
-- lisibles.
update prestations set actif = false where id in ('make-up', 'ongles');
