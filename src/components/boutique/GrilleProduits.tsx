"use client";

import { useState } from "react";
import { useEdition } from "@/components/edition/ContexteEdition";
import type { Produit } from "@/lib/supabase/types";
import CarteProduit from "./CarteProduit";
import FeuilleProduit from "./FeuilleProduit";

export default function GrilleProduits({
  produits,
  devise,
}: {
  produits: Produit[];
  devise: string;
}) {
  const edition = useEdition();
  // `undefined` : aucune fiche ouverte. `null` : fiche d'un nouveau produit.
  const [fiche, setFiche] = useState<Produit | null | undefined>(undefined);

  return (
    <>
      {produits.length === 0 ? (
        <p className="rounded-2xl border border-sand bg-white px-5 py-10 text-center text-sm font-light leading-relaxed text-muted">
          La boutique se remplit — repassez très vite.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {produits.map((produit) => (
            <li key={produit.id}>
              <CarteProduit
                produit={produit}
                devise={devise}
                onModifier={edition.actif ? () => setFiche(produit) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {edition.actif && (
        <button
          type="button"
          onClick={() => setFiche(null)}
          className="gold-gradient mt-4 w-full rounded-full py-3 font-serif text-base text-noir"
        >
          Ajouter un produit
        </button>
      )}

      {fiche !== undefined && (
        <FeuilleProduit produit={fiche} onFermer={() => setFiche(undefined)} />
      )}
    </>
  );
}
