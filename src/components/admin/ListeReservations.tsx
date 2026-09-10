"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changerStatutReservation } from "@/app/actions/admin";
import { formatDateLongue, formatDuree, formatPrix, minutesVersHeure } from "@/lib/format";
import type { Reservation, StatutReservation } from "@/lib/supabase/types";

const LIBELLES: Record<StatutReservation, string> = {
  en_attente: "À confirmer",
  confirmee: "Confirmé",
  terminee: "Terminé",
  annulee: "Annulé",
};

const COULEURS: Record<StatutReservation, string> = {
  en_attente: "border-gold/40 text-gold",
  confirmee: "border-emerald-400/40 text-emerald-300",
  terminee: "border-white/20 text-white/50",
  annulee: "border-red-400/30 text-red-300",
};

/** Ce que le salon peut faire ensuite, selon l'état du rendez-vous. */
const SUITES: Record<StatutReservation, StatutReservation[]> = {
  en_attente: ["confirmee", "annulee"],
  confirmee: ["terminee", "annulee"],
  terminee: ["confirmee"],
  annulee: ["en_attente"],
};

export default function ListeReservations({
  reservations,
  devise,
}: {
  reservations: Reservation[];
  devise: string;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function changer(id: string, statut: StatutReservation) {
    setErreur(null);
    demarrer(async () => {
      const reponse = await changerStatutReservation(id, statut);
      if (!reponse.ok) setErreur(reponse.message);
      else router.refresh();
    });
  }

  if (reservations.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm font-light text-white/45">
        Aucun rendez-vous dans cette vue.
      </p>
    );
  }

  // Regroupé par jour : c'est ainsi qu'on lit un planning.
  const parJour = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const liste = parJour.get(r.date) ?? [];
    liste.push(r);
    parJour.set(r.date, liste);
  }

  return (
    <div className="mt-5">
      {erreur && (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur}
        </p>
      )}

      {[...parJour.entries()].map(([date, duJour]) => (
        <section key={date} className="mb-7">
          <h2 className="font-serif text-lg font-light capitalize text-gold">
            {formatDateLongue(date)}
          </h2>

          <ul className="mt-3 space-y-3">
            {duJour.map((r) => (
              <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg text-cream lining-nums">
                      {minutesVersHeure(r.heure_minutes)}
                      <span className="ml-2 text-xs font-light text-white/40">
                        {formatDuree(r.duree_minutes)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-cream">{r.nom}</p>
                    <a href={`tel:${r.telephone}`} className="text-sm text-gold lining-nums">
                      {r.telephone}
                    </a>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] ${COULEURS[r.statut]}`}
                  >
                    {LIBELLES[r.statut]}
                  </span>
                </div>

                <p className="mt-2 text-xs font-light leading-relaxed text-white/50">
                  {r.prestations_nom.join(" · ")}
                  {r.prix_total != null && ` — ${formatPrix(r.prix_total, devise)}`}
                </p>

                {r.note && (
                  <p className="mt-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs font-light leading-relaxed text-white/55">
                    « {r.note} »
                  </p>
                )}

                <p className="mt-2 text-[0.65rem] font-light text-white/30 lining-nums">
                  Réf. {r.reference}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SUITES[r.statut].map((suite) => (
                    <button
                      key={suite}
                      type="button"
                      disabled={enCours}
                      onClick={() => changer(r.id, suite)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs disabled:opacity-40 ${
                        suite === "annulee"
                          ? "border-red-400/30 text-red-300"
                          : "border-gold/35 text-gold"
                      }`}
                    >
                      {suite === "annulee"
                        ? "Annuler"
                        : suite === "confirmee"
                          ? "Confirmer"
                          : suite === "terminee"
                            ? "Marquer terminé"
                            : "Rouvrir"}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
