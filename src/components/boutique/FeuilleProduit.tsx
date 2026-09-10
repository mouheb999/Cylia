"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { televerserImage } from "@/components/edition/televerser";
import { enregistrerProduit, supprimerProduit } from "@/app/actions/admin";
import type { Produit } from "@/lib/supabase/types";

export const CATEGORIES_PRODUIT = [
  { id: "visage", nom: "Soin du visage" },
  { id: "cheveux", nom: "Cheveux" },
  { id: "corps", nom: "Corps" },
  { id: "maquillage", nom: "Maquillage" },
  { id: "bien-etre", nom: "Bien-être" },
];

/** Champ vide → `null`, pour ne pas enregistrer 0 comme « pas de prix barré ». */
function nombreOuNull(valeur: string): number | null {
  const propre = valeur.trim().replace(",", ".");
  if (propre === "") return null;
  const nombre = Number(propre);
  return Number.isFinite(nombre) ? nombre : null;
}

export default function FeuilleProduit({
  produit,
  onFermer,
}: {
  /** `null` pour créer un produit. */
  produit: Produit | null;
  onFermer: () => void;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(produit?.nom ?? "");
  const [marque, setMarque] = useState(produit?.marque ?? "");
  const [description, setDescription] = useState(produit?.description ?? "");
  const [prix, setPrix] = useState(produit ? String(produit.prix) : "");
  const [ancienPrix, setAncienPrix] = useState(
    produit?.ancien_prix != null ? String(produit.ancien_prix) : "",
  );
  const [categorie, setCategorie] = useState(produit?.categorie ?? "visage");
  const [stock, setStock] = useState(produit ? String(produit.stock) : "10");
  const [actif, setActif] = useState(produit?.actif ?? true);
  const [imageUrl, setImageUrl] = useState(produit?.image_url ?? null);

  const [erreur, setErreur] = useState<string | null>(null);
  const [depot, setDepot] = useState(false);
  const [enCours, demarrer] = useTransition();

  async function deposer(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    setDepot(true);
    try {
      setImageUrl(await televerserImage(fichier, "produits"));
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : "Dépôt impossible.");
    } finally {
      setDepot(false);
    }
  }

  function enregistrer() {
    const montant = nombreOuNull(prix);
    if (nom.trim().length < 2) return setErreur("Donnez un nom au produit.");
    if (montant === null || montant < 0) return setErreur("Indiquez un prix.");

    setErreur(null);
    demarrer(async () => {
      const reponse = await enregistrerProduit({
        id: produit?.id,
        nom,
        marque,
        description,
        prix: montant,
        ancien_prix: nombreOuNull(ancienPrix),
        image_url: imageUrl,
        categorie,
        stock: Number(nombreOuNull(stock) ?? 0),
        ordre: produit?.ordre ?? 999,
        actif,
      });
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  function retirer() {
    if (!produit) return;
    setErreur(null);
    demarrer(async () => {
      const reponse = await supprimerProduit(produit.id);
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  const occupe = enCours || depot;

  return (
    <Feuille
      titre={produit ? "Modifier le produit" : "Nouveau produit"}
      sousTitre="Les prix sont en dinars. Le stock diminue à chaque commande."
      onFermer={onFermer}
    >
      <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-2xl border border-white/10 bg-noir">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="128px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-script text-4xl text-gold/60">
            {nom.trim().charAt(0) || "?"}
          </span>
        )}
      </div>

      <label className="mx-auto mt-3 block w-fit cursor-pointer rounded-full border border-gold/35 px-4 py-2 text-xs text-gold">
        {depot ? "Envoi…" : imageUrl ? "Changer la photo" : "Ajouter une photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={occupe}
          onChange={(e) => deposer(e.target.files?.[0])}
        />
      </label>

      <label className="mt-5 block text-sm">
        <span className="font-light text-white/60">Nom</span>
        <input value={nom} onChange={(e) => setNom(e.target.value)} className={champSombre} />
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-light text-white/60">Marque (facultatif)</span>
        <input value={marque} onChange={(e) => setMarque(e.target.value)} className={champSombre} />
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-light text-white/60">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${champSombre} resize-none`}
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-light text-white/60">Prix</span>
          <input
            inputMode="decimal"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="89"
            className={champSombre}
          />
        </label>
        <label className="block text-sm">
          <span className="font-light text-white/60">Prix barré</span>
          <input
            inputMode="decimal"
            value={ancienPrix}
            onChange={(e) => setAncienPrix(e.target.value)}
            placeholder="—"
            className={champSombre}
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-light text-white/60">Stock</span>
          <input
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={champSombre}
          />
        </label>
        <label className="block text-sm">
          <span className="font-light text-white/60">Rayon</span>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className={champSombre}
          >
            {CATEGORIES_PRODUIT.map((c) => (
              <option key={c.id} value={c.id} className="bg-noir-soft">
                {c.nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex items-center gap-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="h-5 w-5 accent-[#d5b17c]"
        />
        Visible dans la boutique
      </label>

      {erreur && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <button type="button" disabled={occupe} onClick={enregistrer} className={boutonOr}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        {produit && (
          <button
            type="button"
            disabled={occupe}
            onClick={retirer}
            className="rounded-full border border-red-400/30 py-3 text-sm font-light text-red-300"
          >
            Retirer de la boutique
          </button>
        )}
      </div>
    </Feuille>
  );
}
