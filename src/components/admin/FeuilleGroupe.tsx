"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { televerserImage } from "@/components/edition/televerser";
import VisuelPrestation from "@/components/reservation/VisuelPrestation";
import { enregistrerGroupe, supprimerGroupe } from "@/app/actions/admin";
import type { Categorie, Groupe } from "@/lib/supabase/types";

export default function FeuilleGroupe({
  groupe,
  categories,
  categorieParDefaut,
  onFermer,
}: {
  /** `null` pour créer un groupe. */
  groupe: Groupe | null;
  categories: Categorie[];
  categorieParDefaut: string;
  onFermer: () => void;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(groupe?.nom ?? "");
  const [description, setDescription] = useState(groupe?.description ?? "");
  const [categorieId, setCategorieId] = useState(groupe?.categorie_id ?? categorieParDefaut);
  const [imageUrl, setImageUrl] = useState(groupe?.image_url ?? null);
  const [actif, setActif] = useState(groupe?.actif ?? true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [depot, setDepot] = useState(false);
  const [enCours, demarrer] = useTransition();

  async function deposer(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    setDepot(true);
    try {
      setImageUrl(await televerserImage(fichier, "groupes"));
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  function enregistrer() {
    if (nom.trim().length < 2) return setErreur("Donnez un nom au groupe.");
    setErreur(null);
    demarrer(async () => {
      const reponse = await enregistrerGroupe({
        id: groupe?.id,
        categorie_id: categorieId,
        nom,
        description,
        image_url: imageUrl,
        ordre: groupe?.ordre ?? 999,
        actif,
      });
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  function retirer() {
    if (!groupe) return;
    setErreur(null);
    demarrer(async () => {
      const reponse = await supprimerGroupe(groupe.id);
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  const occupe = enCours || depot;

  return (
    <Feuille
      titre={groupe ? "Modifier le groupe" : "Nouveau groupe"}
      sousTitre="Un groupe rassemble des prestations voisines — les massages, l'épilation — et c'est lui qui porte la photo."
      onFermer={onFermer}
    >
      <div className="mx-auto w-fit text-center">
        <VisuelPrestation
          nom={nom || "Groupe"}
          categorieId={categorieId}
          url={imageUrl}
          className="mx-auto h-28 w-36 rounded-2xl border border-white/10"
        />
        <label className="mt-2.5 inline-block cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
          {depot ? "Envoi…" : imageUrl ? "Changer la photo" : "Ajouter une photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={occupe}
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
          placeholder="Massages"
          className={champSombre}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-light text-white/60">Phrase courte</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Relaxant, drainant, pierres chaudes"
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

      <label className="mt-4 flex items-center gap-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="h-4 w-4 accent-[color:var(--color-gold)]"
        />
        Visible sur le site
      </label>

      {erreur && <p className="mt-4 text-sm text-red-300">{erreur}</p>}

      <button
        type="button"
        onClick={enregistrer}
        disabled={occupe}
        className={`${boutonOr} mt-6 w-full`}
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>

      {groupe && (
        <button
          type="button"
          onClick={retirer}
          disabled={occupe}
          className="mt-3 w-full py-2 text-sm font-light text-white/40"
        >
          Retirer ce groupe
        </button>
      )}
    </Feuille>
  );
}
