"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enregistrerContenu, reinitialiserContenu } from "@/app/actions/admin";
import { televerserImage } from "@/components/edition/televerser";

/**
 * Une photo du site qui vit seule, rangée sous sa clé de contenu.
 *
 * Le bandeau et la galerie ont leur liste ; l'encart « Prenez soin de vous »
 * et le logo, eux, n'ont qu'une image chacun. Elle est enregistrée comme un
 * texte l'est — une clé, une valeur — ce qui donne gratuitement le « remettre
 * la photo d'origine » : on efface la ligne, et le site reprend l'image
 * livrée avec lui.
 */
export default function PhotoUnique({
  cle,
  titre,
  description,
  valeur,
  dossier = "site",
  apercu = "h-24 w-full",
  ajustement = "object-cover",
}: {
  cle: string;
  titre: string;
  description: string;
  /** Adresse enregistrée, ou "" tant que celle du code est affichée. */
  valeur: string;
  dossier?: string;
  apercu?: string;
  ajustement?: string;
}) {
  const router = useRouter();
  const [depot, setDepot] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const occupe = depot || enCours;

  async function deposer(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    setDepot(true);
    try {
      const url = await televerserImage(fichier, dossier);
      const reponse = await enregistrerContenu(cle, url, "image");
      if (!reponse.ok) setErreur(reponse.message);
      else router.refresh();
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  function remettre() {
    setErreur(null);
    demarrer(async () => {
      const reponse = await reinitialiserContenu(cle);
      if (!reponse.ok) setErreur(reponse.message);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="font-serif text-base font-light text-cream">{titre}</p>
      <p className="mt-1 text-xs font-light leading-relaxed text-white/40">{description}</p>

      {valeur ? (
        <span
          className={`relative mt-3 block overflow-hidden rounded-xl bg-white/[0.06] ${apercu}`}
        >
          <Image
            src={valeur}
            alt={titre}
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className={ajustement}
          />
        </span>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-white/12 px-4 py-4 text-center text-xs font-light text-white/35">
          C&apos;est la photo livrée avec le site qui s&apos;affiche.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
          {depot ? "Envoi…" : valeur ? "Changer la photo" : "Déposer une photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={occupe}
            onChange={(e) => {
              deposer(e.target.files?.[0]);
              // Sans cela, redéposer le même fichier ne déclencherait rien.
              e.target.value = "";
            }}
          />
        </label>

        {valeur && (
          <button
            type="button"
            disabled={occupe}
            onClick={remettre}
            className="rounded-full border border-white/12 px-4 py-2 text-xs text-white/50 disabled:opacity-30"
          >
            Photo d&apos;origine
          </button>
        )}
      </div>

      {erreur && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {erreur}
        </p>
      )}
    </div>
  );
}
