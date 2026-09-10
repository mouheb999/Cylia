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

## Photos

Un produit sans photo n'affiche pas un rectangle gris : il montre un carré doré
portant son initiale. La vitrine reste présentable le temps que le salon
photographie ses flacons, et l'absence de photo ne ressemble pas à une panne.

Les photos s'ajoutent depuis la fiche produit, dans le panneau ou en mode
édition sur `/boutique`.

## Ce qui n'existe pas encore

- **Aucune notification** de nouvelle commande : le salon doit ouvrir son
  panneau.
- **Aucun suivi côté cliente** : la référence lui est donnée à l'écran, mais
  aucune page ne permet de la retrouver ensuite.
- **Pas de paiement en ligne**, pas de facture, pas de code promo.
- **Pas de frais par ville** : la livraison est au même prix partout.
