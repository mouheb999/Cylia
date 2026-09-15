-- L'affiche « Coiffure » range le rayon en six colonnes ; le site en avait
-- trois, et quatre prestations en tout.
--
-- Trois lignes fourre-tout portaient tout le reste : « Coupe & brushing »
-- mélangeait deux gestes que l'affiche sépare, « Balayage & mèches » deux
-- techniques d'éclaircissement, et « Coloration & mèches » réunissait un
-- groupe que l'affiche coupe en deux — la couleur d'un côté,
-- l'éclaircissement de l'autre.
--
-- Durées estimées : l'affiche n'en donne aucune. Elles ne s'affichent pas sur
-- les cartes (`duree_visible` est faux pour ces groupes) mais décident des
-- créneaux proposés — à corriger dans /admin/prestations. Aucun prix non plus.

-- ---------------------------------------------------------------- les groupes
--
-- Les trois groupes existants gardent leur identifiant, donc leur photo et
-- leurs rendez-vous. Les trois nouveaux démarrent sans photo : leur bandeau
-- restera vide jusqu'au premier dépôt.
update groupes set nom = 'Coupe & brushing', description = 'Coupe, brushing, mise en plis', ordre = 1 where id = 'coupe-coiffage';
update groupes set nom = 'Coloration',       description = 'Racines, complète, patine, ton sur ton', ordre = 2 where id = 'coloration';
update groupes set                           description = 'Soin, botox, lissage, cuir chevelu', ordre = 4 where id = 'soins-capillaires';

insert into groupes (id, categorie_id, nom, description, ordre) values
  ('eclaircissement',       'coiffure', 'Éclaircissement',        'Mèches, balayage, ombré, décoloration', 3),
  ('coiffure-evenementiel', 'coiffure', 'Coiffure & événementiel','Chignon, soirée, mariée',               5),
  ('autres-coiffure',       'coiffure', 'Autres prestations',     'Extensions, permanente, diagnostic',    6)
on conflict (id) do nothing;

-- ------------------------------------------------------------ coupe & brushing
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('coiff-coupe',            'Coupe',            'coiffure', 'coupe-coiffage', 45, null, 'La coupe seule, lavage compris.',                     1),
  ('coiff-brushing',         'Brushing',         'coiffure', 'coupe-coiffage', 30, null, 'Le séchage mis en forme, lisse ou bouclé.',           2),
  ('coiff-mise-en-plis',     'Mise en plis',     'coiffure', 'coupe-coiffage', 45, null, 'Les cheveux mis en forme sur bigoudis, puis séchés.', 3),
  ('coiff-coiffage-express', 'Coiffage express', 'coiffure', 'coupe-coiffage', 20, null, 'Une remise en forme rapide, sans lavage.',            4)
on conflict (id) do nothing;

-- ------------------------------------------------------------------ coloration
update prestations
   set nom = 'Coloration complète',
       description = 'La couleur reprise sur toute la chevelure.',
       ordre = 2
 where id = 'coloration';

insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('color-racines',          'Coloration racines',         'coiffure', 'coloration',  90, null, 'La retouche des racines, sans toucher aux longueurs.',      1),
  ('color-patine-gloss',     'Patine / Gloss',             'coiffure', 'coloration',  45, null, 'Un voile de couleur qui ravive le reflet et fait briller.', 3),
  ('color-ton-sur-ton',      'Ton sur ton',                'coiffure', 'coloration',  60, null, 'Le ton se dépose sans éclaircir la base.',                  4),
  ('color-sans-ammoniaque',  'Coloration sans ammoniaque', 'coiffure', 'coloration', 120, null, 'Une formule plus douce, selon disponibilité.',              5)
on conflict (id) do nothing;

-- ------------------------------------------------------------- éclaircissement
update prestations
   set nom = 'Balayage',
       groupe_id = 'eclaircissement',
       description = 'Un éclaircissement fondu, plus clair vers les pointes.',
       ordre = 2
 where id = 'balayage';

insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('ecl-meches',        'Mèches',              'coiffure', 'eclaircissement', 120, null, 'Des mèches prises au pinceau, mèche à mèche.',                1),
  ('ecl-ombre-hair',    'Ombré Hair',          'coiffure', 'eclaircissement', 150, null, 'Un dégradé des racines foncées vers des pointes claires.',    3),
  ('ecl-babylights',    'Babylights',          'coiffure', 'eclaircissement', 150, null, 'Des mèches très fines, comme un éclaircissement d''enfance.', 4),
  ('ecl-contouring',    'Contouring cheveux',  'coiffure', 'eclaircissement', 120, null, 'Des éclaircissements placés autour du visage, pour l''éclairer.', 5),
  ('ecl-decoloration',  'Décoloration',        'coiffure', 'eclaircissement', 150, null, 'Le pigment retiré, avant une couleur claire ou vive.',        6)
on conflict (id) do nothing;

-- ------------------------------------------------------------ soins capillaires
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('soin-profond',         'Soin profond',                   'coiffure', 'soins-capillaires',  45, null, 'Un masque qui travaille en profondeur, sous la chaleur.',      1),
  ('soin-hydratant',       'Soin hydratant',                 'coiffure', 'soins-capillaires',  30, null, 'De l''eau rendue aux cheveux secs.',                           2),
  ('soin-reparateur',      'Soin réparateur',                'coiffure', 'soins-capillaires',  45, null, 'Pour les fibres fatiguées par la couleur ou le fer.',          3),
  ('botox-capillaire',     'Botox capillaire',               'coiffure', 'soins-capillaires',  90, null, 'Un comblement de la fibre : les cheveux retrouvent du corps.', 4),
  ('lissage-collagene',    'Lissage au collagène / protéine','coiffure', 'soins-capillaires', 150, null, 'Un lissage nourrissant, qui discipline sans casser la boucle.', 5),
  ('massage-cuir-chevelu', 'Massage du cuir chevelu',        'coiffure', 'soins-capillaires',  30, null, 'Des pressions lentes, avant ou après le soin.',                6)
on conflict (id) do nothing;

-- ------------------------------------------------------ coiffure & événementiel
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('evt-chignon',      'Chignon',               'coiffure', 'coiffure-evenementiel', 60, null, 'Relevé, souple ou net, selon la tenue.',                  1),
  ('evt-soiree',       'Coiffure de soirée',    'coiffure', 'coiffure-evenementiel', 60, null, 'Une mise en forme qui tient toute la soirée.',            2),
  ('evt-mariee',       'Coiffure de mariée',    'coiffure', 'coiffure-evenementiel', 90, null, 'La coiffure du grand jour, pensée avec le voile.',        3),
  ('evt-pose-voile',   'Pose de voile',         'coiffure', 'coiffure-evenementiel', 30, null, 'Le voile fixé sur la coiffure, essayé jusqu''au bon tombé.', 4),
  ('evt-essai-mariee', 'Essai coiffure mariée', 'coiffure', 'coiffure-evenementiel', 60, null, 'La répétition avant le jour J : on décide ensemble.',     5)
on conflict (id) do nothing;

-- ---------------------------------------------------------- autres prestations
insert into prestations (id, nom, categorie_id, groupe_id, duree_minutes, prix, description, ordre) values
  ('autre-extensions', 'Extensions de cheveux',             'coiffure', 'autres-coiffure', 180, null, 'De la longueur ou du volume ajoutés, mèche par mèche.',        1),
  ('autre-frange',     'Pose de frange',                    'coiffure', 'autres-coiffure',  20, null, 'Une frange posée et mise en forme.',                           2),
  ('autre-permanente', 'Permanente',                        'coiffure', 'autres-coiffure', 150, null, 'Des boucles durables, formées à froid.',                       3),
  ('autre-defrisage',  'Défrisage / Lissage',               'coiffure', 'autres-coiffure', 150, null, 'Les cheveux détendus durablement, lisses au quotidien.',       4),
  ('autre-diagnostic', 'Diagnostic capillaire personnalisé','coiffure', 'autres-coiffure',  30, null, 'Un examen du cheveu et du cuir chevelu, avant de choisir.',    5)
on conflict (id) do nothing;

-- --------------------------------------------------------- les deux fourre-tout
--
-- « Coupe & brushing » fait doublon avec la coupe et le brushing séparés ;
-- « Soin capillaire Keune » avec les six soins de l'affiche. Masquées, pas
-- effacées : les rendez-vous passés qui les mentionnent restent lisibles.
update prestations set actif = false where id in ('coupe-brushing', 'soin-capillaire');
