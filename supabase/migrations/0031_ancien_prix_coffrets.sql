-- Un prix barré, facultatif, sur les coffrets — comme `ancien_prix` sur les
-- produits depuis la 0001.
--
-- Rempli depuis le panneau, il s'affiche barré à côté du prix du coffret,
-- avec le pourcentage de remise. Vide (le cas de tous les coffrets à la
-- création de cette colonne), le site garde son comportement d'avant : il
-- barre le total des flacons achetés séparément quand il est plus haut.
--
-- `donnees_publiques()` lit la ligne entière (`to_jsonb(cf)`) : la colonne y
-- apparaît sans autre changement. Aucune valeur n'est posée ici.

alter table coffrets
  add column if not exists ancien_prix numeric(10, 2)
    check (ancien_prix is null or ancien_prix >= 0);
