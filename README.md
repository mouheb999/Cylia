# CYLIA Maison de Beauté

Site du salon **CYLIA Maison de Beauté** — spa, esthétique et coiffure,
Av. 14 Janvier, Sousse. Mobile d'abord.

Le site fait trois choses :

- il **prend des rendez-vous** en ligne, avec de vrais créneaux et un vrai
  planning côté salon ;
- il **vend des cosmétiques**, panier et commande compris ;
- il **se modifie tout seul** : textes, photos, prestations et produits se
  changent depuis le site, sans toucher au code ni redéployer.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase ·
déployable sur Vercel.

## Démarrer

```bash
cp .env.example .env.local   # URL et clé publiable du projet Supabase
npm install
npm run dev     # http://localhost:3000
npm run build   # build de production
npm run lint
```

`.env.example` contient les vraies valeurs du projet : ce sont l'URL publique
et la clé *publiable*, qui partent de toute façon dans le navigateur. Rien de
secret n'y figure — la protection des données est assurée par RLS côté base
(voir [docs/BASE.md](docs/BASE.md)).

Sans ces variables, le site démarre — et se **construit** — quand même : il
affiche le catalogue de repli, et `/admin` renvoie vers une page de connexion
qui explique ce qui manque. Sur Vercel, les deux variables se déclarent dans
Settings → Environment Variables, pour les trois environnements ; un
déploiement qui ne les a pas donne un site vitrine sans réservation ni
boutique.

## Structure

```
src/app/layout.tsx              polices, métadonnées, contexte d'édition
src/app/page.tsx                accueil
src/app/reserver/               tunnel de réservation
src/app/boutique/               vitrine, fiche produit, panier & commande
src/app/admin/                  panneau du salon (connexion + 7 écrans)
src/app/actions/                actions serveur (réservation, boutique, admin, auth)
src/proxy.ts                    rafraîchit la session, barre l'entrée du panneau

src/components/                 Header, Hero, Services, Feature, Galerie, Footer
src/components/reservation/     étapes du tunnel
src/components/boutique/        cartes produit, panier, fiches
src/components/admin/           écrans du panneau
src/components/edition/         mode édition (contexte, blocs modifiables, feuille)
src/components/ui/              feuille coulissante, classes de champs

src/lib/supabase/               clients navigateur & serveur, types de la base
src/lib/donnees.ts              lectures publiques (avec repli si la base tombe)
src/lib/donnees-admin.ts        lectures du panneau
src/lib/contenu.ts              clés et valeurs par défaut des blocs modifiables
src/lib/creneaux.ts             calcul des créneaux (fonction pure)
src/lib/temps-salon.ts          « aujourd'hui » à l'heure de Tunis
src/lib/panier.ts               prestations retenues
src/lib/panier-boutique.ts      panier de la boutique

supabase/migrations/            schéma, RLS, fonctions, données de départ
```

## Documentation

| Sujet | Fichier |
| --- | --- |
| Réservation : créneaux, concurrence, réglages | [docs/RESERVATION.md](docs/RESERVATION.md) |
| Panneau d'administration et mode édition | [docs/ADMINISTRATION.md](docs/ADMINISTRATION.md) |
| Base de données : tables, RLS, fonctions | [docs/BASE.md](docs/BASE.md) |
| Boutique : panier, commande, stock | [docs/BOUTIQUE.md](docs/BOUTIQUE.md) |

## Images

Les photos livrées avec le site vivent dans `src/images/` et sont importées par
les composants, pas référencées par une URL publique. Ce détail compte : Next
leur donne alors une adresse qui contient une empreinte du contenu
(`/_next/static/media/salon-1.248889ftl1pmn.jpg`). Remplacer une photo change
l'empreinte, donc l'adresse, et **aucun cache ne peut resservir l'ancienne**.

| Fichier | Usage | Format conseillé |
| --- | --- | --- |
| `src/images/logo.png` | logo dans l'en-tête et le pied de page | carré, fond transparent |
| `src/images/salon-1.jpg` | photo du hero | portrait, ~4:5, ≥ 1200 px de large |
| `src/images/salon-2.jpg` | bandeau « Prenez soin de vous » | paysage, ~16:9, ≥ 1200 px de large |
| `src/images/galerie-1…4.jpg` | grille de la galerie | portrait 4:5, ≥ 800 px de large |

Les photos déposées **depuis le mode édition** ne passent pas par là : elles
vont dans le stockage Supabase (bucket `media`), sous un nom unique tiré au
hasard. Même effet, même garantie de fraîcheur. Elles priment sur les photos
d'origine ; « Remettre la version d'origine » les efface et rend la main au
fichier livré.

Les icônes d'onglet (`src/app/icon.png`, `src/app/apple-icon.png`) sont
générées à partir du logo ; les régénérer si le logo change.

## Notes

- Aucune librairie d'animation, aucun carrousel, aucun effet au défilement.
- Toutes les pages sont rendues à la demande : elles lisent les cookies de
  session et le contenu à jour, il n'y a rien à revalider.
- Le paiement de la boutique se fait **à la livraison**. Aucun moyen de
  paiement en ligne n'est intégré.
