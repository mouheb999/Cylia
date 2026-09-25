"use client";

import Link from "next/link";
import { useState } from "react";
import { ajouterCoffretAuPanier } from "@/lib/panier-boutique";

/** « Ajouter au panier » d'un coffret, puis le chemin vers le panier. */
export default function BoutonCoffret({
  coffretId,
  nom,
  epuise,
}: {
  coffretId: string;
  nom: string;
  epuise: boolean;
}) {
  const [ajoute, setAjoute] = useState(false);

  if (epuise) {
    return (
      <p className="rounded-full border border-sand py-2.5 text-center text-xs text-muted">
        Épuisé pour le moment
      </p>
    );
  }

  if (ajoute) {
    return (
      <Link
        href="/boutique/panier"
        className="block rounded-full border border-gold-deep/40 py-2.5 text-center font-serif text-sm text-gold-deep"
      >
        Ajouté ✓ — voir mon panier
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        ajouterCoffretAuPanier(coffretId);
        setAjoute(true);
      }}
      aria-label={`Ajouter ${nom} au panier`}
      className="gold-gradient w-full rounded-full py-2.5 font-serif text-sm text-noir"
    >
      Ajouter au panier
    </button>
  );
}
