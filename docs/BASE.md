# Base de données

Projet Supabase, PostgreSQL. Le schéma complet est dans
`supabase/migrations/`, à lire dans l'ordre.

## Tables

| Table | Rôle |
| --- | --- |
| `administrateurs` | qui a le droit d'administrer — une ligne par compte |
| `reglages` | ligne unique : horaires, capacité, frais de livraison, ouverture des services |
| `fermetures` | congés et fériés, par période |
| `categories` | les trois familles de prestations, qui sont aussi les cartes de l'accueil |
| `prestations` | catalogue : nom, catégorie, durée, prix, description |
| `reservations` | rendez-vous, avec les noms des prestations figés à la prise |
| `contenus` | blocs de texte et photos modifiés depuis le site, par clé |
| `galerie` | photos de la galerie d'accueil |
| `produits` | catalogue de la boutique, stock compris |
| `commandes` / `commande_articles` | commandes et leurs lignes |

## Le modèle de sécurité

Le site n'a **pas de clé secrète**. L'URL et la clé publiable partent dans le
navigateur ; tout le reste tient dans RLS et dans trois fonctions.

**Une visiteuse** (`anon`) peut :

- lire le catalogue, le contenu, la galerie, les réglages et les fermetures ;
- appeler `occupation_du_jour`, `creer_reservation` et `creer_commande`.

Elle ne peut **écrire dans aucune table**, ni lire une seule réservation ou
commande — pas même la sienne. C'est un choix : il n'y a pas de compte cliente,
donc pas de moyen honnête de distinguer « sa » réservation d'une autre. Le
récapitulatif lui est montré à l'écran, à la suite de l'enregistrement.

**Une administratrice** (`authenticated` + ligne dans `administrateurs`) a tous
les droits, via des policies qui appellent `est_admin()`.

## Les trois fonctions publiques

Elles sont `security definer` : elles s'exécutent avec les droits de leur
propriétaire, pas ceux de l'appelante. C'est ce qui permet à une visiteuse
d'écrire une réservation dans une table où elle ne peut rien lire.

| Fonction | Ce qu'elle donne | Ce qu'elle protège |
| --- | --- | --- |
| `occupation_du_jour(date)` | des intervalles occupés, rien d'autre | aucun nom, aucun numéro ne sort |
| `creer_reservation(…)` | la réservation créée | relit durées et prix, revérifie la place au moment d'écrire |
| `creer_commande(…)` | la commande créée | relit les prix, verrouille et décrémente le stock |

Le reste — `est_admin`, `statistiques_admin`, `maintenant_salon`,
`reference_libre` — n'est **pas** exposé à `anon` (migrations 0008 et 0009).
Supabase accorde par défaut l'exécution des fonctions de `public` à `anon` et
`authenticated` : un `revoke ... from public` ne suffit pas, il faut retirer
les droits nommément.

## Stockage

Un seul bucket, `media`, en lecture publique. Le dépôt, la modification et la
suppression demandent `est_admin()`. Types acceptés : JPEG, PNG, WebP, AVIF,
GIF. Taille maximale : 8 Mo.

Les photos partent du navigateur directement vers Supabase, sans traverser le
serveur Next : pas de limite de taille d'action serveur, pas de photo de 6 Mo
encodée en base64 dans une requête.

## Vérifier le modèle

Les policies se testent en prenant le rôle d'une visiteuse :

```sql
set local role anon;
select count(*) from reservations;   -- doit renvoyer 0
insert into produits (slug, nom, prix) values ('x', 'X', 1);  -- doit échouer
reset role;
```

C'est ainsi que le modèle a été vérifié après écriture : lecture du catalogue
possible, réservation et commande possibles, tout le reste refusé.

## Repli

`src/lib/donnees.ts` n'échoue jamais. Si la base est injoignable, le site
s'affiche avec le catalogue de repli (`src/lib/catalogue-defaut.ts`) plutôt que
de rendre une page d'erreur à une cliente qui voulait un numéro de téléphone.
La boutique et la galerie s'affichent vides, la réservation dit franchement que
les disponibilités ne sont pas accessibles.

Une exception : les exceptions de contrôle de Next (`unstable_rethrow`) sont
relancées. Les avaler transformerait un site dynamique en site figé sur les
valeurs de repli.
