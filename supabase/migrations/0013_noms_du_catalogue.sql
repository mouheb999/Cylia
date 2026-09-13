-- Deux coquilles de la source, recopiées telles quelles par l'import.
--
-- « S pray » est une faute de frappe du catalogue d'origine ; le slug la
-- portait aussi, et il part dans l'adresse de la fiche. Le nom du fichier
-- photo, lui, ne bouge pas : c'est un nom de fichier, personne ne le lit.
update produits
   set slug = 'blonde-neutralizing-spray',
       nom  = 'Blonde Neutralizing Spray'
 where slug = 'blonde-neutralizing-s-pray';

-- La barre verticale venait d'un titre de la source, pas d'un nom de produit.
-- Ces deux références ne font pas doublon avec les « Derma Regulate
-- Shampooing » : c'est le même soin dans un flacon redessiné, et le salon
-- écoule les deux — d'où la mention, mais lisible.
update produits
   set nom = replace(nom, ' | Nouveau packaging ', ' (nouveau flacon) ')
 where nom like '%| Nouveau packaging %';
