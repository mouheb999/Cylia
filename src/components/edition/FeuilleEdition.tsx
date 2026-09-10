"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { televerserImage } from "./televerser";
import type { ChampEdition } from "./ContexteEdition";

/**
 * L'éditeur d'un bloc : un champ, un bouton, rien d'autre.
 *
 * Volontairement pauvre. Le salon doit pouvoir corriger un titre entre deux
 * clientes ; tout ce qui ressemble à un traitement de texte serait un obstacle.
 */
export default function FeuilleEdition({
  champ,
  onFermer,
  onEnregistrer,
  onReinitialiser,
}: {
  champ: ChampEdition;
  onFermer: () => void;
  onEnregistrer: (valeur: string) => Promise<void>;
  onReinitialiser: () => Promise<void>;
}) {
  const [texte, setTexte] = useState(champ.valeur || champ.defaut);
  const [urlImage, setUrlImage] = useState(champ.valeur);
  const [erreur, setErreur] = useState<string | null>(null);
  const [depot, setDepot] = useState(false);
  const [enCours, demarrer] = useTransition();

  const personnalise = champ.valeur !== "";

  function lancer(travail: () => Promise<void>) {
    setErreur(null);
    demarrer(async () => {
      try {
        await travail();
      } catch (probleme) {
        setErreur(probleme instanceof Error ? probleme.message : "Enregistrement impossible.");
      }
    });
  }

  async function choisirFichier(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    setDepot(true);
    try {
      const url = await televerserImage(fichier, champ.dossier ?? "site");
      setUrlImage(url);
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  const occupe = enCours || depot;

  return (
    <Feuille
      titre={champ.titre}
      sousTitre={champ.type === "image" ? "Choisissez une photo depuis votre téléphone." : undefined}
      onFermer={onFermer}
    >
      {champ.type === "image" ? (
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {urlImage ? (
              <Image src={urlImage} alt="" fill sizes="(max-width: 512px) 100vw, 512px" className="object-cover" />
            ) : (
              <p className="flex h-full items-center justify-center px-6 text-center text-sm font-light text-white/40">
                Photo d&apos;origine du site
              </p>
            )}
          </div>

          <label className={`${boutonOr} mt-5 block cursor-pointer`}>
            {depot ? "Envoi de la photo…" : "Choisir une photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={occupe}
              onChange={(e) => choisirFichier(e.target.files?.[0])}
            />
          </label>
        </div>
      ) : (
        <label className="block text-sm">
          <span className="font-light text-white/60">Texte affiché</span>
          {champ.type === "multiligne" ? (
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={4}
              autoFocus
              className={`${champSombre} resize-none`}
            />
          ) : (
            <input
              type={champ.type === "lien" ? "url" : "text"}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              autoFocus
              className={champSombre}
            />
          )}
        </label>
      )}

      {erreur && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          disabled={occupe || (champ.type === "image" && !urlImage)}
          onClick={() => lancer(() => onEnregistrer(champ.type === "image" ? urlImage : texte))}
          className={boutonOr}
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>

        {personnalise && (
          <button
            type="button"
            disabled={occupe}
            onClick={() => lancer(onReinitialiser)}
            className="rounded-full border border-white/15 py-3 text-sm font-light text-white/60"
          >
            Remettre la version d&apos;origine
          </button>
        )}
      </div>
    </Feuille>
  );
}
