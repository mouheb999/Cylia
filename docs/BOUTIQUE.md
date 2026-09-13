# Boutique de cosmétiques

## Le parcours

`/boutique` liste les produits actifs. Chaque fiche (`/boutique/<slug>`) montre
la description, le prix, l'état du stock et permet de choisir une quantité.
`/boutique/panier` récapitule, demande les coordonnées de livraison et
enregistre la commande.

Le paiement se fait **à la livraison**. Aucun moyen de paiement en ligne n'est
intégré, et le site le dit à la cliente à chaque étape.

## Ce que le navigateur ne décide pas

Le panier du navigateur ne contient que des **identifiants et des quantités**.
Au moment de commander, `creer_commande` relit tout dans la base :

- le prix de chaque produit — un prix modifié dans la page n'a aucun effet ;
- le sous-total et les frais de livraison, selon les réglages du salon ;
- le stock disponible.

Chaque produit est verrouillé (`for update`) le temps de la transaction : deux
commandes simultanées ne peuvent pas vendre deux fois le dernier flacon. Si le
stock manque, la commande entière est refusée, en nommant le produit fautif.

La commande fige le nom et le prix de chaque article au moment de l'achat :
changer un prix demain ne réécrit pas les commandes d'hier.

## Stock

Le stock diminue à l'enregistrement de la commande. À zéro, le produit reste
affiché mais ne peut plus être ajouté au panier — il porte la mention
« Épuisé », qui est une information utile pour la cliente, là où un produit
disparu ne dit rien.

Le tableau de bord compte les ruptures ; `/admin/produits` les signale ligne
par ligne. Le stock se corrige à la main dans la fiche produit — il n'y a pas
de réapprovisionnement automatique.

## Livraison

Deux réglages, dans `/admin/reglages` :

- **frais de livraison** — appliqués à toute commande ;
- **livraison offerte à partir de** — laisser vide pour ne jamais l'offrir.

Ces règles sont appliquées côté base, pas dans la page.

## Le catalogue Keune

Les 202 références Keune vendues au salon ont été relevées sur
[maisonkeune.tn](https://www.maisonkeune.tn/), le distributeur Keune en Tunisie
déjà cité en bas de la boutique, et semées par
`supabase/migrations/0011_catalogue_keune.sql` — qui efface au passage les six
produits de démonstration de 0006, devenus inutiles. Trois choix méritent
d'être connus, parce qu'ils viennent d'un écart entre la source et cette
table :

- **Une taille, un produit.** `produits` n'a qu'un prix par ligne. Un soin
  vendu en 250 ml et en 1000 ml est donc deux produits, chacun à son prix,
  plutôt qu'un seul affiché au prix du plus petit.
- **Une coloration, un produit.** Toutes les nuances d'une même coloration sont
  au même prix : les éclater ferait des centaines de lignes pour rien. La fiche
  dit combien de nuances existent et invite la cliente à préciser la sienne
  dans la note de commande.
- **Le stock est une supposition.** La source ne le publie pas : tout part à
  douze unités, à corriger dans `/admin/produits`, où la quantité se change
  dans la liste sans ouvrir la fiche.

Trois références restent masquées : la source ne leur donne aucun prix, et les
publier à 0 DT reviendrait à les donner. Elles s'afficheront dès qu'un prix
leur sera mis dans le panneau.

Deux détails de fidélité : les prix en millimes (67,375 DT) sont arrondis au
centime par `numeric(10, 2)`, ce qui touche douze références ; et deux fiches
de la source décrivaient un autre produit que le leur — elles sont laissées
vides plutôt que fausses, comme les douze que la source ne décrit pas.

## Trier deux cents flacons

Une vitrine de deux cents produits ne se parcourt pas au doigt. Trois entrées,
au-dessus de la grille :

- les **familles**, en puces — shampooings, après-shampooings, masques,
  sans rinçage, huiles & sérums, coiffage, coloration, barbe, accessoires ;
- les **gammes**, en liste — Keune Care, Keune Style, Keune So Pure,
  1922 by J.M. Keune ;
- le **tri** — ordre du catalogue, prix croissant ou décroissant, nom.

La famille est une colonne de la table, pas une devinette faite à l'affichage :
`categorie` dit dans quel rayon d'institut un produit vit (visage, cheveux,
corps), la famille dit ce qu'il **est**. Avec deux cents flacons tous
« cheveux », seule la seconde range quelque chose.

Elle est posée par une fonction en base, `famille_produit(nom, marque)`, et non
par une liste de références : un produit ajouté plus tard se range aussi, et le
classement se rejoue d'une seule instruction. L'ordre de ses règles compte — un
« Color Brillianz Shampooing » soigne une couleur, il ne la pose pas : la règle
« shampooing » passe donc avant « coloration ».

Les compteurs des puces suivent la gamme choisie, et l'inverse : ils annoncent
ce qu'on trouvera vraiment. Une famille vide ne s'affiche pas. Sous douze
produits, les filtres disparaissent — ils encombreraient plus qu'ils
n'aideraient. Quel que soit le tri, un produit épuisé passe derrière les
autres.

## Photos

Un produit sans photo n'affiche pas un rectangle gris : il montre un carré doré
portant son initiale. La vitrine reste présentable le temps que le salon
photographie ses flacons, et l'absence de photo ne ressemble pas à une panne.

Les photos s'ajoutent depuis la fiche produit, dans le panneau ou en mode
édition sur `/boutique`.

Les photos du catalogue Keune ont été **rapatriées** dans le bucket `media` du
projet, sous `produits/<slug>`, plutôt que pointées chez le distributeur : la
boutique ne dépend d'aucun site tiers pour s'afficher, et une photo remplacée
depuis le panneau prend simplement la place de celle d'origine.

## Ce qui n'existe pas encore

- **Aucune notification** de nouvelle commande : le salon doit ouvrir son
  panneau.
- **Aucun suivi côté cliente** : la référence lui est donnée à l'écran, mais
  aucune page ne permet de la retrouver ensuite.
- **Pas de paiement en ligne**, pas de facture, pas de code promo.
- **Pas de frais par ville** : la livraison est au même prix partout.
