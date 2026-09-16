"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Feuille from "@/components/ui/Feuille";
import { boutonOr, champSombre } from "@/components/ui/champs";
import { definirPromotion, retirerPromotion } from "@/app/actions/admin";
import { formatPrix } from "@/lib/format";
import { maintenantSalon } from "@/lib/temps-salon";
import type { Prestation } from "@/lib/supabase/types";

/** Les remises qu'on pose sans réfléchir : un bouton, et le tarif est calculé. */
const RACCOURCIS = [10, 20, 30, 50];

/**
 * Poser — ou retirer — une remise sur une prestation.
 *
 * La remise se saisit en dinars, parce que c'est ce que la cliente lira ; les
 * boutons de pourcentage ne sont qu'un calcul rapide, pas un second mode de
 * stockage. Le pourcentage affiché sur le site est déduit des deux prix, et
 * reste donc toujours d'accord avec eux.
 */
export default function FeuillePromotion({
  prestation,
  candidates,
  devise,
  onFermer,
}: {
  /** `null` : nouvelle offre, la prestation reste à choisir. */
  prestation: Prestation | null;
  /** Prestations qui ont un prix — les seules sur lesquelles une remise a un sens. */
  candidates: Prestation[];
  devise: string;
  onFermer: () => void;
}) {
  const router = useRouter();
  const [id, setId] = useState(prestation?.id ?? candidates[0]?.id ?? "");
  const [tarif, setTarif] = useState(
    prestation?.prix_promo != null ? String(prestation.prix_promo) : "",
  );
  const [libelle, setLibelle] = useState(prestation?.promo_libelle ?? "");
  const [fin, setFin] = useState(prestation?.promo_fin ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const choisie = useMemo(
    () => candidates.find((p) => p.id === id) ?? prestation ?? null,
    [candidates, id, prestation],
  );
  const prix = choisie?.prix ?? null;
  const montant = Number(tarif.replace(",", "."));
  const valide = prix != null && Number.isFinite(montant) && montant >= 0 && montant < prix;
  const remise = valide && prix ? Math.round((1 - montant / prix) * 100) : null;

  function enregistrer() {
    if (!choisie) return setErreur("Choisissez une prestation.");
    if (prix == null) {
      return setErreur("Cette prestation n'a pas de prix : donnez-lui-en un d'abord.");
    }
    if (!valide) return setErreur("Le tarif promo doit être un montant inférieur au prix.");

    setErreur(null);
    demarrer(async () => {
      const reponse = await definirPromotion(choisie.id, {
        prix_promo: montant,
        promo_libelle: libelle,
        promo_fin: fin || null,
      });
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  function retirer() {
    if (!prestation) return;
    setErreur(null);
    demarrer(async () => {
      const reponse = await retirerPromotion(prestation.id);
      if (!reponse.ok) return setErreur(reponse.message);
      router.refresh();
      onFermer();
    });
  }

  return (
    <Feuille
      titre={prestation ? "Modifier l'offre" : "Nouvelle offre"}
      sousTitre="La prestation garde son prix ; l'offre pose un tarif plus bas par-dessus, et le site affiche les deux."
      onFermer={onFermer}
    >
      {prestation ? (
        <p className="font-serif text-xl font-light text-cream">{prestation.nom}</p>
      ) : candidates.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-light leading-relaxed text-white/50">
          Aucune prestation n&apos;a de prix affiché. Une remise se calcule à
          partir d&apos;un prix&nbsp;: renseignez-en un dans « Prestations », et
          l&apos;offre deviendra possible.
        </p>
      ) : (
        <label className="block text-sm">
          <span className="font-light text-white/60">Prestation</span>
          <select value={id} onChange={(e) => setId(e.target.value)} className={champSombre}>
            {candidates.map((p) => (
              <option key={p.id} value={p.id} className="bg-noir-soft">
                {p.nom} — {formatPrix(p.prix as number, devise)}
              </option>
            ))}
          </select>
        </label>
      )}

      {prix != null && (
        <>
          <p className="mt-4 text-sm font-light text-white/45">
            Prix affiché&nbsp;: <span className="text-cream">{formatPrix(prix, devise)}</span>
          </p>

          <label className="mt-4 block text-sm">
            <span className="font-light text-white/60">Tarif promo ({devise})</span>
            <input
              value={tarif}
              onChange={(e) => setTarif(e.target.value)}
              inputMode="decimal"
              placeholder={String(Math.round(prix * 0.8 * 100) / 100)}
              className={champSombre}
            />
          </label>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {RACCOURCIS.map((pourcent) => (
              <button
                key={pourcent}
                type="button"
                onClick={() => setTarif(String(Math.round(prix * (1 - pourcent / 100) * 100) / 100))}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60"
              >
                −{pourcent}%
              </button>
            ))}
          </div>

          {remise !== null && (
            <p className="mt-3 text-sm font-light text-gold">
              Sur le site&nbsp;: {formatPrix(montant, devise)} au lieu de{" "}
              {formatPrix(prix, devise)} — soit −{remise}%.
            </p>
          )}

          <label className="mt-4 block text-sm">
            <span className="font-light text-white/60">Ce que l&apos;offre annonce</span>
            <input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Offre de rentrée"
              className={champSombre}
            />
            <span className="mt-1 block text-xs font-light text-white/35">
              Facultatif. Sans phrase, la carte reprend la description de la
              prestation.
            </span>
          </label>

          <label className="mt-4 block text-sm">
            <span className="font-light text-white/60">Dernier jour de l&apos;offre</span>
            <input
              type="date"
              value={fin}
              min={maintenantSalon().dateCle}
              onChange={(e) => setFin(e.target.value)}
              className={champSombre}
            />
            <span className="mt-1 block text-xs font-light text-white/35">
              Facultatif. Ce jour-là, l&apos;offre vaut encore&nbsp;; le lendemain,
              elle disparaît du site toute seule.
            </span>
          </label>
        </>
      )}

      {erreur && <p className="mt-4 text-sm text-red-300">{erreur}</p>}

      {prix != null && (
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours}
          className={`${boutonOr} mt-6 w-full`}
        >
          {enCours ? "Enregistrement…" : "Enregistrer l'offre"}
        </button>
      )}

      {prestation && (
        <button
          type="button"
          onClick={retirer}
          disabled={enCours}
          className="mt-3 w-full py-2 text-sm font-light text-white/40"
        >
          Retirer cette offre
        </button>
      )}
    </Feuille>
  );
}
