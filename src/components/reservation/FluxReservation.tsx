"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  MODE_DEMO,
  creneauxDuJour,
  joursProposes,
  prestationParId,
  prestationsDeCategorie,
  store,
  versCleDate,
} from "@/lib/reservation";
import type { CategorieId, Creneau, Prestation, Reservation } from "@/lib/reservation";
import { IconArrow } from "@/components/Icons";
import EtapeCoordonnees from "./EtapeCoordonnees";
import Confirmation from "./Confirmation";

const ETAPES = ["Prestation", "Date & heure", "Coordonnées"];

function formatJourCourt(date: Date) {
  return {
    jourSemaine: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
    jour: date.getDate(),
    mois: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
  };
}

export default function FluxReservation() {
  const [etape, setEtape] = useState(0);
  const [categorie, setCategorie] = useState<CategorieId>("coiffure");
  const [prestationId, setPrestationId] = useState<string | null>(null);
  const [dateCle, setDateCle] = useState<string | null>(null);
  const [heure, setHeure] = useState<string | null>(null);
  const [calcul, setCalcul] = useState<{
    cle: string;
    creneaux: Creneau[];
    /** Heures déjà réservées par la visiteuse ce jour-là. */
    miennes: string[];
  } | null>(null);
  const [confirmee, setConfirmee] = useState<Reservation | null>(null);

  // Ce composant n'est rendu que dans le navigateur (voir FluxReservationClient) :
  // « aujourd'hui » est donc toujours celui de la visiteuse.
  const jours = useMemo(() => joursProposes(), []);
  const prestation: Prestation | null = prestationId
    ? (prestationParId(prestationId) ?? null)
    : null;

  const cleCalcul = prestation && dateCle ? `${prestation.id}|${dateCle}` : null;

  useEffect(() => {
    if (!prestation || !dateCle) return;
    const cle = `${prestation.id}|${dateCle}`;
    let annule = false;
    Promise.all([store.reservationsDuJour(dateCle), store.mesReservations()]).then(
      ([reservations, miennes]) => {
        if (annule) return;
        setCalcul({
          cle,
          creneaux: creneauxDuJour({ prestation, dateCle, reservations }),
          miennes: miennes.filter((r) => r.date === dateCle).map((r) => r.heure),
        });
      },
    );
    return () => {
      annule = true;
    };
  }, [prestation, dateCle]);

  // Tant que le calcul en cours ne correspond pas à la sélection, on affiche l'attente.
  const aJour = calcul && calcul.cle === cleCalcul ? calcul : null;
  const creneaux = aJour?.creneaux ?? null;
  const miennes = aJour?.miennes ?? [];

  function choisirPrestation(id: string) {
    setPrestationId(id);
    setHeure(null);
    if (!dateCle && jours[0]) setDateCle(versCleDate(jours[0]));
    setEtape(1);
  }

  function choisirDate(cle: string) {
    setDateCle(cle);
    setHeure(null);
  }

  if (confirmee) {
    return (
      <Confirmation
        reservation={confirmee}
        onRecommencer={() => {
          setConfirmee(null);
          setPrestationId(null);
          setHeure(null);
          setEtape(0);
        }}
      />
    );
  }

  return (
    <div className="px-5 pb-16">
      <ol className="mb-7 flex items-center gap-2" aria-label="Étapes de la réservation">
        {ETAPES.map((nom, index) => {
          const atteinte = index <= etape;
          return (
            <li key={nom} className="flex flex-1 flex-col gap-1.5">
              <span
                className={`h-0.5 w-full rounded-full ${atteinte ? "bg-gold" : "bg-white/15"}`}
                aria-hidden="true"
              />
              <span
                className={`text-[0.65rem] tracking-wide ${atteinte ? "text-gold" : "text-white/40"}`}
                aria-current={index === etape ? "step" : undefined}
              >
                {nom}
              </span>
            </li>
          );
        })}
      </ol>

      {etape === 0 && (
        <section aria-labelledby="titre-prestation">
          <h2 id="titre-prestation" className="font-serif text-2xl font-light text-cream">
            Quelle prestation&nbsp;?
          </h2>

          <div className="mt-5 flex gap-2" role="tablist" aria-label="Catégories">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={categorie === c.id}
                onClick={() => setCategorie(c.id)}
                className={`flex-1 rounded-full border px-2 py-2.5 text-[0.78rem] transition-colors ${
                  categorie === c.id
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-white/15 text-white/60"
                }`}
              >
                {c.nom}
              </button>
            ))}
          </div>

          <ul className="mt-5 space-y-2.5">
            {prestationsDeCategorie(categorie).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => choisirPrestation(p.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left"
                >
                  <span>
                    <span className="block font-serif text-[1.05rem] text-cream">{p.nom}</span>
                    <span className="mt-0.5 block text-xs font-light text-white/45">
                      {p.dureeMinutes} min
                    </span>
                  </span>
                  <IconArrow className="h-4 w-4 shrink-0 text-gold" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {etape === 1 && prestation && (
        <section aria-labelledby="titre-creneau">
          <h2 id="titre-creneau" className="font-serif text-2xl font-light text-cream">
            Quand vous convient-il&nbsp;?
          </h2>
          <p className="mt-1.5 text-xs font-light text-white/50">
            {prestation.nom} · {prestation.dureeMinutes} min
          </p>

          <div className="-mx-5 mt-5 overflow-x-auto px-5">
            <div className="flex gap-2">
              {jours.map((jour) => {
                const cle = versCleDate(jour);
                const { jourSemaine, jour: numero, mois } = formatJourCourt(jour);
                const actif = cle === dateCle;
                return (
                  <button
                    key={cle}
                    type="button"
                    onClick={() => choisirDate(cle)}
                    aria-pressed={actif}
                    className={`w-[3.9rem] shrink-0 rounded-xl border py-2.5 text-center transition-colors ${
                      actif ? "border-gold bg-gold/15" : "border-white/12 bg-white/[0.03]"
                    }`}
                  >
                    <span className={`block text-[0.65rem] uppercase ${actif ? "text-gold" : "text-white/45"}`}>
                      {jourSemaine}
                    </span>
                    <span
                      className={`block font-serif text-lg lining-nums ${actif ? "text-gold" : "text-cream"}`}
                    >
                      {numero}
                    </span>
                    <span className={`block text-[0.6rem] ${actif ? "text-gold/80" : "text-white/35"}`}>
                      {mois}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6" aria-live="polite">
            {creneaux === null ? (
              <p className="py-8 text-center text-sm font-light text-white/40">
                Recherche des disponibilités…
              </p>
            ) : creneaux.every((c) => !c.disponible) ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-light text-white/55">
                Plus de créneau ce jour-là pour cette prestation.
                <br />
                Essayez une autre date.
              </p>
            ) : (
              <ul className="grid grid-cols-4 gap-2">
                {creneaux.map((creneau) => {
                  const dejaMienne = miennes.includes(creneau.heure);
                  return (
                    <li key={creneau.heure}>
                      <button
                        type="button"
                        disabled={!creneau.disponible || dejaMienne}
                        onClick={() => setHeure(creneau.heure)}
                        aria-pressed={heure === creneau.heure}
                        title={dejaMienne ? "Vous avez déjà un rendez-vous à cette heure" : undefined}
                        className={`w-full rounded-lg border py-2.5 text-sm transition-colors ${
                          dejaMienne
                            ? "cursor-not-allowed border-gold/40 bg-gold/10 text-gold/70"
                            : heure === creneau.heure
                              ? "border-gold bg-gold/20 text-gold"
                              : creneau.disponible
                                ? "border-white/12 bg-white/[0.03] text-cream"
                                : "cursor-not-allowed border-white/5 text-white/20 line-through"
                        }`}
                      >
                        {creneau.heure}
                        {dejaMienne && (
                          <span className="mt-0.5 block text-[0.55rem] leading-none">votre RDV</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={() => setEtape(0)}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={!heure}
              onClick={() => setEtape(2)}
              className="gold-gradient flex-1 rounded-full py-3 font-serif text-base text-noir disabled:opacity-35"
            >
              Continuer
            </button>
          </div>
        </section>
      )}

      {etape === 2 && prestation && dateCle && heure && (
        <EtapeCoordonnees
          prestation={prestation}
          dateCle={dateCle}
          heure={heure}
          onRetour={() => setEtape(1)}
          onConfirmee={setConfirmee}
        />
      )}

      {MODE_DEMO && (
        <p className="mt-10 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-center text-[0.7rem] font-light leading-relaxed text-white/40">
          Démonstration — les créneaux occupés sont simulés et les réservations
          restent sur cet appareil.
        </p>
      )}
    </div>
  );
}
