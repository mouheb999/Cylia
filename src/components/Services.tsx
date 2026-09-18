import Link from "next/link";
import type { Categorie } from "@/lib/supabase/types";
import { IconArrow, IconBienEtre, IconCoiffure, IconEsthetique } from "./Icons";

/**
 * Les trois cartes de l'accueil sont les catégories du catalogue.
 *
 * Une seule source : renommer « Bien-être » dans le panneau change la carte,
 * l'onglet du tunnel de réservation et le regroupement des prestations.
 */
const ICONES: Record<string, typeof IconCoiffure> = {
  coiffure: IconCoiffure,
  esthetique: IconEsthetique,
  "bien-etre": IconBienEtre,
};

/**
 * Certaines catégories ont leur logo dessiné plutôt qu'une icône de trait.
 *
 * Il ne remplace l'icône qu'ici, sur les cartes de l'accueil, posées sur du
 * blanc — le fond du fichier l'est aussi. Le tunnel de réservation et les
 * cartes d'offres gardent l'icône : leurs vignettes sont sombres, un logo sur
 * fond blanc y ferait une tache.
 *
 * Le fichier vit dans `public/` et s'affiche par une balise `img` ordinaire,
 * pas par `next/image`. Mis en ligne, ce logo restait cassé alors que tout le
 * reste tenait : fichier valide, présent dans le commit, servi sans erreur en
 * local, et l'optimiseur de l'hébergeur en pleine forme. Faute de pouvoir
 * observer la panne, on a retiré du chemin tout ce qui pouvait s'y trouver —
 * l'optimiseur, le `srcset`, le nom haché par le bundler. Reste une adresse
 * fixe, `/coiffure.png`, qu'on peut ouvrir à la main pour savoir.
 */
const LOGOS: Record<string, string> = {
  coiffure: "/coiffure.png",
};

export default function Services({ categories }: { categories: Categorie[] }) {
  if (categories.length === 0) return null;

  return (
    <section id="services" className="bg-cream px-4 pb-6 pt-8">
      <ul
        className={`grid grid-cols-1 gap-3 ${
          categories.length >= 3 ? "min-[360px]:grid-cols-3" : "min-[360px]:grid-cols-2"
        }`}
      >
        {categories.map((categorie) => {
          const Icone = ICONES[categorie.id] ?? IconEsthetique;
          const logo = LOGOS[categorie.id];
          return (
            <li key={categorie.id}>
              <Link
                href={`/reserver?categorie=${encodeURIComponent(categorie.id)}`}
                className="flex h-full flex-col items-center rounded-2xl border border-sand bg-white px-2.5 py-5 text-center shadow-[0_2px_12px_rgba(42,37,33,0.04)]"
              >
                {logo ? (
                  // Fichier fixe de 160 px : `next/image` n'a rien à y gagner,
                  // et son absence retire une pièce de plus du chemin — voir le
                  // commentaire de `LOGOS`.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt=""
                    // Le nom de la catégorie est juste en dessous : le logo ne
                    // répète rien, il décore.
                    aria-hidden="true"
                    width={160}
                    height={174}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <Icone className="h-10 w-10 text-gold-deep" />
                )}
                <h2 className="mt-3 font-serif text-[1.05rem] font-medium text-ink">
                  {categorie.nom}
                </h2>
                <p className="mt-1.5 text-[0.7rem] font-light leading-snug text-muted">
                  {categorie.description}
                </p>
                <IconArrow className="mt-auto box-content h-4 w-4 pt-3 text-gold-deep" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
