"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackMeta } from "@/lib/meta/track";
import { ajouterCoffretAuPanier } from "@/lib/panier-boutique";

/**
 * Les boutons d'une carte coffret : « Commander » dépose le coffret et ouvre
 * le panier, où se remplit la livraison ; « Ajouter au panier » le dépose et
 * laisse la cliente continuer ses achats.
 *
 * Taillés pour une carte sur deux colonnes, à 375 px : à peine 160 px de large.
 */
export default function BoutonCoffret({
  coffretId,
  nom,
  prix,
  epuise,
}: {
  coffretId: string;
  nom: string;
  prix: number;
  epuise: boolean;
}) {
  const router = useRouter();
  const [ajoute, setAjoute] = useState(false);

  function deposer() {
    ajouterCoffretAuPanier(coffretId);
    trackMeta("AddToCart", [{ id: coffretId, name: nom, priceTnd: prix, quantity: 1 }]);
  }

  if (epuise) {
    return (
      <p className="rounded-full border border-sand py-2.5 text-center text-xs text-muted">
        Épuisé
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => {
          deposer();
          router.push("/boutique/panier");
        }}
        aria-label={`Commander ${nom}`}
        className="gold-gradient w-full rounded-full py-2.5 font-serif text-[0.95rem] text-noir"
      >
        Commander
      </button>

      {ajoute ? (
        <Link
          href="/boutique/panier"
          className="block rounded-full border border-gold-deep bg-gold/15 py-1.5 text-center font-serif text-[0.8rem] text-gold-deep"
        >
          Ajouté ✓ — panier
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            deposer();
            setAjoute(true);
          }}
          aria-label={`Ajouter ${nom} au panier`}
          className="w-full rounded-full border border-gold-deep/40 py-1.5 font-serif text-[0.8rem] text-gold-deep"
        >
          Ajouter au panier
        </button>
      )}
    </div>
  );
}
