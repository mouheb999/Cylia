-- Les trois références que la source ne chiffrait pas : le salon a donné son
-- prix, 88 DT, et elles entrent en vente comme les autres.
--
-- 0012 masquait tout produit à 0 DT — publier un flacon gratuit aurait suffi à
-- le faire commander. La condition tombe d'elle-même une fois le prix posé.
update produits
   set prix  = 88.00,
       stock = greatest(stock, 12),
       actif = true
 where slug in ('care-keratin-smooth-serum',
                'keune-long-strong-shampooing-300ml',
                'keune-long-strong-shampooing-1000ml');
