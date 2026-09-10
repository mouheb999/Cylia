# Réservation en ligne — fonctionnement et suite

## Ce qui marche aujourd'hui

Le tunnel de réservation (`/reserver`) est complet et utilisable :

1. **Prestation** — trois catégories, quinze prestations, chacune avec sa durée.
2. **Date & heure** — les quatorze prochains jours, puis la grille des créneaux
   réellement disponibles pour la prestation choisie.
3. **Coordonnées** — nom et téléphone, validés avant l'envoi.
4. **Confirmation** — récapitulatif complet et référence (`CY-1209-3K7`) à
   conserver par la cliente.

Les créneaux ne sont pas décoratifs : ils sont calculés à partir des horaires
d'ouverture, de la durée de la prestation, du nombre de postes du salon et des
rendez-vous déjà posés.

## Ce qui n'existe pas encore

**Il n'y a pas de back-end.** Concrètement :

- une réservation n'est enregistrée que dans le navigateur qui l'a prise
  (`localStorage`) : elle disparaît si la cliente change de téléphone ou vide
  son navigateur ;
- **le salon n'est averti de rien** : la réservation ne quitte pas le
  téléphone de la cliente. C'est la limite principale de cette étape, et elle
  disparaît avec le back-end ;
- deux clientes différentes ne se voient pas : chacune peut réserver le même
  créneau.

Deux bandeaux le disent à l'écran tant que `MODE_DEMO` vaut `true` : un sous
le tunnel, un sur l'écran de confirmation.

En attendant, les moyens de contact réels restent le téléphone et WhatsApp,
présents en pied de page du site.

## Comment sont calculés les créneaux

`src/lib/reservation/disponibilites.ts`

- La journée est découpée par pas de 30 min entre l'ouverture (10h) et la
  fermeture (20h).
- Un créneau n'est proposé que si la prestation **tient entièrement** avant la
  fermeture : un balayage de 2h30 ne peut pas commencer à 18h30.
- Le salon mène plusieurs rendez-vous de front (`capaciteSimultanee`, 3 postes) :
  un horaire n'est refusé que lorsque **tous** les postes sont occupés. C'est
  pourquoi un créneau que vous venez de réserver peut rester ouvert — il reste
  deux places. Vos propres rendez-vous sont marqués « votre RDV ».
- Le jour même, les créneaux à moins d'une heure sont retirés.
- **L'occupation de démonstration** (`occupationSimulee`) remplit le planning
  avec 7 à 11 rendez-vous par jour. Elle est *déterministe* : une même date
  donne toujours la même grille, la démo est donc reproductible d'un
  rechargement à l'autre. Environ deux tiers des créneaux restent libres, et
  les prestations longues sont logiquement plus difficiles à placer.

## Réglages courants

Tout est dans `src/lib/reservation/catalogue.ts` :

| Réglage | Effet |
| --- | --- |
| `MODE_DEMO` | `false` : plus d'occupation simulée ni de bandeau de démonstration |
| `HORAIRES.ouverture` / `fermeture` | amplitude horaire, en minutes depuis minuit |
| `HORAIRES.pas` | espacement de la grille (30 min) |
| `HORAIRES.capaciteSimultanee` | nombre de rendez-vous menés de front |
| `HORAIRES.delaiMinimumMinutes` | délai minimum pour un rendez-vous le jour même |
| `JOURS_PROPOSES` | nombre de jours affichés dans le sélecteur |
| `PRESTATIONS` | liste des prestations et **durées** |

Les durées sont des valeurs de travail, à confirmer avec le salon. Aucun tarif
n'est affiché tant que la grille n'est pas validée.

## Brancher un vrai back-end (Supabase)

L'interface d'écran ne connaît pas le stockage : elle passe par l'interface
`StoreReservations` (`src/lib/reservation/types.ts`), qui a trois méthodes —
`reservationsDuJour`, `creer`, `mesReservations`. Elles sont déjà asynchrones,
justement pour qu'un appel réseau ne change rien aux composants.

La bascule tient en trois étapes :

1. Créer la table côté Supabase :

   ```sql
   create table reservations (
     reference    text primary key,
     prestation_id text not null,
     date         date not null,
     heure        text not null,
     nom          text not null,
     telephone    text not null,
     note         text,
     cree_le      timestamptz not null default now()
   );
   ```

2. Écrire `src/lib/reservation/store-supabase.ts` en implémentant la même
   interface `StoreReservations`.

3. Dans `src/lib/reservation/index.ts`, remplacer une seule ligne :

   ```ts
   export const store: StoreReservations = storeSupabase;
   ```

Puis passer `MODE_DEMO` à `false`. Aucun composant d'interface n'est touché.

Restent à traiter le jour où le back-end arrive, et qui ne sont *pas* résolus
par ce changement de store :

- **la concurrence** — vérifier au moment de l'écriture que le créneau est
  toujours libre, sinon deux clientes peuvent réserver en même temps ;
- **la notification du salon** — e-mail ou WhatsApp Business API, c'est ce qui
  rend la réservation réellement utile ;
- **la page d'administration** — voir, confirmer et annuler les rendez-vous ;
  inutile de la construire avant le back-end : au-dessus de `localStorage`,
  elle n'afficherait que les réservations prises sur ce même appareil ;
- **les vraies indisponibilités** — congés, jours fériés, absences d'une
  employée, qui aujourd'hui n'existent nulle part.
