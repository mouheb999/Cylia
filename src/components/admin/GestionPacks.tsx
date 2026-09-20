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
import { formatDuree, formatPrix } from "@/lib/format";
import { cheminPack, inclusionsDuPack, photosDuPack, prestationDuPack } from "@/lib/packs";
import type { Pack, Prestation } from "@/lib/supabase/types";

const VIDE: FormPack = {
  nom: "",
  description: "",
  inclusions: [],
  prix: null,
  duree_minutes: null,
  images: [],
  prestation_id: null,
  ordre: 0,
  actif: true,
};

/** Le panneau édite les lignes d'un seul tenant ; la base les garde en tableau. */
function versLignes(entrees: string[]): string {
  return entrees.join("\n");
}

function depuisLignes(texte: string): string[] {
  return texte
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter(Boolean);
}

/**
 * Les packs du salon, composés depuis le panneau.
 *
 * Mêmes gestes que pour les photos et les produits : on ajoute, on range, on
 * retire. Les photos partent du navigateur droit vers Supabase (voir
 * `televerser.ts`) ; seules leurs adresses traversent l'action serveur.
 *
 * Un pack décoché reste ici mais quitte l'accueil : c'est ce qui permet de
 * préparer une formule de saison sans la publier le jour même.
 *
 * Depuis que chaque pack a sa fiche — `/packs/<slug>` —, le formulaire porte
 * tout ce que la fiche montre : l'album, le déroulé ligne à ligne, la durée, et
 * la prestation que « Réserver ce pack » dépose dans le panier de la cliente.
 */
export default function GestionPacks({
  packs,
  prestations,
}: {
  packs: Pack[];
  prestations: Prestation[];
}) {
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

  async function deposer(fichiers: FileList | null) {
    const choisis = Array.from(fichiers ?? []);
    if (choisis.length === 0 || !form) return;
    setErreur(null);
    setDepot(true);
    try {
      const deposees = await Promise.all(
        choisis.map((fichier) => televerserImage(fichier, "packs")),
      );
      setForm((f) => (f ? { ...f, images: [...f.images, ...deposees] } : f));
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  /** Une photo change de rang ; celle de tête est la couverture. */
  function deplacerPhoto(index: number, sens: -1 | 1) {
    setForm((f) => {
      if (!f) return f;
      const cible = index + sens;
      if (cible < 0 || cible >= f.images.length) return f;
      const copie = [...f.images];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return { ...f, images: copie };
    });
  }

  function retirerPhoto(index: number) {
    setForm((f) => (f ? { ...f, images: f.images.filter((_, i) => i !== index) } : f));
  }

  function ouvrir(pack: Pack) {
    setForm({
      id: pack.id,
      nom: pack.nom,
      description: pack.description,
      // Ce que la fiche affiche aujourd'hui — y compris les déroulés que le
      // salon avait écrits d'un trait dans la description, avant que les
      // lignes existent. Enregistrer les inscrit pour de bon.
      inclusions: inclusionsDuPack(pack),
      prix: pack.prix,
      duree_minutes: pack.duree_minutes,
      images: photosDuPack(pack),
      prestation_id: prestationDuPack(pack, prestations)?.id ?? null,
      ordre: pack.ordre,
      actif: pack.actif,
    });
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
          {packs.map((pack, index) => {
            const photos = photosDuPack(pack);
            const reservee = prestationDuPack(pack, prestations);

            return (
              <li key={pack.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex gap-3">
                  <span className="relative block aspect-[4/3] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                    {photos[0] ? (
                      <Image src={photos[0]} alt="" fill sizes="88px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-white/25">
                        sans photo
                      </span>
                    )}
                    {photos.length > 1 && (
                      <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 text-[0.6rem] text-white/80">
                        {photos.length}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base text-cream">{pack.nom}</p>
                    <p className="mt-0.5 text-xs font-light text-white/40">
                      {pack.prix === null ? "Sur devis" : formatPrix(pack.prix, "DT")}
                      {pack.duree_minutes ? ` · ${formatDuree(pack.duree_minutes)}` : ""}
                      {!pack.actif && " · masqué"}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-light text-white/30">
                      {reservee
                        ? `Réserve : ${reservee.nom}`
                        : "Aucune prestation liée — le bouton ouvre le tunnel sans rien retenir"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={occupe}
                        onClick={() => ouvrir(pack)}
                        className="rounded-full border border-gold/35 px-3 py-1.5 text-xs text-gold disabled:opacity-30"
                      >
                        Modifier
                      </button>

                      <a
                        href={cheminPack(pack)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60"
                      >
                        Voir la fiche
                      </a>

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
            );
          })}
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
          sousTitre="Il s'affiche sur l'accueil et a sa propre fiche, où la cliente le réserve."
          onFermer={() => setForm(null)}
        >
          <div className="space-y-4">
            <div className="text-sm">
              <span className={libelle}>
                Photos{form.images.length > 1 && ` (${form.images.length})`}
              </span>
              <p className="mt-1 text-xs font-light text-white/35">
                Elles défilent en haut de la fiche. La première sert de
                couverture sur l&apos;accueil.
              </p>

              {form.images.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-white/12 px-4 py-6 text-center text-xs font-light text-white/30">
                  Aucune photo pour l&apos;instant
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {form.images.map((url, index) => (
                    <li
                      key={url}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2"
                    >
                      <span className="relative block aspect-[4/3] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                        <Image src={url} alt="" fill sizes="88px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1 text-xs font-light text-white/40">
                        {index === 0 ? "Couverture" : `Photo ${index + 1}`}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deplacerPhoto(index, -1)}
                          disabled={occupe || index === 0}
                          aria-label={`Monter la photo ${index + 1}`}
                          className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => deplacerPhoto(index, 1)}
                          disabled={occupe || index === form.images.length - 1}
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

              <label className="mt-2 inline-block cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
                {depot
                  ? "Envoi…"
                  : form.images.length === 0
                    ? "Déposer des photos"
                    : "En ajouter d'autres"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  className="sr-only"
                  disabled={occupe}
                  onChange={(e) => {
                    deposer(e.target.files);
                    // Sans cela, redéposer le même fichier ne déclencherait
                    // rien : la valeur du champ n'aurait pas changé.
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

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
              <span className={libelle}>Phrase de présentation</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Coiffure, maquillage et soin du visage — la journée entière."
                className={champSombre}
              />
              <span className="mt-1 block text-xs font-light text-white/35">
                C&apos;est ce qu&apos;on lit sur la carte de l&apos;accueil, sous
                le nom.
              </span>
            </label>

            <label className="block text-sm">
              <span className={libelle}>Ce que le pack comprend — une ligne par étape</span>
              <textarea
                value={versLignes(form.inclusions)}
                onChange={(e) => setForm({ ...form, inclusions: depuisLignes(e.target.value) })}
                rows={6}
                placeholder={"Hammam\nGommage\nEnveloppement à l'argile verte\nBain d'huile\nCafé ou boisson"}
                className={champSombre}
              />
              <span className="mt-1 block text-xs font-light text-white/35">
                Chaque ligne devient une étape du déroulé, sur la fiche du pack.
              </span>
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

            <label className="block text-sm">
              <span className={libelle}>Durée en minutes — laisser vide pour ne rien annoncer</span>
              <input
                type="number"
                inputMode="numeric"
                min={5}
                step="5"
                value={form.duree_minutes ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duree_minutes: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="90"
                className={champSombre}
              />
              <span className="mt-1 block text-xs font-light text-white/35">
                Affichée sur la fiche. Ce n&apos;est pas elle qui décide des
                créneaux — c&apos;est la durée de la prestation réservée,
                ci-dessous.
              </span>
            </label>

            <label className="block text-sm">
              <span className={libelle}>Prestation réservée par le bouton</span>
              <select
                value={form.prestation_id ?? ""}
                onChange={(e) =>
                  setForm({ ...form, prestation_id: e.target.value || null })
                }
                className={champSombre}
              >
                <option value="" className="bg-noir-soft">
                  Aucune — le bouton ouvre le tunnel
                </option>
                {prestations.map((prestation) => (
                  <option key={prestation.id} value={prestation.id} className="bg-noir-soft">
                    {prestation.nom}
                    {prestation.actif ? "" : " (masquée)"}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs font-light text-white/35">
                « Réserver ce pack » la dépose dans le panier de la cliente :
                c&apos;est sa durée qui réserve le bon temps de cabine, et son
                tarif qui part au salon.
              </span>
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
