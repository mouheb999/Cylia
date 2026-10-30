# Boutique de cosmétiques

## Le parcours

`/boutique` liste les produits actifs. Chaque fiche (`/boutique/<slug>`) montre
la description, le prix, l'état du stock et permet de choisir une quantité.
`/boutique/panier` récapitule, demande les coordonnées de livraison et
enregistre la commande.

## Le premier écran, sur téléphone

Les publicités Meta font arriver sur `/boutique`, sur un téléphone. Sur un
écran de 375 × 812, la cliente doit voir sans défiler un coffret, son prix et
« Commander » :

- le bandeau « Notre boutique » tient en 180 px au plus — titre sur une ligne,
  et la promesse « Livraison partout en Tunisie · Paiement à la livraison » ;
- les coffrets viennent juste dessous, en **grille** (deux colonnes sur
  téléphone, trois puis quatre sur grand écran), du **moins cher au plus
  cher**, les épuisés à la fin ;
- `/boutique?coffret=<id>` met ce coffret en tête : c'est le lien à donner à
  une publicité qui montre un coffret précis ;
- les images des deux premières cartes sont préchargées (`preload`, qui
  remplace `priority` depuis Next 16), les autres chargées au défilement ; leur
  `sizes` demande environ 400 px de large sur téléphone.

Sur la fiche d'un coffret, une barre collée en bas de l'écran (téléphone
seulement) reprend le prix et « Commander » dès que le bouton principal est
passé au-dessus de l'écran.

## La photo d'un coffret

Une carte de coffret montre **une seule image**, le coffret entier :

1. la photo déposée dans le panneau, si elle existe ;
2. sinon, sa **photo de groupe**, assemblée par `npm run visuels:coffrets`
   (`scripts/visuels-coffrets.mjs`) : chaque packshot est rogné à son contour
   — les fichiers du catalogue ont de grandes marges transparentes —, puis les
   flacons sont rangés ensemble, chevauchés, sur une même ligne de sol. Le
   groupe remplit la vignette ;
3. sinon — coffret composé depuis, script pas encore relancé —, les flacons
   côte à côte, agrandis pour compenser leurs marges.

Les photos de groupe sont des fichiers du dépôt (`public/visuels-coffrets/`),
listés dans `src/lib/visuels-coffrets.ts` avec les packshots dont elles sont
faites. Un coffret dont les produits ont changé ne correspond plus à sa photo,
qui est alors ignorée : **après avoir créé ou recomposé un coffret, relancer
`npm run visuels:coffrets` et pousser le résultat.**

## Le formulaire de commande

Trois champs obligatoires : **Nom**, **Téléphone**, **Gouvernorat** (liste des
24 gouvernorats, `lib/gouvernorats.ts`). L'adresse est facultative : le salon
la demande à l'appel de confirmation, et la commande porte alors « À préciser
lors de l'appel » — `creer_commande` exige toujours une adresse, la mention en
tient lieu. Le gouvernorat est enregistré dans la colonne `ville`.

Le téléphone doit être un mobile tunisien : 8 chiffres commençant par 2, 4, 5
ou 9, avec ou sans +216. L'erreur s'affiche sous le champ, en français, et la
commande ne part pas tant qu'elle n'est pas corrigée. L'action serveur refait
la vérification.

Juste au-dessus de « Commander », les garanties (paiement à la livraison,
livraison, revendeur officiel Keune, délai 24–72 h). « Livraison offerte »
n'y est écrit que si c'est vrai pour ce panier ; sinon, « Livraison offerte dès
… », d'après les réglages. Dessous, « Commander sur WhatsApp » ouvre une
conversation avec le panier et ce qui est déjà rempli, écrits d'avance.

## Mesure Meta

Un seul pixel, `1006831132445584`, écrit dans `lib/meta/track.ts`. Chaque
évènement part aussi par l'API Conversions avec le même `event_id`, pour que
Meta n'en garde qu'un :

- **AddToCart** — « Commander » ou « Ajouter au panier » ;
- **InitiateCheckout** — une fois, au premier champ du formulaire touché ;
  jamais à l'ouverture du panier ;
- **Purchase** — commande enregistrée : pixel sur la page de confirmation,
  et API Conversions depuis `passerCommande`, avec les montants relus en base.
  Même `event_id` des deux côtés, `order_<référence>`, unique par commande.

Les montants sont en dollars (`TND_TO_USD`), Meta ne connaissant pas le dinar.

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

Trois références n'avaient aucun prix chez la source ; le salon a donné le
sien, 88 DT, et elles sont en vente comme les autres. Elles étaient masquées
en attendant : un produit à 0 DT reste commandable, et `creer_commande` relit
le prix en base — le publier aurait suffi à le faire partir gratuitement.

Deux détails de fidélité : les prix en millimes (67,375 DT) sont arrondis au
centime par `numeric(10, 2)`, ce qui touche douze références ; et deux fiches
de la source décrivaient un autre produit que le leur — elles sont laissées
vides plutôt que fausses, comme les douze que la source ne décrit pas.

## L'aperçu de l'accueil

« Nos cosmétiques » montre douze produits dans une rangée qui défile sur le
côté. Le choix n'est pas les douze premiers du catalogue : celui-ci est trié
par gamme, et les douze premiers seraient donc douze flacons de la même ligne.
`selectionAccueil` tourne d'une famille à l'autre — un shampooing, un
après-shampooing, un masque, une huile — pour montrer l'étendue de la boutique
plutôt que son rayon le plus fourni. Les produits épuisés n'y entrent pas.

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

Les photos du catalogue sont des packshots **détourés** : le flacon seul, sur
du transparent. Posées sur le fond noir d'origine, elles donnaient un carré
sombre par produit, et `object-cover` recadrait au passage des images qui ne
sont pas carrées — un 750 × 554 perdait un quart de sa largeur, bouchon ou
étiquette compris. D'où le fond clair et `object-contain` : le flacon tient
entier dans sa vignette, comme sur un présentoir. Le dégradé descend vers le
blanc de la carte, pour qu'aucune couture ne marque le bas de la vignette.

Un produit sans photo n'affiche pas un rectangle gris : il montre son initiale
en doré sur le même fond clair. La vitrine reste présentable le temps que le salon
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
