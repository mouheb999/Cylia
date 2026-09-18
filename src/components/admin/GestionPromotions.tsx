"use client";

import { useState } from "react";
import FeuillePromotion from "@/components/admin/FeuillePromotion";
import { depuisCleDate, formatPrix } from "@/lib/format";
import { promotionsEnCours, remisePourcent } from "@/lib/promotions";
import { maintenantSalon } from "@/lib/temps-salon";
import type { Categorie, Prestation } from "@/lib/supabase/types";

/** Une ligne de la liste : le nom, ce qu'il faut en savoir, et les deux prix. */
function Ligne({
  prestation,
  categorie,
  note,
  devise,
  onOuvrir,
}: {
  prestation: Prestation;
  categorie: string;
  note: string;
  devise: string;
  onOuvrir: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOuvrir}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-serif text-[1.05rem] text-cream">
            {prestation.nom}
          </span>
          <span className="mt-0.5 block text-[0.7rem] font-light text-white/40">
            {categorie} · {note}
          </span>
        </span>
        <span className="shrink-0 text-right lining-nums">
          {prestation.prix_promo != null && (
            <span className="block text-sm text-gold">
              {formatPrix(prestation.prix_promo, devise)}
            </span>
          )}
          {prestation.prix != null && (
            <span className="block text-[0.7rem] font-light text-white/35 line-through">
              {formatPrix(prestation.prix, devise)}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** « 30/09 » — la date de fin, lue d'un coup d'œil dans une liste. */
function finCourte(date: string): string {
  return date.split("-").reverse().slice(0, 2).join("/");
}

/**
 * Les offres du salon, vues du panneau.
 *
 * Trois listes et pas une de plus : ce qui court, ce qui est écrit mais ne
 * s'affiche pas — offre terminée, prestation masquée — et le reste du
 * catalogue, où l'on va chercher la prochaine. La deuxième existe parce
 * qu'une remise qui a cessé de s'afficher sans qu'on l'ait retirée est
 * exactement le genre d'oubli qu'on ne voit jamais depuis le site.
 */
export default function GestionPromotions({
  prestations,
  categories,
  devise,
}: {
  prestations: Prestation[];
  categories: Categorie[];
  devise: string;
}) {
  // `undefined` : aucune feuille ouverte. `null` : feuille d'une nouvelle offre.
  const [feuille, setFeuille] = useState<Prestation | null | undefined>(undefined);

  const aujourdhui = maintenantSalon().dateCle;
  const nomCategorie = new Map(categories.map((c) => [c.id, c.nom]));

  const enCours = promotionsEnCours(prestations, aujourdhui);
  const affichees = new Set(enCours.map((p) => p.id));
  const dormantes = prestations.filter((p) => p.prix_promo != null && !affichees.has(p.id));
  const candidates = prestations.filter((p) => p.actif && p.prix != null && p.prix_promo == null);

  function raison(p: Prestation): string {
    if (!p.actif) return "prestation masquée";
    if (p.promo_fin && p.promo_fin < aujourdhui) {
      return `terminée le ${depuisCleDate(p.promo_fin).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      })}`;
    }
    if (p.prix == null) return "la prestation n'a plus de prix";
    return "tarif promo au-dessus du prix";
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setFeuille(null)}
        className="gold-gradient mt-5 w-full rounded-full py-3 font-serif text-base text-noir"
      >
        Ajouter une offre
      </button>

      <section className="mt-7">
        <h2 className="font-serif text-lg font-light text-gold">
          En cours{enCours.length > 0 && ` (${enCours.length})`}
        </h2>
        {enCours.length === 0 ? (
          <p className="mt-2 text-sm font-light leading-relaxed text-white/40">
            Aucune offre en cours — la section « Promotions » n&apos;apparaît pas
            du tout sur l&apos;accueil. Elle réapparaît dès qu&apos;une remise
            est posée ici.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {enCours.map((p) => (
              <Ligne
                key={p.id}
                prestation={p}
                categorie={nomCategorie.get(p.categorie_id) ?? p.categorie_id}
                note={`−${remisePourcent(p)}%${
                  p.promo_fin ? ` · jusqu'au ${finCourte(p.promo_fin)}` : ""
                }`}
                devise={devise}
                onOuvrir={() => setFeuille(p)}
              />
            ))}
          </ul>
        )}
      </section>

      {dormantes.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-lg font-light text-white/50">Écrites, mais invisibles</h2>
          <p className="mt-1 text-xs font-light leading-relaxed text-white/35">
            Ces remises existent encore en base et ne s&apos;affichent plus.
            Ouvrez-les pour les prolonger, ou les retirer.
          </p>
          <ul className="mt-3 space-y-2">
            {dormantes.map((p) => (
              <Ligne
                key={p.id}
                prestation={p}
                categorie={nomCategorie.get(p.categorie_id) ?? p.categorie_id}
                note={raison(p)}
                devise={devise}
                onOuvrir={() => setFeuille(p)}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-serif text-lg font-light text-white/50">
          Le reste du catalogue{candidates.length > 0 && ` (${candidates.length})`}
        </h2>
        {candidates.length === 0 ? (
          <p className="mt-2 text-sm font-light leading-relaxed text-white/40">
            Toutes les prestations qui ont un prix portent déjà une offre. Pour
            en remiser une autre, donnez-lui d&apos;abord un prix dans
            « Prestations ».
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {candidates.map((p) => (
              <Ligne
                key={p.id}
                prestation={p}
                categorie={nomCategorie.get(p.categorie_id) ?? p.categorie_id}
                note="sans offre"
                devise={devise}
                onOuvrir={() => setFeuille(p)}
              />
            ))}
          </ul>
        )}
      </section>

      {feuille !== undefined && (
        <FeuillePromotion
          prestation={feuille}
          candidates={candidates}
          devise={devise}
          onFermer={() => setFeuille(undefined)}
        />
      )}
    </div>
  );
}
