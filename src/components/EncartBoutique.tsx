import Link from "next/link";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { formatPrix } from "@/lib/format";
import { selectionAccueil } from "@/lib/produits";
import type { Produit } from "@/lib/supabase/types";
import VisuelProduit from "./boutique/VisuelProduit";
import { IconArrow } from "./Icons";

/**
 * Aperçu de la boutique sur l'accueil.
 *
 * Une rangée qui défile sur le côté, pas un carrousel : aucun défilement
 * automatique, aucune librairie, aucun script. C'est la zone de défilement
 * native du navigateur, avec un point d'ancrage par carte — le geste est celui
 * qu'on fait déjà partout sur un téléphone, et la carte suivante dépasse du
 * bord pour dire qu'il y a la suite.
 */
export default function EncartBoutique({
  produits,
  devise,
}: {
  produits: Produit[];
  devise: string;
}) {
  const selection = selectionAccueil(produits);
  if (selection.length === 0) return null;

  return (
    <section id="boutique" className="bg-cream px-4 pb-10 pt-2">
      <div className="mb-5 text-center">
        <Texte
          cle="boutique.accueil_surtitre"
          titre="Sur-titre de l'encart boutique"
          defaut={CONTENUS_DEFAUT["boutique.accueil_surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="boutique.accueil_titre"
          titre="Titre de l'encart boutique"
          defaut={CONTENUS_DEFAUT["boutique.accueil_titre"]}
          balise="h2"
          className="mt-2 font-serif text-2xl font-light text-ink"
        />
        <Texte
          cle="boutique.accueil_texte"
          titre="Texte de l'encart boutique"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["boutique.accueil_texte"]}
          balise="p"
          className="mx-auto mt-2 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-muted"
        />
      </div>

      <ul
        // Défilement au clavier comme au doigt : la zone se met au point et
        // répond aux flèches, ce qu'une simple `div` débordante ne fait pas.
        tabIndex={0}
        role="region"
        aria-label="Nos cosmétiques, à faire défiler sur le côté"
        // `scroll-px-4` n'est pas décoratif : sans lui, l'accrochage aligne la
        // première carte sur le bord de la zone et avale la marge de la page —
        // la rangée commençait 16 px plus à gauche que le titre au-dessus.
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1
          [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {selection.map((produit) => (
          <li key={produit.id} className="w-[8.5rem] shrink-0 snap-start">
            <Link href={`/boutique/${produit.slug}`} className="block">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-sand">
                <VisuelProduit
                  nom={produit.nom}
                  marque={produit.marque}
                  url={produit.image_url}
                  sizes="140px"
                  padding="p-3"
                  compact
                />
              </div>
              {produit.marque && (
                <p className="mt-1.5 truncate text-[0.6rem] uppercase tracking-[0.18em] text-muted">
                  {produit.marque}
                </p>
              )}
              <p className="mt-0.5 line-clamp-2 text-[0.72rem] font-light leading-snug text-ink">
                {produit.nom}
              </p>
              <p className="mt-1 font-serif text-[1rem] font-semibold leading-none text-gold-deep lining-nums">
                {formatPrix(produit.prix, devise)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/boutique"
        className="mx-auto mt-5 flex w-full max-w-[20rem] items-center justify-center gap-2 rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
      >
        <Texte
          cle="boutique.accueil_bouton"
          titre="Bouton de l'encart boutique"
          defaut={CONTENUS_DEFAUT["boutique.accueil_bouton"]}
        />
        <IconArrow className="h-4 w-4" />
      </Link>
    </section>
  );
}
