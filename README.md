# CYLIA Maison de Beauté

Site vitrine mobile-first (une seule page) pour **CYLIA Maison de Beauté** — spa,
esthétique et coiffure, Av. 14 Janvier, Sousse.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · déployable sur Vercel.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de production
```

## Structure

```
src/app/layout.tsx        polices (Cormorant Garamond, Jost, Parisienne), métadonnées, icônes
src/app/page.tsx          page d'accueil
src/app/reserver/page.tsx tunnel de réservation
src/app/globals.css       thème Tailwind (couleurs, polices, dégradé doré)
src/components/           Header, Hero, Services, Feature, Galerie, Footer, Icons
src/components/reservation/  étapes du tunnel de réservation
src/lib/reservation/      catalogue, calcul des créneaux, stockage
src/lib/site.ts           coordonnées du salon (adresse, horaires, téléphone, WhatsApp)
```

## Réservation

Le tunnel `/reserver` calcule de vrais créneaux (horaires du salon, durée de la
prestation, postes disponibles) mais **fonctionne sans back-end** : les
réservations restent dans le navigateur de la visiteuse et le salon est prévenu
par le bouton WhatsApp de l'écran de confirmation.

Prestations, durées, horaires et mode démonstration se règlent dans
`src/lib/reservation/catalogue.ts`. Le fonctionnement détaillé et la marche à
suivre pour brancher Supabase sont dans **[docs/RESERVATION.md](docs/RESERVATION.md)**.

Toutes les informations de contact sont centralisées dans `src/lib/site.ts` :
il suffit de les modifier à cet endroit.

## Images

Les visuels de `public/` sont des **images provisoires** extraites des captures
fournies (maquette et compte Instagram du salon) : leur définition est faible.
Pour la mise en ligne, remplacer les fichiers en gardant les mêmes noms — le
code n'a pas besoin d'être modifié :

| Fichier | Usage | Format conseillé |
| --- | --- | --- |
| `logo.png` | logo dans l'en-tête et le pied de page | carré, fond transparent |
| `salon-1.jpg` | photo du hero (intérieur du salon) | paysage, ~16:10, ≥ 1600 px de large |
| `salon-2.jpg` | bandeau « Prenez soin de vous » | paysage, ~16:9, ≥ 1200 px de large |
| `galerie-1…4.jpg` | grille de la galerie | portrait 4:5, ≥ 800 px de large |

Les icônes d'onglet (`src/app/icon.png`, `src/app/apple-icon.png`) sont générées
à partir du logo ; les régénérer si le logo change.

## Notes

- Aucune librairie d'animation, aucun carrousel, aucun effet au défilement.
- Les boutons « Réserver » ouvrent WhatsApp (`wa.me/21654395168`) ; le numéro du
  pied de page est cliquable pour appeler.
- Les cartes Services s'affichent sur trois colonnes dès 360 px de large et
  passent en colonne unique en dessous.
