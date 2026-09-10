"use client";

import { useState } from "react";
import FeuillePrestation from "@/components/reservation/FeuillePrestation";
import { formatDuree, formatPrix } from "@/lib/format";
import type { Categorie, Prestation } from "@/lib/supabase/types";

export default function GestionPrestations({
  categories,
  prestations,
  devise,
}: {
  categories: Categorie[];
  prestations: Prestation[];
  devise: string;
}) {
  // `undefined` : aucune fiche ouverte. `null` : fiche d'une nouvelle prestation.
  const [fiche, setFiche] = useState<Prestation | null | undefined>(undefined);

  return (
    <div>
      <button
        type="button"
        onClick={() => setFiche(null)}
        className="gold-gradient mt-5 w-full rounded-full py-3 font-serif text-base text-noir"
      >
        Ajouter une prestation
      </button>

      {categories.map((categorie) => {
        const liste = prestations.filter((p) => p.categorie_id === categorie.id);
        return (
          <section key={categorie.id} className="mt-7">
            <h2 className="font-serif text-lg font-light text-gold">{categorie.nom}</h2>

            {liste.length === 0 ? (
              <p className="mt-2 text-sm font-light text-white/40">Aucune prestation.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {liste.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setFiche(p)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left ${
                        p.actif ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className={`block truncate font-serif text-[1.05rem] ${p.actif ? "text-cream" : "text-white/35"}`}>
                          {p.nom}
                        </span>
                        <span className="mt-0.5 block text-xs font-light text-white/45">
                          {formatDuree(p.duree_minutes)}
                          {p.prix != null && ` · ${formatPrix(p.prix, devise)}`}
                          {!p.actif && " · masquée"}
                        </span>
                      </span>
                      <span aria-hidden="true" className="shrink-0 text-sm text-gold/70">
                        Modifier
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {fiche !== undefined && (
        <FeuillePrestation
          prestation={fiche}
          categories={categories}
          categorieParDefaut={categories[0]?.id ?? ""}
          onFermer={() => setFiche(undefined)}
        />
      )}
    </div>
  );
}
