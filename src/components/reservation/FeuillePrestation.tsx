"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { televerserImage } from "@/components/edition/televerser";
import VisuelPrestation from "./VisuelPrestation";
import { enregistrerPrestation, supprimerPrestation } from "@/app/actions/admin";
import type { Categorie, Groupe, Prestation } from "@/lib/supabase/types";

function nombreOuNull(valeur: string): number | null {
  const propre = valeur.trim().replace(",", ".");
  if (propre === "") return null;
  const nombre = Number(propre);
  return Number.isFinite(nombre) ? nombre : null;
}

export default function FeuillePrestation({
  prestation,
  categories,
  groupes = [],
  categorieParDefaut,
  onFermer,
}: {
  /** `null` pour créer une prestation. */
  prestation: Prestation | null;
  categories: Categorie[];
  groupes?: Groupe[];
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
  const [imageUrl, setImageUrl] = useState(prestation?.image_url ?? null);
  const [groupeId, setGroupeId] = useState<string>(prestation?.groupe_id ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [depot, setDepot] = useState(false);
  const [enCours, demarrer] = useTransition();

  async function deposer(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    setDepot(true);
    try {
      setImageUrl(await televerserImage(fichier, "prestations"));
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

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
        groupe_id: groupeId || null,
        duree_minutes: minutes,
        prix: nombreOuNull(prix),
        description,
        image_url: imageUrl,
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
      <div className="mx-auto w-fit text-center">
        <VisuelPrestation
          nom={nom || "Prestation"}
          categorieId={categorieId}
          url={imageUrl}
          sizes="112px"
          className="mx-auto h-28 w-28 rounded-2xl border border-white/10"
        />
        <label className="mt-2.5 inline-block cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
          {depot ? "Envoi…" : imageUrl ? "Changer la photo" : "Ajouter une photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={depot || enCours}
            onChange={(e) => deposer(e.target.files?.[0])}
          />
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="mt-2 block w-full text-[0.7rem] font-light text-white/35"
          >
            Retirer la photo
          </button>
        )}
      </div>

      <label className="mt-5 block text-sm">
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

      {groupes.length > 0 && (
        <label className="mt-4 block text-sm">
          <span className="font-light text-white/60">Groupe</span>
          <select
            value={groupeId}
            onChange={(e) => setGroupeId(e.target.value)}
            className={champSombre}
          >
            <option value="" className="bg-noir-soft">
              Sans groupe
            </option>
            {groupes
              .filter((g) => g.categorie_id === categorieId)
              .map((g) => (
                <option key={g.id} value={g.id} className="bg-noir-soft">
                  {g.nom}
                </option>
              ))}
          </select>
          <span className="mt-1.5 block text-xs font-light text-white/35">
            Sans groupe, la prestation s&apos;affiche sous les vignettes de sa
            catégorie plutôt que dans l&apos;une d&apos;elles.
          </span>
        </label>
      )}

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
