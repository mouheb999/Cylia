"use client";

import { useState } from "react";
import { champSombre, libelle } from "@/components/ui/champs";
import { formatPrix } from "@/lib/format";
import { valeurALUnite } from "@/lib/packs";
import type { Categorie, Prestation } from "@/lib/supabase/types";

/** Pour comparer sans accents ni majuscules : « hydrafacial » trouve « HydraFacial ». */
function plier(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Les prestations d'un pack, cochées dans tout le catalogue.
 *
 * En haut, celles retenues — dans l'ordre du pack, qu'on peut changer. En
 * dessous, tout le catalogue rangé par catégorie (esthétique, maquillage,
 * coiffure…), avec une recherche : le salon a des dizaines de prestations.
 */
export default function ChoixPrestations({
  prestations,
  categories,
  valeur,
  prixPack,
  onChange,
}: {
  prestations: Prestation[];
  categories: Categorie[];
  valeur: string[];
  prixPack: number | null;
  onChange: (ids: string[]) => void;
}) {
  const [recherche, setRecherche] = useState("");
  const parId = new Map(prestations.map((p) => [p.id, p]));
  const retenues = valeur.map((id) => parId.get(id)).filter((p): p is Prestation => !!p);
  const valeurTotale = valeurALUnite(retenues);

  const filtre = plier(recherche.trim());
  const visibles = prestations.filter((p) => !filtre || plier(p.nom).includes(filtre));
  const sections = [
    ...categories.map((c) => ({
      id: c.id,
      nom: c.nom,
      liste: visibles.filter((p) => p.categorie_id === c.id),
    })),
    {
      id: "autres",
      nom: "Autres",
      liste: visibles.filter((p) => !categories.some((c) => c.id === p.categorie_id)),
    },
  ].filter((s) => s.liste.length > 0);

  function basculer(id: string) {
    onChange(valeur.includes(id) ? valeur.filter((x) => x !== id) : [...valeur, id]);
  }

  function deplacer(index: number, sens: -1 | 1) {
    const cible = index + sens;
    if (cible < 0 || cible >= valeur.length) return;
    const copie = [...valeur];
    [copie[index], copie[cible]] = [copie[cible], copie[index]];
    onChange(copie);
  }

  return (
    <div className="text-sm">
      <span className={libelle}>
        Prestations du pack{retenues.length > 0 && ` (${retenues.length})`}
      </span>
      <p className="mt-1 text-xs font-light text-white/35">
        « Réserver ce pack » les dépose toutes dans le panier de la cliente :
        leurs durées additionnées réservent le bon temps de cabine. Le prix
        annoncé reste celui du pack, ci-dessus.
      </p>

      {retenues.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {retenues.map((p, index) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.06] px-3 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-cream">{p.nom}</span>
                <span className="block text-xs font-light text-white/40">
                  {p.prix == null ? "sans prix" : formatPrix(p.prix, "DT")} · {p.duree_minutes} min
                  {!p.actif && " · masquée"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => deplacer(index, -1)}
                disabled={index === 0}
                aria-label={`Monter ${p.nom}`}
                className="h-7 w-7 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => deplacer(index, 1)}
                disabled={index === retenues.length - 1}
                aria-label={`Descendre ${p.nom}`}
                className="h-7 w-7 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => basculer(p.id)}
                aria-label={`Retirer ${p.nom}`}
                className="h-7 w-7 rounded-full border border-red-400/30 text-red-300/80"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {valeurTotale !== null && (
        <p className="mt-2 text-xs font-light text-white/50">
          Prises une à une : {formatPrix(valeurTotale, "DT")}
          {prixPack !== null && prixPack < valeurTotale && (
            <span className="text-gold">
              {" "}
              · la cliente économise {formatPrix(valeurTotale - prixPack, "DT")}
            </span>
          )}
        </p>
      )}

      <input
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Chercher une prestation — hydrafacial, maquillage…"
        className={`${champSombre} mt-3`}
      />

      <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">
        {sections.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs font-light text-white/35">
            Aucune prestation ne correspond.
          </p>
        ) : (
          sections.map((section) => (
            <div key={section.id} className="mb-2 last:mb-0">
              <p className="px-2 pb-1 pt-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-gold/70">
                {section.nom}
              </p>
              {section.liste.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={valeur.includes(p.id)}
                    onChange={() => basculer(p.id)}
                    className="h-4 w-4 shrink-0 accent-[#C9A227]"
                  />
                  <span className="min-w-0 flex-1 truncate text-white/80">{p.nom}</span>
                  <span className="shrink-0 text-xs font-light text-white/35">
                    {p.prix == null ? "" : formatPrix(p.prix, "DT")}
                  </span>
                </label>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
