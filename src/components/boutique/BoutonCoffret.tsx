"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { annoncerCaisse, trackMeta } from "@/lib/meta/track";
import { ajouterCoffretAuPanier } from "@/lib/panier-boutique";

/**
 * Les boutons d'une carte coffret : « Commander » dépose le coffret et ouvre
 * le panier, où se remplit la livraison ; « Ajouter au panier » le dépose et
 * laisse la cliente continuer ses achats.
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
        Épuisé pour le moment
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          deposer();
          annoncerCaisse();
          router.push("/boutique/panier");
        }}
        aria-label={`Commander ${nom}`}
        className="gold-gradient w-full rounded-full py-2.5 font-serif text-sm text-noir"
      >
        Commander
      </button>

      {ajoute ? (
        <Link
          href="/boutique/panier"
          className="block rounded-full border border-gold-deep bg-gold/15 py-2 text-center font-serif text-sm text-gold-deep"
        >
          Ajouté ✓ — voir mon panier
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            deposer();
            setAjoute(true);
          }}
          aria-label={`Ajouter ${nom} au panier`}
          className="w-full rounded-full border border-gold-deep/40 py-2 font-serif text-sm text-gold-deep"
        >
          Ajouter au panier
        </button>
      )}
    </div>
  );
}
