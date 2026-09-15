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
| **Réservations** | planning par jour, avec les vues « à venir », « aujourd'hui », « à confirmer », « passées ». Écrire sur WhatsApp, appeler, confirmer, refuser, terminer, rouvrir |
| **Commandes** | commandes de cosmétiques, articles et coordonnées de livraison. À traiter → confirmée → expédiée → livrée |
| **Prestations** | catalogue complet, y compris ce qui est masqué. Une photo par prestation |
| **Produits** | catalogue de la boutique, stock, prix barrés, photos. Recherche, filtres par famille et par gamme, tri |
| **Contenu** | tous les textes du site en une page, pour une relecture d'ensemble |
| **Réglages** | horaires, capacité, frais de livraison, ouverture des services, jours de fermeture |

## Répondre à une cliente

Chaque rendez-vous porte quatre boutons, dans l'ordre du geste réel : on joint
d'abord, on décide ensuite.

| Bouton | Ce qu'il fait |
| --- | --- |
| **WhatsApp** | ouvre la conversation avec le message déjà écrit |
| **Appeler** | compose le numéro |
| **Confirmer** / **Refuser** | tranche la demande |

Le message WhatsApp dépend de l'état du rendez-vous : on demande confirmation
d'une demande en attente, on rappelle un rendez-vous confirmé, on annonce une
annulation, on remercie après la visite. Il reste modifiable dans WhatsApp avant
envoi — personne n'envoie un message qu'il n'a pas relu.

Le numéro est remis au format international avant d'ouvrir WhatsApp :
« 54 395 168 », « +216 54 395 168 » et « 0021654395168 » désignent la même
personne, mais `wa.me` n'accepte que la dernière forme. Un numéro que le site ne
sait pas lire n'affiche pas de bouton WhatsApp plutôt que d'ouvrir une
conversation avec personne.

**« Refuser », pas « Annuler ».** Une demande jamais confirmée se refuse ; un
rendez-vous confirmé s'annule. Le libellé change avec l'état, parce que la
nuance compte pour qui appuie.

Le statut bascule à l'écran **avant** la réponse du serveur. Confirmer dix
rendez-vous d'affilée en 4G, c'était dix attentes. Si le serveur refuse,
l'ancien statut revient et le message dit pourquoi.

## Une demande n'est jamais perdue

Une demande dont le créneau est passé sans avoir été traitée sortait de la vue
« à confirmer » et du compteur du tableau de bord. Elle disparaissait de l'écran
du salon ; la cliente, elle, attendait toujours une réponse.

Elle reste désormais dans « à confirmer » tant qu'elle est en attente, remonte
en tête de liste, s'affiche en rouge avec la mention « passé sans jamais avoir
été traité », et le tableau de bord porte une ligne dédiée. Ce n'est plus une
confirmation qu'elle attend, c'est un appel d'excuse — d'où le rouge.

## Être prévenu sans ouvrir le panneau

Le salon est prévenu de trois façons : bandeau et son quand le panneau est
ouvert, notification sur le téléphone quand il est fermé, sondage de rattrapage
si la connexion a sauté. Tout est dans
[NOTIFICATIONS.md](NOTIFICATIONS.md) — y compris pourquoi ce n'est pas WhatsApp
qui prévient le salon, et pourquoi l'installation sur l'écran d'accueil est
obligatoire sur iPhone.

Les numéros de téléphone sont cliquables : depuis un téléphone, la liste des
rendez-vous du jour sert directement à rappeler les clientes.

## Recompter le stock

La quantité se change **dans la liste des produits**, sans ouvrir la fiche :
« − », « + », ou le nombre tapé directement. Un réapprovisionnement, c'est
vingt produits à recompter ; vingt allers-retours dans une fiche auraient fait
renoncer.

L'envoi part une seconde après la dernière frappe : taper « 24 » n'enregistre
pas d'abord 2, et maintenir « + » ne fait qu'un enregistrement. Le nombre
affiché suit le doigt sans attendre la réponse — si le serveur refuse, il
revient à sa valeur d'avant et dit pourquoi, sous le champ.

Seule la quantité part : enregistrer la fiche entière pour un stock écraserait
le prix ou la description tels que la page les avait en mémoire, et donc une
correction faite entre-temps depuis un autre écran.

Pour retrouver un produit dans deux cents, la liste a une recherche, un filtre
par famille et par gamme, et un tri — dont « stock le plus bas », qui met la
tournée de réassort en tête.

## Ce qui n'est jamais effacé

« Retirer » une prestation ou un produit les **désactive** : ils disparaissent
du site, mais les rendez-vous et les commandes qui les mentionnent restent
lisibles. Une commande garde de toute façon le nom et le prix pratiqués au
moment de l'achat, pas ceux d'aujourd'hui.

## À faire côté Supabase

Une case reste à cocher dans le tableau de bord Supabase, et elle ne peut pas
l'être depuis le code : **Authentication → Policies → Leaked password
protection**. Elle refuse les mots de passe connus des fuites publiques.
