"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { enregistrerPrestation, supprimerPrestation } from "@/app/actions/admin";
import type { Categorie, Prestation } from "@/lib/supabase/types";

function nombreOuNull(valeur: string): number | null {
  const propre = valeur.trim().replace(",", ".");
  if (propre === "") return null;
  const nombre = Number(propre);
  return Number.isFinite(nombre) ? nombre : null;
}

export default function FeuillePrestation({
  prestation,
  categories,
  categorieParDefaut,
  onFermer,
}: {
  /** `null` pour créer une prestation. */
  prestation: Prestation | null;
  categories: Categorie[];
  categorieParDefaut: string;
  onFermer: () => void;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(prestation?.nom ?? "");
  const [categorieId, setCategorieId] = useState(
    prestation?.categorie_id ?? categorieParDefaut,
  );
  const [duree, setDuree] = useState(String(prestation?.duree_minutes ?? 60));
  const [prix, setPrix] = useState(prestation?.prix != null ? String(prestation.prix) : "");
  const [description, setDescription] = useState(prestation?.description ?? "");
  const [actif, setActif] = useState(prestation?.actif ?? true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function enregistrer() {
    const minutes = nombreOuNull(duree);
    if (nom.trim().length < 2) return setErreur("Donnez un nom à la prestation.");
    if (minutes === null || minutes < 5) return setErreur("La durée doit valoir au moins 5 minutes.");

    setErreur(null);
    demarrer(async () => {
      const reponse = await enregistrerPrestation({
        id: prestation?.id,
        nom,
        categorie_id: categorieId,
        duree_minutes: minutes,
        prix: nombreOuNull(prix),
        description,
        ordre: prestation?.ordre ?? 999,
        actif,
      });
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  function retirer() {
    if (!prestation) return;
    setErreur(null);
    demarrer(async () => {
      const reponse = await supprimerPrestation(prestation.id);
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  return (
    <Feuille
      titre={prestation ? "Modifier la prestation" : "Nouvelle prestation"}
      sousTitre="La durée décide des créneaux proposés : une prestation de 2 h ne s'affiche que là où le salon a 2 h devant lui."
      onFermer={onFermer}
    >
      <label className="block text-sm">
        <span className="font-light text-white/60">Nom</span>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Coupe & brushing"
          className={champSombre}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-light text-white/60">Catégorie</span>
        <select
          value={categorieId}
          onChange={(e) => setCategorieId(e.target.value)}
          className={champSombre}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-noir-soft">
              {c.nom}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-light text-white/60">Durée (min)</span>
          <input
            inputMode="numeric"
            value={duree}
            onChange={(e) => setDuree(e.target.value)}
            className={champSombre}
          />
        </label>
        <label className="block text-sm">
          <span className="font-light text-white/60">Prix (facultatif)</span>
          <input
            inputMode="decimal"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="—"
            className={champSombre}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-light text-white/60">Description (facultatif)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`${champSombre} resize-none`}
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="h-5 w-5 accent-[#d5b17c]"
        />
        Proposée à la réservation
      </label>

      {erreur && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <button type="button" disabled={enCours} onClick={enregistrer} className={boutonOr}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        {prestation && (
          <button
            type="button"
            disabled={enCours}
            onClick={retirer}
            className="rounded-full border border-red-400/30 py-3 text-sm font-light text-red-300"
          >
            Retirer du catalogue
          </button>
        )}
      </div>
    </Feuille>
  );
}
