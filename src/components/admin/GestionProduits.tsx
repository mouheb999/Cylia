"use client";

import { useMemo, useState } from "react";
import ChampStock from "@/components/admin/ChampStock";
import FeuilleProduit from "@/components/boutique/FeuilleProduit";
import VisuelProduit from "@/components/boutique/VisuelProduit";
import { formatPrix } from "@/lib/format";
import {
  famillesPresentes,
  filtrerProduits,
  gammesPresentes,
  nomFamille,
} from "@/lib/produits";
import type { Produit } from "@/lib/supabase/types";

/** En deçà, le catalogue tient à l'œil : les filtres n'apporteraient rien. */
const SEUIL_FILTRES = 12;

const TRIS_PANNEAU = [
  { id: "catalogue", nom: "Ordre de la boutique" },
  { id: "stock", nom: "Stock le plus bas" },
  { id: "nom", nom: "Nom (A → Z)" },
  { id: "prix", nom: "Prix décroissant" },
] as const;

type TriPanneau = (typeof TRIS_PANNEAU)[number]["id"];

export default function GestionProduits({
  produits,
  devise,
}: {
  produits: Produit[];
  devise: string;
}) {
  const [fiche, setFiche] = useState<Produit | null | undefined>(undefined);
  const [recherche, setRecherche] = useState("");
  const [famille, setFamille] = useState<string | null>(null);
  const [gamme, setGamme] = useState<string | null>(null);
  const [tri, setTri] = useState<TriPanneau>("catalogue");
  const [masques, setMasques] = useState(true);

  const familles = useMemo(() => famillesPresentes(produits), [produits]);
  const gammes = useMemo(() => gammesPresentes(produits), [produits]);

  const visibles = useMemo(() => {
    const parNom = (a: Produit, b: Produit) => a.nom.localeCompare(b.nom, "fr");
    const rangs: Record<TriPanneau, (a: Produit, b: Produit) => number> = {
      catalogue: (a, b) => a.ordre - b.ordre || parNom(a, b),
      stock: (a, b) => a.stock - b.stock || parNom(a, b),
      nom: parNom,
      prix: (a, b) => b.prix - a.prix || parNom(a, b),
    };
    const liste = filtrerProduits(produits, { famille, gamme, recherche })
      .filter((p) => masques || p.actif);
    return [...liste].sort(rangs[tri]);
  }, [produits, famille, gamme, recherche, tri, masques]);

  const ruptures = produits.filter((p) => p.actif && p.stock === 0).length;

  const menu =
    "w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-xs text-cream " +
    "focus:border-gold focus:outline-none";

  return (
    <div>
      <button
        type="button"
        onClick={() => setFiche(null)}
        className="gold-gradient mt-5 w-full rounded-full py-3 font-serif text-base text-noir"
      >
        Ajouter un produit
      </button>

      {produits.length >= SEUIL_FILTRES && (
        <div className="mt-5 space-y-2">
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher un produit…"
            className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-base text-cream placeholder:text-white/25 focus:border-gold focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Famille"
              value={famille ?? ""}
              onChange={(e) => setFamille(e.target.value || null)}
              className={menu}
            >
              <option value="">Toutes les familles</option>
              {familles.map((f) => (
                <option key={f.id} value={f.id} className="bg-noir-soft">
                  {f.nom} ({f.nombre})
                </option>
              ))}
            </select>

            <select
              aria-label="Gamme"
              value={gamme ?? ""}
              onChange={(e) => setGamme(e.target.value || null)}
              className={menu}
            >
              <option value="">Toutes les gammes</option>
              {gammes.map((g) => (
                <option key={g.nom} value={g.nom} className="bg-noir-soft">
                  {g.nom} ({g.nombre})
                </option>
              ))}
            </select>

            <select
              aria-label="Trier"
              value={tri}
              onChange={(e) => setTri(e.target.value as TriPanneau)}
              className={menu}
            >
              {TRIS_PANNEAU.map((t) => (
                <option key={t.id} value={t.id} className="bg-noir-soft">
                  {t.nom}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-xs text-white/60">
              <input
                type="checkbox"
                checked={masques}
                onChange={(e) => setMasques(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-gold)]"
              />
              Voir les masqués
            </label>
          </div>

          <p className="pt-0.5 text-[0.7rem] font-light text-white/35 lining-nums">
            {visibles.length} sur {produits.length}
            {ruptures > 0 && ` · ${ruptures} en rupture`}
          </p>
        </div>
      )}

      {produits.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm font-light text-white/45">
          Aucun produit pour le moment.
        </p>
      ) : visibles.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm font-light text-white/45">
          Aucun produit ne correspond.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {visibles.map((produit) => (
            <li key={produit.id}>
              <div
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                  produit.actif ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setFiche(produit)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <VisuelProduit
                      nom={produit.nom}
                      url={produit.image_url}
                      sizes="56px"
                      padding="p-1"
                      compact
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm leading-snug [display:-webkit-box] [overflow:hidden]
                        [-webkit-box-orient:vertical] [-webkit-line-clamp:2] ${
                          produit.actif ? "text-cream" : "text-white/35"
                        }`}
                    >
                      {produit.nom}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-light text-white/45 lining-nums">
                      {formatPrix(produit.prix, devise)} · {nomFamille(produit.famille)}
                      {!produit.actif && " · masqué"}
                    </span>
                  </span>
                </button>

                <ChampStock id={produit.id} stock={produit.stock} />
              </div>
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
