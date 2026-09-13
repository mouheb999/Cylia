-- Ranger la boutique.
--
-- `categorie` dit dans quel rayon d'institut un produit vit — visage, cheveux,
-- corps. Avec deux cents flacons tous « cheveux », ce rayon ne range plus rien.
-- `famille` dit ce que le produit *est* : un shampooing, un masque, une
-- coloration. C'est elle qui filtre la vitrine et le panneau ; `categorie`
-- reste pour le jour où le salon vendra autre chose que du capillaire.

alter table produits
  add column if not exists famille text not null default 'soin';

create index if not exists produits_famille_idx on produits (actif, famille, ordre);

/*
 * Le classement se lit dans le nom, et l'ordre des branches est le classement :
 * la première qui répond gagne. C'est ce qui évite le contresens le plus
 * courant du catalogue — un « Color Brillianz Shampooing » soigne une couleur,
 * il ne la pose pas : la branche « shampooing » passe donc avant « coloration »
 * n'attrape ce qui reste de « color » que sur les vrais tubes de teinture.
 *
 * Écrit en règles plutôt qu'en liste de références pour que les produits
 * ajoutés plus tard se rangent aussi, en rejouant cette seule instruction.
 */
create or replace function famille_produit(p_nom text, p_marque text)
returns text
language sql
immutable
as $$
  select case
    when p_nom ~* 'beard|shaving|barbe|rasage' then 'barbe'
    when p_nom ~* 'bouteille|réutilisable'     then 'accessoire'
    -- Colore, décolore ou révèle : le geste technique, pas le soin d'entretien.
    when p_nom ~* 'tinta color 60|semi color|so pure color 60|developer|magic blond'
              '|ultimate blond|blonde lift|blonde neutralizing|activator'
              '|hair straightener|after blonde'                then 'coloration'
    when p_nom ~* 'après-shampoo|apres-shampoo|conditio'       then 'apres-shampooing'
    when p_nom ~* 'shampooing|shampoo|low-poo'                 then 'shampooing'
    -- Keune Style est la ligne coiffage entière ; la gamme 2023 porte en plus
    -- des noms de fantaisie qu'aucun mot-clé ne trahit.
    when p_marque = 'Keune Style' or p_nom in (
           'Tame Game', 'Free Styler', 'FIXER', 'Shine Therapy', 'Velvet Cloud',
           'Air Wax', 'Stardust', 'High Rise', 'Clean Slate', 'Rush Hour',
           'Resetter', 'Power Paste', 'Smooth Operator', 'Matte Measure'
         )                                                     then 'coiffage'
    when p_nom ~* 'leave-in|sans rinçage|2 phase|protector|filler|thickening'
              '|\ymist\y|\ybalm\y|\ylotion\y'                   then 'sans-rincage'
    when p_nom ~* 'masque|mask|creambath|treatment|bond fusion' then 'masque'
    when p_nom ~* '\yoil\y|huile|serum|sérum|elixir|élixir'     then 'huile-serum'
    when p_nom ~* 'gel|wax|cire|paste|pâte|pommade|pomade|clay|argile|mousse'
              '|laque|fibre|texture|mud|shaper'                 then 'coiffage'
    when p_nom ~* 'spray|cream|crème'                           then 'sans-rincage'
    else 'soin'
  end;
$$;

update produits set famille = famille_produit(nom, marque);

-- Tout le catalogue est en vente. Le stock reste une supposition — douze
-- unités — que le salon corrige produit par produit depuis /admin/produits ;
-- l'important est qu'aucune référence ne soit invisible par accident.
update produits set actif = true where prix > 0 and not actif;
update produits set stock = 12  where prix > 0 and stock = 0;

-- Sauf trois références que la source ne chiffre pas : les publier à 0 DT
-- reviendrait à les donner. Elles restent masquées jusqu'à ce qu'un prix leur
-- soit mis dans le panneau.
update produits set actif = false where prix = 0;
