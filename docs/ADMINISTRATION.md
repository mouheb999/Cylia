# Administration

Deux façons de gérer le site, pour deux moments différents.

- **Le mode édition** — sur le site lui-même, pour corriger un titre ou changer
  une photo entre deux clientes.
- **Le panneau** (`/admin`) — pour le planning, les commandes et tout ce qui se
  lit en liste.

## Se connecter

`/admin` demande une connexion. Le compte du salon a été créé avec l'adresse
donnée à l'installation ; le mot de passe se change dans Supabase
(Authentication → Users → *Send password recovery*), ou par « mot de passe
oublié » depuis l'écran de connexion de Supabase.

Être inscrit ne suffit pas : le compte doit figurer dans la table
`administrateurs`. Pour ajouter une deuxième personne, créer son compte dans
Supabase puis :

```sql
insert into administrateurs (user_id, email, nom)
select id, email, 'Prénom' from auth.users where email = 'adresse@exemple.tn';
```

Trois barrières, et pas une de trop :

1. `src/proxy.ts` renvoie vers la connexion quiconque n'a pas de session ;
2. `src/app/admin/(panneau)/layout.tsx` vérifie l'appartenance à
   `administrateurs` ;
3. chaque action serveur la revérifie, et RLS refuse l'écriture côté base.

La troisième est la seule qui compte vraiment : une action serveur est
joignable par un simple POST, pas seulement depuis le panneau. Les deux
premières ne font qu'éviter d'afficher des pages inutiles.

## Le mode édition

Connectée, une barre flotte en bas de chaque page du site : **Modifier le
site**. Une fois allumée, tout ce qui est modifiable s'entoure d'un liseré
doré. On touche, un panneau monte du bas de l'écran, on corrige, on enregistre.

Ce qui se modifie ainsi :

| Sur la page | Quoi |
| --- | --- |
| Accueil | tous les titres et textes, la photo du bandeau, celle de l'encart, les photos de la galerie (ajout, retrait, ordre) |
| Boutique | titres, textes, et chaque produit — plus « Ajouter un produit » |
| Réserver | titres, et chaque prestation — plus « Ajouter une prestation » |
| Pied de page | adresse, horaires, numéro affiché |

Le panneau monte du bas plutôt qu'au centre : le salon modifie son site au
téléphone, et le bas de l'écran est là où tombe le pouce.

Chaque bloc porte une **valeur d'origine**, écrite dans le code
(`src/lib/contenu.ts`). Tant que personne n'y touche, c'est elle qui s'affiche.
« Remettre la version d'origine » supprime la ligne enregistrée et rend la main
au code. Conséquence utile : une base vide affiche quand même un site complet.

Les photos déposées partent directement du navigateur vers le stockage
Supabase, sans passer par le serveur Next. Chaque dépôt reçoit un nom unique,
donc une nouvelle adresse : aucun cache ne peut resservir l'ancienne image.
Format JPG, PNG ou WebP, 8 Mo au maximum.

## Le panneau

| Écran | Ce qu'on y fait |
| --- | --- |
| **Tableau de bord** | rendez-vous du jour, demandes à confirmer, commandes à traiter, chiffre du mois, ruptures de stock |
| **Réservations** | planning par jour, avec les vues « à venir », « aujourd'hui », « à confirmer », « passées ». Confirmer, terminer, annuler, rouvrir |
| **Commandes** | commandes de cosmétiques, articles et coordonnées de livraison. À traiter → confirmée → expédiée → livrée |
| **Prestations** | catalogue complet, y compris ce qui est masqué |
| **Produits** | catalogue de la boutique, stock, prix barrés, photos |
| **Contenu** | tous les textes du site en une page, pour une relecture d'ensemble |
| **Réglages** | horaires, capacité, frais de livraison, ouverture des services, jours de fermeture |

Les numéros de téléphone sont cliquables : depuis un téléphone, la liste des
rendez-vous du jour sert directement à rappeler les clientes.

## Ce qui n'est jamais effacé

« Retirer » une prestation ou un produit les **désactive** : ils disparaissent
du site, mais les rendez-vous et les commandes qui les mentionnent restent
lisibles. Une commande garde de toute façon le nom et le prix pratiqués au
moment de l'achat, pas ceux d'aujourd'hui.

## À faire côté Supabase

Une case reste à cocher dans le tableau de bord Supabase, et elle ne peut pas
l'être depuis le code : **Authentication → Policies → Leaked password
protection**. Elle refuse les mots de passe connus des fuites publiques.
