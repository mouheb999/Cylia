"use client";

import Link from "next/link";
import { useState } from "react";
import { ajouterAuPanier } from "@/lib/panier-boutique";

export default function BoutonAjouter({
  produitId,
  epuise,
}: {
  produitId: string;
  epuise: boolean;
}) {
  const [quantite, setQuantite] = useState(1);
  const [ajoute, setAjoute] = useState(false);

  if (epuise) {
    return (
      <p className="mt-6 rounded-full border border-sand py-3.5 text-center text-sm text-muted">
        Épuisé — demandez-nous au salon
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-center gap-5 rounded-full border border-sand bg-white py-2.5">
        <button
          type="button"
          onClick={() => setQuantite((q) => Math.max(1, q - 1))}
          aria-label="Retirer un"
          className="px-4 text-xl text-gold-deep"
        >
          −
        </button>
        <span aria-live="polite" className="min-w-6 text-center font-serif text-lg text-ink lining-nums">
          {quantite}
        </span>
        <button
          type="button"
          onClick={() => setQuantite((q) => Math.min(99, q + 1))}
          aria-label="Ajouter un"
          className="px-4 text-xl text-gold-deep"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          ajouterAuPanier(produitId, quantite);
          setAjoute(true);
        }}
        className="gold-gradient mt-3 w-full rounded-full py-3.5 font-serif text-base text-noir"
      >
        Ajouter au panier
      </button>

      {ajoute && (
        <Link
          href="/boutique/panier"
          className="mt-3 block rounded-full border border-gold-deep/40 py-3 text-center font-serif text-base text-gold-deep"
        >
          Voir mon panier
        </Link>
      )}
    </div>
  );
}
