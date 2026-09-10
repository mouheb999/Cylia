insert into categories (id, nom, description, ordre) values
  ('coiffure',   'Coiffure',   'Coupe, couleur, soin & style',      1),
  ('esthetique', 'Esthétique', 'Soins visage, épilation, ongles',   2),
  ('bien-etre',  'Bien-être',  'Massages, relaxation, équilibre',   3)
on conflict (id) do nothing;

insert into prestations (id, nom, categorie_id, duree_minutes, ordre) values
  ('coupe-brushing',      'Coupe & brushing',                       'coiffure',   60,  1),
  ('coloration',          'Coloration',                             'coiffure',  120,  2),
  ('balayage',            'Balayage & mèches',                      'coiffure',  150,  3),
  ('soin-capillaire',     'Soin capillaire Keune',                  'coiffure',   45,  4),
  ('head-spa',            'Head Spa',                               'coiffure',   60,  5),
  ('hydrafacial',         'Soin visage Hydrafacial',                'esthetique', 60,  1),
  ('hifu',                'HIFU — lifting non chirurgical',         'esthetique', 90,  2),
  ('epilation',           'Épilation',                              'esthetique', 45,  3),
  ('ongles',              'Manucure & pose d''ongles',              'esthetique', 90,  4),
  ('make-up',             'Make-up',                                'esthetique', 60,  5),
  ('massage-relaxant',    'Massage relaxant (californien)',         'bien-etre',  60,  1),
  ('pierres-chaudes',     'Massage aux pierres chaudes',            'bien-etre',  75,  2),
  ('huiles-essentielles', 'Massage aux huiles essentielles',        'bien-etre',  60,  3),
  ('drainant',            'Massage drainant (drainage lymphatique)','bien-etre',  60,  4),
  ('massage-duo',         'Massage en duo',                         'bien-etre',  60,  5)
on conflict (id) do nothing;

insert into produits (slug, nom, marque, description, prix, categorie, stock, ordre) values
  ('serum-eclat-vitamine-c', 'Sérum éclat vitamine C', 'CYLIA',
   'Un sérum léger qui ravive le teint et estompe les taches. À appliquer le matin, avant la crème hydratante.',
   89.00, 'visage', 12, 1),
  ('creme-hydratante-jour', 'Crème hydratante de jour', 'CYLIA',
   'Hydratation légère et fini mat, pensée pour les peaux mixtes. Se porte seule ou sous le maquillage.',
   75.00, 'visage', 15, 2),
  ('huile-precieuse-cheveux', 'Huile précieuse cheveux', 'Keune',
   'Quelques gouttes sur les longueurs pour discipliner et faire briller, sans alourdir.',
   62.00, 'cheveux', 20, 3),
  ('masque-reparateur', 'Masque réparateur profond', 'Keune',
   'Le soin des cheveux fatigués par la couleur ou la chaleur. Une pose de dix minutes suffit.',
   68.00, 'cheveux', 10, 4),
  ('gommage-corps-argan', 'Gommage corps à l''argan', 'CYLIA',
   'Grains fins et huile d''argan : la peau reste douce longtemps après la douche.',
   55.00, 'corps', 18, 5),
  ('bougie-massage', 'Bougie de massage', 'CYLIA',
   'La cire fond en huile tiède — celle utilisée en cabine pour les massages relaxants.',
   48.00, 'bien-etre', 8, 6)
on conflict (slug) do nothing;

update reglages
   set frais_livraison = 7,
       livraison_gratuite_des = 150
 where id = 1;
