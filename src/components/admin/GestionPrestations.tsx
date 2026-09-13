"use client";

import { useState } from "react";
import FeuillePrestation from "@/components/reservation/FeuillePrestation";
import FeuilleGroupe from "@/components/admin/FeuilleGroupe";
import VisuelPrestation from "@/components/reservation/VisuelPrestation";
import { formatDuree, formatPrix } from "@/lib/format";
import type { Categorie, Groupe, Prestation } from "@/lib/supabase/types";

export default function GestionPrestations({
  categories,
  groupes,
  prestations,
  devise,
}: {
  categories: Categorie[];
  groupes: Groupe[];
  prestations: Prestation[];
  devise: string;
}) {
  // `undefined` : aucune fiche ouverte. `null` : fiche d'une nouveauté.
  const [fiche, setFiche] = useState<Prestation | null | undefined>(undefined);
  const [ficheGroupe, setFicheGroupe] = useState<Groupe | null | undefined>(undefined);

  return (
    <div>
      <button
        type="button"
        onClick={() => setFiche(null)}
        className="gold-gradient mt-5 w-full rounded-full py-3 font-serif text-base text-noir"
      >
        Ajouter une prestation
      </button>

      <button
        type="button"
        onClick={() => setFicheGroupe(null)}
        className="mt-2 w-full rounded-full border border-gold-deep/50 py-2.5 text-sm text-gold"
      >
        Ajouter un groupe
      </button>

      {categories.map((categorie) => {
        const liste = prestations.filter((p) => p.categorie_id === categorie.id);
        const sesGroupes = groupes.filter((g) => g.categorie_id === categorie.id);
        // Les prestations sont montrées groupe par groupe, dans l'ordre du
        // site ; celles qui n'ont pas de groupe ferment la marche, pour qu'on
        // voie tout de suite ce qu'il reste à ranger.
        const tranches = [
          ...sesGroupes.map((g) => ({
            groupe: g,
            contenu: liste.filter((p) => p.groupe_id === g.id),
          })),
          {
            groupe: null,
            contenu: liste.filter((p) => !sesGroupes.some((g) => g.id === p.groupe_id)),
          },
        ].filter((t) => t.groupe !== null || t.contenu.length > 0);

        return (
          <section key={categorie.id} className="mt-7">
            <h2 className="font-serif text-lg font-light text-gold">{categorie.nom}</h2>

            {liste.length === 0 && sesGroupes.length === 0 ? (
              <p className="mt-2 text-sm font-light text-white/40">Aucune prestation.</p>
            ) : (
              tranches.map(({ groupe, contenu }) => (
                <div key={groupe?.id ?? "sans-groupe"} className="mt-4">
                  {groupe ? (
                    <button
                      type="button"
                      onClick={() => setFicheGroupe(groupe)}
                      className="flex w-full items-center gap-2.5 text-left"
                    >
                      <VisuelPrestation
                        nom={groupe.nom}
                        categorieId={groupe.categorie_id}
                        url={groupe.image_url}
                        className="h-9 w-12 rounded-lg"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${groupe.actif ? "text-cream" : "text-white/35"}`}>
                          {groupe.nom}
                        </span>
                        <span className="block text-[0.7rem] font-light text-white/35">
                          {contenu.length} prestation{contenu.length > 1 ? "s" : ""}
                          {!groupe.image_url && " · sans photo"}
                          {!groupe.actif && " · masqué"}
                        </span>
                      </span>
                      <span aria-hidden="true" className="shrink-0 text-xs text-gold/70">
                        Modifier
                      </span>
                    </button>
                  ) : (
                    <p className="text-xs font-light uppercase tracking-[0.18em] text-white/30">
                      Sans groupe
                    </p>
                  )}

                  {contenu.length === 0 ? (
                    <p className="mt-2 text-xs font-light text-white/30">
                      Aucune prestation dans ce groupe.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 border-l border-white/10 pl-3">
                      {contenu.map((p) => (
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
                </div>
              ))
            )}
          </section>
        );
      })}

      {ficheGroupe !== undefined && (
        <FeuilleGroupe
          groupe={ficheGroupe}
          categories={categories}
          categorieParDefaut={categories[0]?.id ?? ""}
          onFermer={() => setFicheGroupe(undefined)}
        />
      )}

      {fiche !== undefined && (
        <FeuillePrestation
          prestation={fiche}
          categories={categories}
          groupes={groupes}
          categorieParDefaut={categories[0]?.id ?? ""}
          onFermer={() => setFiche(undefined)}
        />
      )}
    </div>
  );
}
