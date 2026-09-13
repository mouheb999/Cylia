"use client";

import { useMemo, useState } from "react";
import { useEdition } from "@/components/edition/ContexteEdition";
import { filtrerProduits, trierProduits, type Tri } from "@/lib/produits";
import type { Produit } from "@/lib/supabase/types";
import CarteProduit from "./CarteProduit";
import FeuilleProduit from "./FeuilleProduit";
import FiltresProduits from "./FiltresProduits";

/** En deçà, les filtres encombreraient plus qu'ils n'aideraient. */
const SEUIL_FILTRES = 12;

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
  const [famille, setFamille] = useState<string | null>(null);
  const [gamme, setGamme] = useState<string | null>(null);
  const [tri, setTri] = useState<Tri>("conseille");

  const visibles = useMemo(
    () => trierProduits(filtrerProduits(produits, { famille, gamme }), tri),
    [produits, famille, gamme, tri],
  );

  return (
    <>
      {produits.length >= SEUIL_FILTRES && (
        <FiltresProduits
          produits={produits}
          famille={famille}
          gamme={gamme}
          tri={tri}
          resultats={visibles.length}
          onFamille={setFamille}
          onGamme={setGamme}
          onTri={setTri}
        />
      )}

      {produits.length === 0 ? (
        <p className="rounded-2xl border border-sand bg-white px-5 py-10 text-center text-sm font-light leading-relaxed text-muted">
          La boutique se remplit — repassez très vite.
        </p>
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl border border-sand bg-white px-5 py-10 text-center text-sm font-light leading-relaxed text-muted">
          Rien dans cette combinaison.{" "}
          <button
            type="button"
            onClick={() => {
              setFamille(null);
              setGamme(null);
            }}
            className="underline decoration-gold-deep/40 underline-offset-4"
          >
            Revoir tout le catalogue
          </button>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {visibles.map((produit) => (
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
