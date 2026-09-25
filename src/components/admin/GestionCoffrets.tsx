"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deplacerCoffret,
  enregistrerCoffret,
  supprimerCoffret,
  type FormCoffret,
  type Resultat,
} from "@/app/actions/admin";
import { televerserImage } from "@/components/edition/televerser";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre, libelle } from "@/components/ui/champs";
import { produitsDuCoffret, visuelsDuCoffret } from "@/lib/coffrets";
import { formatPrix } from "@/lib/format";
import { filtrerProduits } from "@/lib/produits";
import type { Coffret, Produit } from "@/lib/supabase/types";

const VIDE: FormCoffret = {
  nom: "",
  description: "",
  prix: Number.NaN,
  image_url: null,
  produit_ids: [],
  ordre: 0,
  actif: true,
};

/**
 * Les coffrets de la boutique, composés depuis le panneau.
 *
 * Deux façons d'en faire un, qui se combinent : déposer la photo du coffret
 * tout prêt, et/ou cocher les produits du catalogue qu'il contient. Cochés,
 * les produits s'affichent sur la carte et le coffret suit leur stock ; sans
 * photo, la carte assemble les leurs.
 *
 * Le prix est toujours celui que le salon fixe. Le total des flacons achetés
 * un par un est rappelé à côté, pour qu'on voie l'économie offerte — c'est
 * lui que la carte affiche barré.
 */
export default function GestionCoffrets({
  coffrets,
  produits,
}: {
  coffrets: Coffret[];
  produits: Produit[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormCoffret | null>(null);
  const [recherche, setRecherche] = useState("");
  const [depot, setDepot] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const occupe = depot || enCours;
  const parId = useMemo(() => new Map(produits.map((p) => [p.id, p])), [produits]);

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
      const url = await televerserImage(fichier, "coffrets");
      setForm((f) => (f ? { ...f, image_url: url } : f));
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  function basculer(id: string) {
    setForm((f) => {
      if (!f) return f;
      const present = f.produit_ids.includes(id);
      return {
        ...f,
        produit_ids: present ? f.produit_ids.filter((x) => x !== id) : [...f.produit_ids, id],
      };
    });
  }

  function ouvrir(coffret: Coffret) {
    setRecherche("");
    setForm({
      id: coffret.id,
      nom: coffret.nom,
      description: coffret.description,
      prix: coffret.prix,
      image_url: coffret.image_url,
      produit_ids: coffret.produit_ids ?? [],
      ordre: coffret.ordre,
      actif: coffret.actif,
    });
  }

  const choisis = form
    ? form.produit_ids.map((id) => parId.get(id)).filter((p): p is Produit => p !== undefined)
    : [];
  const valeurSeparee = choisis.reduce((t, p) => t + p.prix, 0);
  const proposes = form
    ? filtrerProduits(produits, { recherche }).filter((p) => !form.produit_ids.includes(p.id))
    : [];
  const prixValable = form !== null && Number.isFinite(form.prix) && form.prix >= 0;

  return (
    <div>
      {coffrets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/12 px-4 py-5 text-center text-sm font-light leading-relaxed text-white/40">
          Aucun coffret pour l&apos;instant. Tant que cette liste est vide, la
          section « Nos coffrets » ne s&apos;affiche pas sur l&apos;accueil.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {coffrets.map((coffret, index) => {
            const photo = visuelsDuCoffret(coffret, produits)[0];
            const contenu = produitsDuCoffret(coffret, produits);

            return (
              <li
                key={coffret.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
              >
                <div className="flex gap-3">
                  <span className="relative block aspect-square w-[5rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                    {photo ? (
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="80px"
                        className={coffret.image_url ? "object-cover" : "object-contain p-1.5"}
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-white/25">
                        sans photo
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base text-cream">{coffret.nom}</p>
                    <p className="mt-0.5 text-xs font-light text-white/40">
                      {formatPrix(coffret.prix, "DT")}
                      {!coffret.actif && " · masqué"}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-light text-white/30">
                      {contenu.length > 0
                        ? `${contenu.length} produit${contenu.length > 1 ? "s" : ""} : ${contenu
                            .map((p) => p.nom)
                            .join(", ")}`
                        : "Photo seule — aucun produit suivi en stock"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={occupe}
                        onClick={() => ouvrir(coffret)}
                        className="rounded-full border border-gold/35 px-3 py-1.5 text-xs text-gold disabled:opacity-30"
                      >
                        Modifier
                      </button>

                      <span className="ml-auto flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={occupe || index === 0}
                          onClick={() => lancer(() => deplacerCoffret(coffret.id, -1))}
                          aria-label={`Monter ${coffret.nom}`}
                          className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={occupe || index === coffrets.length - 1}
                          onClick={() => lancer(() => deplacerCoffret(coffret.id, 1))}
                          aria-label={`Descendre ${coffret.nom}`}
                          className="h-8 w-8 rounded-full border border-white/15 text-white/60 disabled:opacity-25"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={occupe}
                          onClick={() => {
                            if (confirm(`Retirer « ${coffret.nom} » ?`)) {
                              lancer(() => supprimerCoffret(coffret.id));
                            }
                          }}
                          aria-label={`Retirer ${coffret.nom}`}
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
        onClick={() => {
          setRecherche("");
          setForm({ ...VIDE, ordre: coffrets.length + 1 });
        }}
        className="mt-3 rounded-full border border-gold/35 px-4 py-2 text-xs text-gold disabled:opacity-30"
      >
        {coffrets.length === 0 ? "Ajouter un coffret" : "En ajouter un autre"}
      </button>

      {erreur && !form && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {erreur}
        </p>
      )}

      {form && (
        <Feuille
          titre={form.id ? "Modifier le coffret" : "Nouveau coffret"}
          sousTitre="Il s'affiche sur l'accueil, près de la boutique, et s'ajoute au panier comme un produit."
          onFermer={() => setForm(null)}
        >
          <div className="space-y-5">
            <div className="text-sm">
              <span className={libelle}>Photo du coffret</span>
              <p className="mt-1 text-xs font-light text-white/35">
                Facultative si vous choisissez des produits ci-dessous : la
                carte assemble alors leurs photos.
              </p>

              {form.image_url ? (
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                  <span className="relative block aspect-[4/3] w-[7rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                    <Image src={form.image_url} alt="" fill sizes="112px" className="object-cover" />
                  </span>
                  <button
                    type="button"
                    disabled={occupe}
                    onClick={() => setForm({ ...form, image_url: null })}
                    className="ml-auto rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300/80 disabled:opacity-25"
                  >
                    Retirer la photo
                  </button>
                </div>
              ) : null}

              <label className="mt-2 inline-block cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
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
            </div>

            <label className="block text-sm">
              <span className={libelle}>Nom</span>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Coffret cheveux secs"
                className={champSombre}
              />
            </label>

            <label className="block text-sm">
              <span className={libelle}>Phrase de présentation (facultative)</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="La routine complète pour nourrir les longueurs."
                className={champSombre}
              />
            </label>

            <div className="text-sm">
              <span className={libelle}>
                Produits du coffret{choisis.length > 0 && ` (${choisis.length})`}
              </span>
              <p className="mt-1 text-xs font-light text-white/35">
                Le coffret suit leur stock : il passe « épuisé » dès que l&apos;un
                d&apos;eux manque, et chaque vente décrémente chacun d&apos;eux.
              </p>

              {choisis.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {choisis.map((produit) => (
                    <li
                      key={produit.id}
                      className="flex items-center gap-2.5 rounded-xl border border-gold/25 bg-gold/[0.06] px-2.5 py-2"
                    >
                      <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white">
                        {produit.image_url && (
                          <Image
                            src={produit.image_url}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-contain p-0.5"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-cream">{produit.nom}</span>
                        <span className="block text-[0.7rem] font-light text-white/40">
                          {formatPrix(produit.prix, "DT")} · stock {produit.stock}
                          {!produit.actif && " · masqué"}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => basculer(produit.id)}
                        aria-label={`Retirer ${produit.nom} du coffret`}
                        className="h-7 w-7 shrink-0 rounded-full border border-red-400/30 text-xs text-red-300/80"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Chercher un produit à ajouter…"
                className={champSombre}
              />
              <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-xl border border-white/8 p-1">
                {proposes.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs font-light text-white/30">
                    Aucun produit ne correspond.
                  </li>
                ) : (
                  proposes.slice(0, 60).map((produit) => (
                    <li key={produit.id}>
                      <button
                        type="button"
                        onClick={() => basculer(produit.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.05]"
                      >
                        <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white">
                          {produit.image_url && (
                            <Image
                              src={produit.image_url}
                              alt=""
                              fill
                              sizes="32px"
                              className="object-contain p-0.5"
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-white/75">
                          {produit.nom}
                        </span>
                        <span className="shrink-0 text-[0.7rem] text-white/40 lining-nums">
                          {formatPrix(produit.prix, "DT")}
                        </span>
                        <span className="shrink-0 text-gold" aria-hidden="true">
                          +
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <label className="block text-sm">
              <span className={libelle}>Prix du coffret en dinars</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={Number.isFinite(form.prix) ? form.prix : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    prix: e.target.value === "" ? Number.NaN : Number(e.target.value),
                  })
                }
                placeholder={valeurSeparee > 0 ? String(valeurSeparee) : "120"}
                className={champSombre}
              />
              {valeurSeparee > 0 && (
                <span className="mt-1 block text-xs font-light text-white/35">
                  Achetés séparément : {formatPrix(valeurSeparee, "DT")}.
                  {prixValable && form.prix < valeurSeparee
                    ? ` La carte affiche ce total barré — économie de ${formatPrix(valeurSeparee - form.prix, "DT")}.`
                    : " Un prix plus bas s'affiche avec ce total barré."}
                </span>
              )}
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
              disabled={
                occupe ||
                form.nom.trim().length < 2 ||
                !prixValable ||
                (!form.image_url && form.produit_ids.length === 0)
              }
              onClick={() => lancer(() => enregistrerCoffret(form), () => setForm(null))}
              className={`${boutonOr} w-full`}
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>
            {!form.image_url && form.produit_ids.length === 0 && (
              <p className="-mt-3 text-center text-xs font-light text-white/35">
                Ajoutez une photo ou au moins un produit.
              </p>
            )}

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
