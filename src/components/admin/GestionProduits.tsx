"use client";

import Image from "next/image";
import { useState } from "react";
import FeuilleProduit from "@/components/boutique/FeuilleProduit";
import { formatPrix } from "@/lib/format";
import type { Produit } from "@/lib/supabase/types";

export default function GestionProduits({
  produits,
  devise,
}: {
  produits: Produit[];
  devise: string;
}) {
  const [fiche, setFiche] = useState<Produit | null | undefined>(undefined);

  return (
    <div>
      <button
        type="button"
        onClick={() => setFiche(null)}
        className="gold-gradient mt-5 w-full rounded-full py-3 font-serif text-base text-noir"
      >
        Ajouter un produit
      </button>

      {produits.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm font-light text-white/45">
          Aucun produit pour le moment.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {produits.map((produit) => (
            <li key={produit.id}>
              <button
                type="button"
                onClick={() => setFiche(produit)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left ${
                  produit.actif ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01]"
                }`}
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-noir">
                  {produit.image_url ? (
                    <Image src={produit.image_url} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center font-script text-2xl text-gold/60">
                      {produit.nom.charAt(0)}
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${produit.actif ? "text-cream" : "text-white/35"}`}>
                    {produit.nom}
                  </span>
                  <span className="mt-0.5 block text-xs font-light text-white/45 lining-nums">
                    {formatPrix(produit.prix, devise)} · stock {produit.stock}
                    {!produit.actif && " · masqué"}
                  </span>
                </span>

                {produit.stock === 0 && produit.actif && (
                  <span className="shrink-0 rounded-full border border-red-400/30 px-2 py-0.5 text-[0.6rem] text-red-300">
                    rupture
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {fiche !== undefined && (
        <FeuilleProduit produit={fiche} onFermer={() => setFiche(undefined)} />
      )}
    </div>
  );
}
