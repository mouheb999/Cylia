"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deplacerPack,
  enregistrerPack,
  supprimerPack,
  type FormPack,
  type Resultat,
} from "@/app/actions/admin";
import { televerserImage } from "@/components/edition/televerser";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre, libelle } from "@/components/ui/champs";
import { formatPrix } from "@/lib/format";
import type { Pack } from "@/lib/supabase/types";

const VIDE: FormPack = {
  nom: "",
  description: "",
  prix: null,
  image_url: null,
  ordre: 0,
  actif: true,
};

/**
 * Les packs de l'accueil, composés depuis le panneau.
 *
 * Mêmes gestes que pour les photos et les produits : on ajoute, on range, on
 * retire. La photo part du navigateur droit vers Supabase (voir
 * `televerser.ts`) ; seule son adresse traverse l'action serveur.
 *
 * Un pack décoché reste ici mais quitte l'accueil : c'est ce qui permet de
 * préparer une formule de saison sans la publier le jour même.
 */
export default function GestionPacks({ packs }: { packs: Pack[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormPack | null>(null);
  const [depot, setDepot] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const occupe = depot || enCours;

  function lancer(travail: () => Promise<Resultat>, apres?: () => void) {
    setErreur(null);
    demarrer(async () => {
      const reponse = await travail();
      if (!reponse.ok) setErreur(reponse.message);
      else {
        apres?.();
        router.refresh();
      }
    });
  }

  async function deposer(fichier: File | undefined) {
    if (!fichier || !form) return;
    setErreur(null);
    setDepot(true);
    try {
      const url = await televerserImage(fichier, "packs");
      setForm((f) => (f ? { ...f, image_url: url } : f));
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  return (
    <div>
      {packs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/12 px-4 py-5 text-center text-sm font-light leading-relaxed text-white/40">
          Aucun pack pour l&apos;instant. Tant que cette liste est vide, la
          section « Nos packs » ne s&apos;affiche pas sur l&apos;accueil — mieux
          vaut pas de section qu&apos;une section vide.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {packs.map((pack, index) => (
            <li key={pack.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="flex gap-3">
                <span className="relative block aspect-[4/3] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                  {pack.image_url ? (
                    <Image src={pack.image_url} alt="" fill sizes="88px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-white/25">
                      sans photo
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base text-cream">{pack.nom}</p>
                  <p className="mt-0.5 text-xs font-light text-white/40">
                    {pack.prix === null ? "Sur devis" : formatPrix(pack.prix, "DT")}
                    {!pack.actif && " · masqué"}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={occupe}
                      onClick={() =>
                        setForm({
                          id: pack.id,
                          nom: pack.nom,
                          description: pack.description,
                          prix: pack.prix,
                          image_url: pack.image_url,
                          ordre: pack.ordre,
                          actif: pack.actif,
                        })
                      }
                      className="rounded-full border border-gold/35 px-3 py-1.5 text-xs text-gold disabled:opacity-30"
                    >
                      Modifier
                    </button>

                    <span className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={occupe || index === 0}
                        onClick={() => lancer(() => deplacerPack(pack.id, -1))}
                        aria-label={`Monter ${pack.nom}`}
                        className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={occupe || index === packs.length - 1}
                        onClick={() => lancer(() => deplacerPack(pack.id, 1))}
                        aria-label={`Descendre ${pack.nom}`}
                        className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={occupe}
                        onClick={() => {
                          if (confirm(`Retirer « ${pack.nom} » ?`)) {
                            lancer(() => supprimerPack(pack.id));
                          }
                        }}
                        aria-label={`Retirer ${pack.nom}`}
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

      <button
        type="button"
        disabled={occupe}
        onClick={() => setForm({ ...VIDE, ordre: packs.length + 1 })}
        className="mt-3 rounded-full border border-gold/35 px-4 py-2 text-xs text-gold disabled:opacity-30"
      >
        {packs.length === 0 ? "Ajouter un pack" : "En ajouter un autre"}
      </button>

      {erreur && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {form && (
        <Feuille
          titre={form.id ? "Modifier le pack" : "Nouveau pack"}
          sousTitre="Il s'affiche sur l'accueil, entre les services et les offres."
          onFermer={() => setForm(null)}
        >
          <div className="space-y-4">
            <label className="block text-sm">
              <span className={libelle}>Nom</span>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Pack mariée"
                className={champSombre}
              />
            </label>

            <label className="block text-sm">
              <span className={libelle}>Ce que le pack comprend</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Coiffure, maquillage et soin du visage — la journée entière."
                className={champSombre}
              />
            </label>

            <label className="block text-sm">
              <span className={libelle}>Prix en dinars — laisser vide pour « sur devis »</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={form.prix ?? ""}
                onChange={(e) =>
                  setForm({ ...form, prix: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="Sur devis"
                className={champSombre}
              />
            </label>

            <div className="text-sm">
              <span className={libelle}>Photo</span>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="relative block aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                  {form.image_url ? (
                    <Image src={form.image_url} alt="" fill sizes="96px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-white/25">
                      aucune
                    </span>
                  )}
                </span>
                <label className="cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
                  {depot ? "Envoi…" : form.image_url ? "Remplacer" : "Déposer une photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    disabled={occupe}
                    onChange={(e) => deposer(e.target.files?.[0])}
                  />
                </label>
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: null })}
                    className="text-xs text-white/40 underline"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                className="h-4 w-4 accent-[#C9A227]"
              />
              Visible sur l&apos;accueil
            </label>

            <button
              type="button"
              disabled={occupe || form.nom.trim().length < 2}
              onClick={() => lancer(() => enregistrerPack(form), () => setForm(null))}
              className={`${boutonOr} w-full`}
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>

            {erreur && (
              <p role="alert" className="text-sm text-red-300">
                {erreur}
              </p>
            )}
          </div>
        </Feuille>
      )}
    </div>
  );
}
