"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ajouterAuPanier, ajouterCoffretAuPanier } from "@/lib/panier-boutique";

/**
 * Quantité, « Commander maintenant » et « Ajouter au panier » — pour un
 * produit comme pour un coffret.
 *
 * « Commander maintenant » dépose l'article et ouvre le panier, où se trouve
 * le formulaire de livraison : la cliente venue pour un seul article commande
 * en deux gestes, sans chercher le panier.
 */
export default function BoutonAjouter({
  produitId,
  coffretId,
  epuise,
  stock = 99,
}: {
  produitId?: string;
  coffretId?: string;
  epuise: boolean;
  /** Plafond du sélecteur de quantité. */
  stock?: number;
}) {
  const router = useRouter();
  const [quantite, setQuantite] = useState(1);
  const [ajoute, setAjoute] = useState(false);
  const plafond = Math.max(1, Math.min(99, stock));

  function deposer() {
    if (coffretId) ajouterCoffretAuPanier(coffretId, quantite);
    else if (produitId) ajouterAuPanier(produitId, quantite);
  }

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
          onClick={() => setQuantite((q) => Math.min(plafond, q + 1))}
          disabled={quantite >= plafond}
          aria-label="Ajouter un"
          className="px-4 text-xl text-gold-deep disabled:opacity-30"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          deposer();
          router.push("/boutique/panier");
        }}
        className="gold-gradient mt-3 w-full rounded-full py-3.5 font-serif text-base text-noir"
      >
        Commander maintenant
      </button>

      {ajoute ? (
        <Link
          href="/boutique/panier"
          className="mt-3 block rounded-full border border-gold-deep bg-gold/15 py-3 text-center font-serif text-base text-gold-deep"
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
          className="mt-3 w-full rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
        >
          Ajouter au panier
        </button>
      )}
    </div>
  );
}
