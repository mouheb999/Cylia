"use client";

import PhotoDistante from "@/components/PhotoDistante";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deplacerCategoriePack,
  enregistrerCategoriePack,
  supprimerCategoriePack,
  type FormCategoriePack,
  type Resultat,
} from "@/app/actions/admin";
import { televerserImage } from "@/components/edition/televerser";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre, libelle } from "@/components/ui/champs";
import { cheminCategoriePack, imageCategoriePack, libelleNombrePacks, packsDeCategorie } from "@/lib/packs";
import type { CategoriePack, Pack } from "@/lib/supabase/types";

const VIDE: FormCategoriePack = { nom: "", description: "", image_url: null, actif: true };

/**
 * Les catégories de packs — « Packs Hammam », « Packs Mariée »…
 *
 * Chacune est une grande carte sur `/packs`, qui ouvre ses formules. Sa photo
 * est facultative : sans elle, la carte prend la couverture de son premier
 * pack. Retirer une catégorie ne retire aucun pack — ils s'affichent alors
 * sous les catégories.
 */
export default function GestionCategoriesPacks({
  categories,
  packs,
}: {
  categories: CategoriePack[];
  packs: Pack[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormCategoriePack | null>(null);
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
      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/12 px-4 py-5 text-center text-sm font-light leading-relaxed text-white/40">
          Aucune catégorie : la page des packs les affiche tous en grille.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {categories.map((categorie, index) => {
            const photo = imageCategoriePack(categorie, packs);
            const nombre = packsDeCategorie(categorie, packs).length;

            return (
              <li key={categorie.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex gap-3">
                  <span className="relative block aspect-[4/3] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                    {photo ? (
                      <PhotoDistante src={photo} alt="" fill sizes="88px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-white/25">
                        sans photo
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base text-cream">{categorie.nom}</p>
                    <p className="mt-0.5 text-xs font-light text-white/40">
                      {libelleNombrePacks(nombre)}
                      {!categorie.actif && " · masquée"}
                      {nombre === 0 && categorie.actif && " · invisible tant qu'elle est vide"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={occupe}
                        onClick={() =>
                          setForm({
                            id: categorie.id,
                            nom: categorie.nom,
                            description: categorie.description,
                            image_url: categorie.image_url,
                            actif: categorie.actif,
                          })
                        }
                        className="rounded-full border border-gold/35 px-3 py-1.5 text-xs text-gold disabled:opacity-30"
                      >
                        Modifier
                      </button>

                      <a
                        href={cheminCategoriePack(categorie)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60"
                      >
                        Voir
                      </a>

                      <span className="ml-auto flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={occupe || index === 0}
                          onClick={() => lancer(() => deplacerCategoriePack(categorie.id, -1))}
                          aria-label={`Monter ${categorie.nom}`}
                          className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={occupe || index === categories.length - 1}
                          onClick={() => lancer(() => deplacerCategoriePack(categorie.id, 1))}
                          aria-label={`Descendre ${categorie.nom}`}
                          className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={occupe}
                          onClick={() => {
                            if (
                              confirm(
                                `Retirer « ${categorie.nom} » ? Ses packs restent, sans catégorie.`,
                              )
                            ) {
                              lancer(() => supprimerCategoriePack(categorie.id));
                            }
                          }}
                          aria-label={`Retirer ${categorie.nom}`}
                          className="h-8 w-8 rounded-full border border-red-400/30 text-red-300/80 disabled:opacity-25"
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={occupe}
        onClick={() => setForm({ ...VIDE })}
        className="mt-3 rounded-full border border-gold/35 px-4 py-2 text-xs text-gold disabled:opacity-30"
      >
        Ajouter une catégorie
      </button>

      {erreur && !form && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {form && (
        <Feuille
          titre={form.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
          sousTitre="Une grande carte sur la page des packs, qui ouvre ses formules."
          onFermer={() => setForm(null)}
        >
          <div className="space-y-4">
            <div className="text-sm">
              <span className={libelle}>Photo de la carte</span>
              <p className="mt-1 text-xs font-light text-white/35">
                Facultative : sans elle, c&apos;est la couverture du premier pack
                de la catégorie qui s&apos;affiche.
              </p>
              {form.image_url && (
                <span className="relative mt-2 block aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/[0.06]">
                  <PhotoDistante
                    src={form.image_url}
                    alt=""
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                </span>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-block cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
                  {depot ? "Envoi…" : form.image_url ? "Changer la photo" : "Déposer une photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    disabled={occupe}
                    onChange={(e) => {
                      deposer(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {form.image_url && (
                  <button
                    type="button"
                    disabled={occupe}
                    onClick={() => setForm({ ...form, image_url: null })}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 disabled:opacity-30"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>
            </div>

            <label className="block text-sm">
              <span className={libelle}>Nom</span>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Packs Hammam"
                className={champSombre}
              />
            </label>

            <label className="block text-sm">
              <span className={libelle}>Phrase de présentation</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Le rituel du hammam, du gommage au bain d'huile."
                className={champSombre}
              />
            </label>

            <label className="flex items-center gap-2.5 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                className="h-4 w-4 accent-[#C9A227]"
              />
              Visible sur le site
            </label>

            <button
              type="button"
              disabled={occupe || form.nom.trim().length < 2}
              onClick={() => lancer(() => enregistrerCategoriePack(form), () => setForm(null))}
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
