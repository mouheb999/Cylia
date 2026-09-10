"use client";

import Link from "next/link";
import { useState } from "react";
import { ajouterAuPanier } from "@/lib/panier-boutique";
import { formatPrix } from "@/lib/format";
import type { Produit } from "@/lib/supabase/types";
import VisuelProduit from "./VisuelProduit";

export default function CarteProduit({
  produit,
  devise,
  onModifier,
}: {
  produit: Produit;
  devise: string;
  /** Fourni en mode édition : ouvre la fiche du produit. */
  onModifier?: () => void;
}) {
  const [ajoute, setAjoute] = useState(false);
  const epuise = produit.stock <= 0;

  function ajouter() {
    ajouterAuPanier(produit.id, 1);
    setAjoute(true);
    window.setTimeout(() => setAjoute(false), 1600);
  }

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-[0_2px_12px_rgba(42,37,33,0.04)]">
      <Link href={`/boutique/${produit.slug}`} className="relative block aspect-square bg-noir">
        <VisuelProduit
          nom={produit.nom}
          marque={produit.marque}
          url={produit.image_url}
          sizes="(max-width: 640px) 50vw, 220px"
        />
        {produit.ancien_prix && produit.ancien_prix > produit.prix && (
          <span className="gold-gradient absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.6rem] font-medium text-noir">
            Promo
          </span>
        )}
        {epuise && (
          <span className="absolute inset-0 flex items-center justify-center bg-noir/65 text-xs uppercase tracking-[0.2em] text-cream">
            Épuisé
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        {produit.marque && (
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted">{produit.marque}</p>
        )}
        <h3 className="mt-1 font-serif text-[0.95rem] leading-snug text-ink">
          <Link href={`/boutique/${produit.slug}`}>{produit.nom}</Link>
        </h3>

        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="font-serif text-base text-gold-deep lining-nums">
            {formatPrix(produit.prix, devise)}
          </span>
          {produit.ancien_prix && produit.ancien_prix > produit.prix && (
            <span className="text-xs font-light text-muted line-through lining-nums">
              {formatPrix(produit.ancien_prix, devise)}
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={ajouter}
          disabled={epuise}
          className={`mt-3 rounded-full py-2.5 text-sm transition-colors ${
            epuise
              ? "cursor-not-allowed border border-sand text-muted"
              : ajoute
                ? "border border-gold-deep bg-gold/15 text-gold-deep"
                : "gold-gradient text-noir"
          }`}
        >
          {epuise ? "Épuisé" : ajoute ? "Ajouté ✓" : "Ajouter"}
        </button>

        {onModifier && (
          <button
            type="button"
            onClick={onModifier}
            className="mt-2 rounded-full border border-dashed border-gold-deep/60 py-2 text-xs text-gold-deep"
          >
            Modifier ce produit
          </button>
        )}
      </div>
    </article>
  );
}
