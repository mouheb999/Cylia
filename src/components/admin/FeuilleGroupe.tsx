"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { televerserImage } from "@/components/edition/televerser";
import VisuelPrestation from "@/components/reservation/VisuelPrestation";
import { photosDuGroupe } from "@/components/reservation/DiaporamaGroupe";
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
  const [images, setImages] = useState<string[]>(groupe ? photosDuGroupe(groupe) : []);
  const [actif, setActif] = useState(groupe?.actif ?? true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [depot, setDepot] = useState(false);
  const [enCours, demarrer] = useTransition();

  async function deposer(fichiers: FileList | null) {
    const choisis = Array.from(fichiers ?? []);
    if (choisis.length === 0) return;
    setErreur(null);
    setDepot(true);
    try {
      const deposees = await Promise.all(
        choisis.map((fichier) => televerserImage(fichier, "groupes")),
      );
      setImages((precedentes) => [...precedentes, ...deposees]);
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  /** Une photo remonte d'un cran ; celle de tête est la couverture. */
  function deplacer(index: number, sens: -1 | 1) {
    setImages((precedentes) => {
      const cible = index + sens;
      if (cible < 0 || cible >= precedentes.length) return precedentes;
      const copie = [...precedentes];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  }

  function retirerPhoto(index: number) {
    setImages((precedentes) => precedentes.filter((_, i) => i !== index));
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
        images,
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
      sousTitre="Un groupe rassemble des prestations voisines — les massages, l'épilation — et c'est lui qui porte les photos."
      onFermer={onFermer}
    >
      <div>
        <p className="text-sm font-light text-white/60">
          Photos{images.length > 1 && ` (${images.length})`}
        </p>
        <p className="mt-1 text-xs font-light text-white/35">
          Elles défilent en haut du groupe, une fois ouvert. La première sert de
          couverture sur la vignette.
        </p>

        {images.length === 0 ? (
          <VisuelPrestation
            nom={nom || "Groupe"}
            categorieId={categorieId}
            url={null}
            sizes="144px"
            className="mt-3 h-28 w-full rounded-2xl border border-dashed border-white/15"
            tailleIcone="h-10 w-10"
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {images.map((url, index) => (
              <li
                key={url}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2"
              >
                <VisuelPrestation
                  nom={`${nom || "Groupe"} — photo ${index + 1}`}
                  categorieId={categorieId}
                  url={url}
                  sizes="88px"
                  className="h-16 w-[5.5rem] rounded-xl"
                />
                <span className="min-w-0 flex-1 text-xs font-light text-white/40">
                  {index === 0 ? "Couverture" : `Photo ${index + 1}`}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => deplacer(index, -1)}
                    disabled={occupe || index === 0}
                    aria-label={`Monter la photo ${index + 1}`}
                    className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => deplacer(index, 1)}
                    disabled={occupe || index === images.length - 1}
                    aria-label={`Descendre la photo ${index + 1}`}
                    className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => retirerPhoto(index)}
                    disabled={occupe}
                    aria-label={`Retirer la photo ${index + 1}`}
                    className="h-8 w-8 rounded-full border border-red-400/30 text-red-300/80 disabled:opacity-25"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-3 inline-block cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
          {depot ? "Envoi…" : images.length === 0 ? "Ajouter des photos" : "En ajouter d'autres"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            disabled={occupe}
            onChange={(e) => {
              deposer(e.target.files);
              // Sans cela, redéposer le même fichier ne déclencherait rien :
              // la valeur du champ n'aurait pas changé.
              e.target.value = "";
            }}
          />
        </label>
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
