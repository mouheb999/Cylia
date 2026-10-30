"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrix } from "@/lib/format";
import { trackMeta } from "@/lib/meta/track";
import { ajouterCoffretAuPanier } from "@/lib/panier-boutique";

/**
 * Barre collée en bas de l'écran, sur téléphone, sur la fiche d'un coffret :
 * le prix et « Commander », toujours à portée de pouce.
 *
 * Elle n'apparaît qu'une fois le bouton principal (`cible`) passé au-dessus de
 * l'écran — tant qu'il est visible, ou qu'on ne l'a pas encore atteint, elle
 * ferait doublon. « Commander » fait exactement ce que fait celui de la fiche,
 * pour un coffret : dépôt au panier, `AddToCart`, puis le panier.
 *
 * Le bloc vide rendu à la suite garde la place de la barre en bas de page :
 * sans lui, elle masquerait la fin du pied de page.
 */
export default function BarreCommande({
  cible,
  coffretId,
  nom,
  prix,
  devise,
}: {
  /** L'`id` de l'élément qui porte le bouton principal. */
  cible: string;
  coffretId: string;
  nom: string;
  prix: number;
  devise: string;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = document.getElementById(cible);
    if (!element) return;
    // La zone observée s'étend sans fin sous l'écran : le bouton n'en sort
    // donc que par le haut. Un simple « hors de l'écran » ne suffisait pas —
    // un saut d'un coup, d'avant le bouton à après lui (une ancre, un geste
    // lancé), ne traverse jamais l'écran et n'aurait rien déclenché.
    const observateur = new IntersectionObserver(
      ([entree]) => setVisible(!entree.isIntersecting),
      { rootMargin: "0px 0px 100000px 0px" },
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [cible]);

  function commander() {
    ajouterCoffretAuPanier(coffretId, 1);
    trackMeta("AddToCart", [{ id: coffretId, name: nom, priceTnd: prix, quantity: 1 }]);
    router.push("/boutique/panier");
  }

  return (
    <>
      <div aria-hidden="true" className="h-20 bg-noir sm:hidden" />
      <div
        inert={!visible}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-gold/20 bg-noir/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm transition-transform duration-300 sm:hidden ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.7rem] font-light text-white/60">{nom}</p>
            <p className="font-serif text-xl font-semibold leading-tight text-gold lining-nums">
              {formatPrix(prix, devise)}
            </p>
          </div>
          <button
            type="button"
            onClick={commander}
            aria-label={`Commander ${nom}`}
            className="gold-gradient shrink-0 rounded-full px-7 py-3 font-serif text-base text-noir"
          >
            Commander
          </button>
        </div>
      </div>
    </>
  );
}
