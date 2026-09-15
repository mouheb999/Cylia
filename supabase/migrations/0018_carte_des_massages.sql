-- L'affiche « Nos massages » liste dix-huit soins ; le site en proposait cinq.
--
-- Les treize autres manquaient tout simplement au catalogue : impossible de
-- réserver un massage suédois ou une réflexologie en ligne. Cette migration
-- remet la liste au complet, dans l'ordre de l'affiche, et donne à chaque
-- massage une phrase courte — la carte du tunnel l'affiche sous la durée, et
-- « Massage aux pochons d'herbes chaudes » ne dit pas, seul, ce qui attend la
-- cliente.
--
-- Les durées sont des estimations, sauf l'heure du californien que l'affiche
-- précise : c'est la durée qui décide des créneaux proposés, à corriger dans
-- /admin/prestations. Les prix restent vides — l'affiche n'en donne aucun.

insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('massage-suedois',             'Massage suédois',                       'bien-etre', 'massages', 60, null, 'Plus appuyé, il dénoue les muscles fatigués.',        2),
  ('massage-deep-tissue',         'Massage deep tissue (tissus profonds)', 'bien-etre', 'massages', 60, null, 'Un travail lent sur les tensions installées.',        5),
  ('massage-anti-stress',         'Massage anti-stress',                   'bien-etre', 'massages', 45, null, 'Une parenthèse calme, pour faire retomber la pression.', 6),
  ('massage-dos-epaules',         'Massage du dos et des épaules',         'bien-etre', 'massages', 30, null, 'Ciblé là où la journée s''accumule.',                 7),
  ('massage-jambes-lourdes',      'Massage des jambes lourdes',            'bien-etre', 'massages', 45, null, 'Remonte des pieds aux cuisses, jambes allégées.',     8),
  ('massage-reflexologie',        'Massage des pieds (réflexologie plantaire)', 'bien-etre', 'massages', 45, null, 'Des points sous la voûte plantaire, détente générale.', 9),
  ('massage-cranien',             'Massage crânien (tête, nuque et épaules)',   'bien-etre', 'massages', 30, null, 'Tête, nuque et épaules, en position assise.',    10),
  ('massage-visage-cuir-chevelu', 'Massage visage et cuir chevelu',        'bien-etre', 'massages', 45, null, 'Effleurages du visage jusqu''au cuir chevelu.',      11),
  ('massage-sportif',             'Massage sportif',                       'bien-etre', 'massages', 60, null, 'Rythme soutenu, avant ou après l''effort.',          12),
  ('massage-amincissant',         'Massage amincissant / anti-cellulite',  'bien-etre', 'massages', 45, null, 'Palper-rouler sur les zones à lisser.',              14),
  ('massage-prenatal',            'Massage prénatal',                      'bien-etre', 'massages', 60, null, 'Pour les femmes enceintes, sur le côté et en douceur.', 15),
  ('massage-bougies',             'Massage aux bougies',                   'bien-etre', 'massages', 60, null, 'La cire fond en huile tiède, versée sur la peau.',   17),
  ('massage-pochons',             'Massage aux pochons d''herbes chaudes', 'bien-etre', 'massages', 75, null, 'Des pochons d''herbes chauds, pressés le long du dos.', 18)
on conflict (id) do nothing;

-- Les cinq massages déjà en ligne n'avaient pas de phrase, et leur ordre datait
-- d'avant l'affiche. Mêmes soins, même identifiant : les rendez-vous passés qui
-- les mentionnent restent lisibles.
update prestations set description = 'Des pressions lentes et enveloppantes, pour relâcher.', ordre =  1 where id = 'massage-relaxant';
update prestations set description = 'Des huiles choisies selon l''humeur du jour.',          ordre =  3 where id = 'huiles-essentielles';
update prestations set description = 'La chaleur des pierres détend en profondeur.',          ordre =  4 where id = 'pierres-chaudes';
update prestations set description = 'Des mouvements légers qui relancent la circulation.',   ordre = 13 where id = 'drainant';
update prestations set description = 'À deux, dans la même cabine — en couple ou entre amis.', ordre = 16 where id = 'massage-duo';
