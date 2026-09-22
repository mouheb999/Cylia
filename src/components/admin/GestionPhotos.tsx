"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ajouterPhoto,
  decrirePhoto,
  deplacerPhoto,
  supprimerPhoto,
  type Resultat,
} from "@/app/actions/admin";
import PhotoDistante from "@/components/PhotoDistante";
import { televerserImage } from "@/components/edition/televerser";
import { champSombre } from "@/components/ui/champs";
import type { EmplacementPhoto, PhotoGalerie } from "@/lib/supabase/types";

/**
 * Une liste de photos du site, déposée, rangée et légendée depuis le panneau.
 *
 * Le même écran sert au bandeau de l'accueil et à la galerie : ce sont les
 * mêmes gestes — déposer, monter, descendre, retirer — sur la même table.
 * Seul `emplacement` change.
 *
 * Le fichier part du navigateur droit vers Supabase (voir `televerser.ts`),
 * puis une action serveur enregistre son adresse : une photo de 6 Mo ne
 * traverse jamais le serveur Next.
 */
export default function GestionPhotos({
  photos,
  emplacement,
  dossier,
  altParDefaut,
  apercu = "aspect-[4/5]",
  vide,
}: {
  photos: PhotoGalerie[];
  emplacement: EmplacementPhoto;
  /** Sous-dossier du bucket — pour s'y retrouver dans le stockage. */
  dossier: string;
  /** Phrase écrite sur les photos déposées, que le salon peut ensuite corriger. */
  altParDefaut: string;
  /** Format de la vignette, celui de l'emplacement sur le site. */
  apercu?: string;
  /** Ce qu'on lit quand il n'y a encore aucune photo. */
  vide: string;
}) {
  const router = useRouter();
  const champFichier = useRef<HTMLInputElement>(null);
  const [depot, setDepot] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [legendee, setLegendee] = useState<string | null>(null);
  const [legendes, setLegendes] = useState<Record<string, string>>({});
  const [enCours, demarrer] = useTransition();

  const occupe = depot || enCours;

  function lancer(travail: () => Promise<Resultat>) {
    setErreur(null);
    demarrer(async () => {
      const reponse = await travail();
      if (!reponse.ok) setErreur(reponse.message);
      else router.refresh();
    });
  }

  async function deposer(fichiers: FileList | null) {
    const choisis = Array.from(fichiers ?? []);
    if (choisis.length === 0) return;
    setErreur(null);
    setDepot(true);
    try {
      // Une par une, et dans l'ordre : deux dépôts simultanés se verraient
      // attribuer le même rang, et la file se rangerait au hasard.
      for (const fichier of choisis) {
        const url = await televerserImage(fichier, dossier);
        const reponse = await ajouterPhoto(url, altParDefaut, emplacement);
        if (!reponse.ok) {
          setErreur(reponse.message);
          break;
        }
      }
      router.refresh();
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
      if (champFichier.current) champFichier.current.value = "";
    }
  }

  function legende(photo: PhotoGalerie): string {
    return legendes[photo.id] ?? photo.alt;
  }

  return (
    <div>
      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/12 px-4 py-5 text-center text-sm font-light leading-relaxed text-white/40">
          {vide}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
            >
              <div className="flex gap-3">
                <span
                  className={`relative block w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.06] ${apercu}`}
                >
                  <PhotoDistante
                    src={photo.image_url}
                    alt={photo.alt}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[0.7rem] font-light text-white/35">
                    Photo {index + 1} sur {photos.length}
                  </p>

                  <label className="mt-1 block text-sm">
                    <span className="sr-only">Description de la photo {index + 1}</span>
                    <input
                      value={legende(photo)}
                      onChange={(e) =>
                        setLegendes((l) => ({ ...l, [photo.id]: e.target.value }))
                      }
                      placeholder="Ce que montre la photo"
                      className={`${champSombre} mt-0 py-2 text-sm`}
                    />
                  </label>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={occupe || legende(photo).trim() === photo.alt}
                      onClick={() =>
                        lancer(async () => {
                          const reponse = await decrirePhoto(photo.id, legende(photo));
                          if (reponse.ok) setLegendee(photo.id);
                          return reponse;
                        })
                      }
                      className="rounded-full border border-gold/35 px-3 py-1.5 text-xs text-gold disabled:opacity-30"
                    >
                      Enregistrer
                    </button>
                    {legendee === photo.id && legende(photo).trim() === photo.alt && (
                      <span className="text-xs font-light text-emerald-300">Enregistré</span>
                    )}

                    <span className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={occupe || index === 0}
                        onClick={() => lancer(() => deplacerPhoto(photo.id, -1))}
                        aria-label={`Monter la photo ${index + 1}`}
                        className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={occupe || index === photos.length - 1}
                        onClick={() => lancer(() => deplacerPhoto(photo.id, 1))}
                        aria-label={`Descendre la photo ${index + 1}`}
                        className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={occupe}
                        onClick={() => lancer(() => supprimerPhoto(photo.id))}
                        aria-label={`Retirer la photo ${index + 1}`}
                        className="h-8 w-8 rounded-full border border-red-400/30 text-red-300/80 disabled:opacity-25"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-3 inline-block cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
        {depot ? "Envoi…" : photos.length === 0 ? "Ajouter des photos" : "En ajouter d'autres"}
        <input
          ref={champFichier}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          disabled={occupe}
          onChange={(e) => deposer(e.target.files)}
        />
      </label>

      {erreur && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {erreur}
        </p>
      )}
    </div>
  );
}
