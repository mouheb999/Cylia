"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterPhoto, deplacerPhoto, supprimerPhoto } from "@/app/actions/admin";
import { useEdition } from "@/components/edition/ContexteEdition";
import { televerserImage } from "@/components/edition/televerser";
import PhotoDistante from "@/components/PhotoDistante";
import Visionneuse from "@/components/Visionneuse";

export type PhotoAffichee = {
  /** `null` pour les photos d'origine livrées avec le site. */
  id: string | null;
  src: string | StaticImageData;
  alt: string;
};

export default function GrilleGalerie({ photos }: { photos: PhotoAffichee[] }) {
  const edition = useEdition();
  const router = useRouter();
  const champFichier = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [depot, setDepot] = useState(false);
  const [enCours, demarrer] = useTransition();
  const [ouverte, setOuverte] = useState<number | null>(null);
  const fermer = useCallback(() => setOuverte(null), []);

  const modifiables = photos.some((p) => p.id !== null);

  function lancer(travail: () => Promise<{ ok: boolean; message?: string }>) {
    setErreur(null);
    demarrer(async () => {
      const reponse = await travail();
      if (!reponse.ok) setErreur(reponse.message ?? "Opération impossible.");
      else router.refresh();
    });
  }

  async function deposer(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    setDepot(true);
    try {
      const url = await televerserImage(fichier, "galerie");
      const reponse = await ajouterPhoto(url, "Réalisation CYLIA Maison de Beauté");
      if (!reponse.ok) setErreur(reponse.message);
      else router.refresh();
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
      if (champFichier.current) champFichier.current.value = "";
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {photos.map((photo, index) => (
          <div
            key={photo.id ?? index}
            className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand"
          >
            <button
              type="button"
              onClick={() => setOuverte(index)}
              aria-label={`Agrandir la photo ${index + 1} : ${photo.alt}`}
              className="group absolute inset-0 block"
            >
              {typeof photo.src === "string" ? (
                // Les photos déposées passent par `PhotoDistante` : si
                // l'optimiseur refuse, c'est l'original qui s'affiche, jamais
                // le carré barré du navigateur.
                <PhotoDistante
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="50vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-active:scale-[0.98]"
                  repli={
                    <span
                      aria-hidden="true"
                      className="flex h-full items-center justify-center font-script text-5xl text-gold-deep/50"
                    >
                      C
                    </span>
                  }
                />
              ) : (
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  placeholder="blur"
                  sizes="50vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-active:scale-[0.98]"
                />
              )}
            </button>

            {edition.actif && photo.id && (
              <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                <button
                  type="button"
                  disabled={enCours || index === 0}
                  onClick={() => lancer(() => deplacerPhoto(photo.id as string, -1))}
                  aria-label="Déplacer avant"
                  className="rounded-full bg-noir/80 px-2.5 py-1 text-xs text-cream disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => lancer(() => supprimerPhoto(photo.id as string))}
                  aria-label={`Retirer la photo ${index + 1}`}
                  className="rounded-full bg-noir/80 px-2.5 py-1 text-xs text-red-300"
                >
                  Retirer
                </button>
                <button
                  type="button"
                  disabled={enCours || index === photos.length - 1}
                  onClick={() => lancer(() => deplacerPhoto(photo.id as string, 1))}
                  aria-label="Déplacer après"
                  className="rounded-full bg-noir/80 px-2.5 py-1 text-xs text-cream disabled:opacity-30"
                >
                  →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {ouverte !== null && (
        <Visionneuse photos={photos} depart={ouverte} onFermer={fermer} />
      )}

      {edition.actif && (
        <div className="mt-4">
          {!modifiables && (
            <p className="mb-3 text-center text-xs font-light leading-relaxed text-muted">
              Ce sont les photos livrées avec le site. Dès que vous en ajoutez une,
              elles laissent la place aux vôtres.
            </p>
          )}

          <label className="gold-gradient block cursor-pointer rounded-full py-3 text-center font-serif text-base text-noir">
            {depot ? "Envoi de la photo…" : "Ajouter une photo"}
            <input
              ref={champFichier}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={depot || enCours}
              onChange={(e) => deposer(e.target.files?.[0])}
            />
          </label>

          {erreur && (
            <p role="alert" className="mt-3 text-center text-sm text-red-500">
              {erreur}
            </p>
          )}
        </div>
      )}
    </>
  );
}
