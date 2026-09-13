"use client";

import { famillesPresentes, gammesPresentes, TRIS, type Tri } from "@/lib/produits";
import type { Produit } from "@/lib/supabase/types";

/**
 * Filtres de la vitrine.
 *
 * Deux cents flacons ne se parcourent pas au doigt : la famille répond à « je
 * cherche un masque », la gamme à « je suis en So Pure », le tri à « montre le
 * moins cher ». Les familles sont des puces plutôt qu'une liste déroulante,
 * parce que c'est le filtre qu'on touche en premier et qu'il doit se voir.
 *
 * Rien n'est déduit d'une liste figée : familles et gammes sont comptées dans
 * le catalogue reçu. Une famille sans produit ne s'affiche pas, et un nouveau
 * produit fait apparaître la sienne sans qu'on y revienne.
 */
export default function FiltresProduits({
  produits,
  famille,
  gamme,
  tri,
  resultats,
  onFamille,
  onGamme,
  onTri,
}: {
  produits: Produit[];
  famille: string | null;
  gamme: string | null;
  tri: Tri;
  resultats: number;
  onFamille: (valeur: string | null) => void;
  onGamme: (valeur: string | null) => void;
  onTri: (valeur: Tri) => void;
}) {
  // Les familles se comptent sur la gamme choisie, et l'inverse : les compteurs
  // annoncent alors ce qu'on trouvera vraiment, pas un total trompeur.
  const familles = famillesPresentes(gamme ? produits.filter((p) => p.marque === gamme) : produits);
  const gammes = gammesPresentes(famille ? produits.filter((p) => p.famille === famille) : produits);

  const puce = "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors";
  const choisie = "border-gold-deep bg-gold/15 text-gold-deep";
  const libre = "border-sand bg-white text-muted";

  const menu =
    "w-full rounded-full border border-sand bg-white px-3.5 py-2 text-xs text-ink " +
    "focus:border-gold-deep focus:outline-none";

  return (
    <div className="mb-4">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 pb-1">
          <button
            type="button"
            onClick={() => onFamille(null)}
            className={`${puce} ${famille === null ? choisie : libre}`}
          >
            Tout
          </button>
          {familles.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFamille(f.id)}
              className={`${puce} ${famille === f.id ? choisie : libre}`}
            >
              {f.nom}
              <span className="ml-1.5 text-[0.65rem] opacity-60 lining-nums">{f.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="sr-only">Gamme</span>
          <select
            value={gamme ?? ""}
            onChange={(e) => onGamme(e.target.value || null)}
            className={menu}
          >
            <option value="">Toutes les gammes</option>
            {gammes.map((g) => (
              <option key={g.nom} value={g.nom}>
                {g.nom} ({g.nombre})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Trier</span>
          <select value={tri} onChange={(e) => onTri(e.target.value as Tri)} className={menu}>
            {TRIS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-2.5 text-[0.7rem] font-light text-muted lining-nums">
        {resultats} produit{resultats > 1 ? "s" : ""}
        {(famille || gamme) && (
          <>
            {" — "}
            <button
              type="button"
              onClick={() => {
                onFamille(null);
                onGamme(null);
              }}
              className="underline decoration-gold-deep/40 underline-offset-2"
            >
              tout revoir
            </button>
          </>
        )}
      </p>
    </div>
  );
}
