# Réservation en ligne

## Le parcours

`/reserver`, en trois étapes :

1. **Prestations** — catégories et prestations lues dans la base. Plusieurs
   peuvent être retenues pour une même visite : elles s'ajoutent au panier,
   leurs durées s'additionnent, le compteur du sac suit la sélection.
2. **Date & heure** — les prochains jours, puis la grille des créneaux
   réellement libres pour la durée totale demandée.
3. **Coordonnées** — nom et téléphone, validés avant l'envoi.

Puis la confirmation, avec une référence (`CY-1209-3K7`) à conserver.

La réservation part dans la base. Le salon la voit dans son panneau
(`/admin/reservations`) et la fait passer de « à confirmer » à « confirmé »,
« terminé » ou « annulé ».

## Comment sont calculés les créneaux

Deux fois, et ce n'est pas un oubli.

**Pour l'affichage** — `src/lib/creneaux.ts`, fonction pure appelée par
l'action serveur `creneauxDisponibles`. Elle part des réglages du salon, de
l'occupation du jour (`occupation_du_jour`, qui ne renvoie que des intervalles,
jamais un nom ni un numéro) et des fermetures.

**Pour l'écriture** — `creer_reservation`, côté base. Elle refait tous les
contrôles, et c'est elle qui fait foi.

Pourquoi deux fois : entre le moment où la grille s'affiche sur le téléphone
d'une cliente et celui où elle appuie sur « Confirmer », une autre cliente a pu
prendre la dernière place. Seul le contrôle fait **au moment de l'écriture**,
dans la même transaction que l'insertion, ferme cette course. L'affichage, lui,
n'est qu'une bonne approximation — utile, mais pas une promesse.

Les règles, dans les deux cas :

- la journée est découpée par pas de `pas_minutes` entre l'ouverture et la
  fermeture ;
- un créneau n'est proposé que si la visite **tient entièrement** avant la
  fermeture : un balayage de 2 h 30 ne peut pas commencer à 18 h 30. Plus le
  panier est rempli, plus les créneaux se raréfient — c'est voulu ;
- le salon mène plusieurs rendez-vous de front (`capacite_simultanee`) : un
  horaire n'est refusé que lorsque **toutes** les places sont prises ;
- le jour même, les créneaux à moins de `delai_minimum_minutes` sont retirés ;
- les jours de fermeture (congés, fériés) ne proposent rien.

## L'heure du salon

Le serveur peut tourner à Francfort, la cliente être à Paris : ni l'un ni
l'autre ne décide de la date du jour. Seule compte l'heure de Sousse.

`src/lib/temps-salon.ts` la calcule côté serveur (`Africa/Tunis`) et envoie au
navigateur une liste de dates déjà arrêtée. `maintenant_salon()` fait le même
calcul côté base. Les deux sont d'accord par construction — c'est ce qui évite
qu'un créneau affiché comme « aujourd'hui » soit refusé comme « déjà passé ».

## Ce que le navigateur ne décide pas

`creer_reservation` ne fait confiance à rien de ce qui arrive :

| Envoyé par le navigateur | Ce que fait la base |
| --- | --- |
| identifiants des prestations | relit nom, durée et prix dans `prestations` |
| durée totale | *n'est pas envoyée* — elle est recalculée |
| prix | *n'est pas envoyé* — il est recalculé |
| date et heure | revérifiées contre horaires, fermetures et délai minimum |
| nom, téléphone | longueur et format contrôlés |

Un identifiant inconnu, une prestation désactivée ou un doublon font échouer la
demande. Les noms des prestations sont **figés** dans la réservation
(`prestations_nom`) : renommer « Head Spa » demain ne réécrit pas l'historique
du salon.

## Réglages

Tout se règle depuis `/admin/reglages`, sans redéploiement :

| Réglage | Effet |
| --- | --- |
| ouverture / fermeture | amplitude horaire |
| pas des créneaux | espacement de la grille (30 min par défaut) |
| rendez-vous en même temps | nombre de postes ou de cabines |
| délai minimum | délai entre maintenant et un rendez-vous le jour même |
| jours proposés | longueur du sélecteur de date |
| réservation ouverte | coupe la prise de rendez-vous en ligne |
| jours de fermeture | congés et fériés, par période |

Les prestations (nom, catégorie, durée, prix, description) se gèrent dans
`/admin/prestations`, ou directement sur `/reserver` en mode édition.

Une prestation « retirée » est **désactivée, jamais effacée** : les rendez-vous
qui la mentionnent restent lisibles.

## Le panier

`src/lib/panier.ts` tient la sélection hors de React : un petit store maison lu
par `useSyncExternalStore`, sauvegardé dans `localStorage`. C'est ce qui permet
au compteur de l'en-tête et au tunnel de rester d'accord, y compris après un
changement de page ou un rechargement. Le panier est vidé après confirmation.

Une prestation retirée du catalogue entre deux visites disparaît du panier au
lieu de bloquer le tunnel.

## Ce qui n'existe pas encore

- **Aucune notification.** Le salon doit ouvrir son panneau pour voir les
  nouvelles demandes ; ni e-mail, ni SMS, ni WhatsApp ne partent. C'est la
  première chose à ajouter.
- **Aucun rappel** à la cliente la veille du rendez-vous.
- **Pas de gestion par employée** : la capacité est un nombre de places, pas un
  planning individuel.
- **Pas d'acompte** ni de paiement en ligne.
