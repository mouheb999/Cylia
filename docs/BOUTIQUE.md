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
- **Le stock est une supposition.** La source ne publie qu'un « disponible /
  épuisé ». Chaque produit disponible part donc à 12, chaque produit épuisé à
  0 : c'est un point de départ, à corriger dans `/admin/produits`.

Deux détails de fidélité : les prix en millimes (67,375 DT) sont arrondis au
centime par `numeric(10, 2)`, ce qui touche douze références ; et deux fiches
de la source décrivaient un autre produit que le leur — elles sont laissées
vides plutôt que fausses, comme les douze que la source ne décrit pas.

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
