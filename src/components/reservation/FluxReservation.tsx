"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  confirmerReservation,
  creneauxDisponibles,
  type ReponseCreneaux,
} from "@/app/actions/reservation";
import { boutonFantome, boutonOr } from "@/components/ui/champs";
import { useEdition } from "@/components/edition/ContexteEdition";
import { IconArrow } from "@/components/Icons";
import { basculerPrestation, usePanier, viderPanier } from "@/lib/panier";
import { depuisCleDate, formatDuree, formatJourCourt, formatPrix } from "@/lib/format";
import type { Categorie, Prestation, Reservation } from "@/lib/supabase/types";
import Confirmation from "./Confirmation";
import EtapeCoordonnees from "./EtapeCoordonnees";
import FeuillePrestation from "./FeuillePrestation";

const ETAPES = ["Prestations", "Date & heure", "Coordonnées"];

type Props = {
  categories: Categorie[];
  prestations: Prestation[];
  /** Dates proposées, calculées à l'heure du salon par le serveur. */
  joursCles: string[];
  devise: string;
  telephoneSalon: string;
  reservationActive: boolean;
  categorieInitiale?: string;
};

export default function FluxReservation({
  categories,
  prestations,
  joursCles,
  devise,
  telephoneSalon,
  reservationActive,
  categorieInitiale,
}: Props) {
  const edition = useEdition();
  const panier = usePanier();

  const [etape, setEtape] = useState(0);
  const [categorie, setCategorie] = useState(
    categorieInitiale && categories.some((c) => c.id === categorieInitiale)
      ? categorieInitiale
      : (categories[0]?.id ?? ""),
  );
  const [dateCle, setDateCle] = useState<string | null>(null);
  const [heureMinutes, setHeureMinutes] = useState<number | null>(null);
  const [calcul, setCalcul] = useState<{ cle: string; reponse: ReponseCreneaux } | null>(null);
  const [confirmee, setConfirmee] = useState<Reservation | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoi, demarrerEnvoi] = useTransition();
  const [fiche, setFiche] = useState<Prestation | null | undefined>(undefined);

  const parId = useMemo(
    () => new Map(prestations.map((p) => [p.id, p])),
    [prestations],
  );

  // Le panier survit aux rechargements : une prestation retirée du catalogue
  // entre-temps ne doit pas bloquer le tunnel.
  const selection = useMemo(
    () => panier.filter((id) => parId.has(id)),
    [panier, parId],
  );
  const duree = selection.reduce((total, id) => total + (parId.get(id)?.duree_minutes ?? 0), 0);
  const prixConnu = selection.every((id) => parId.get(id)?.prix != null);
  const prixTotal = selection.reduce((total, id) => total + (parId.get(id)?.prix ?? 0), 0);

  const etapeCourante = selection.length === 0 ? 0 : etape;
  const cleCalcul = dateCle && selection.length > 0 ? `${selection.join(",")}|${dateCle}` : null;

  useEffect(() => {
    if (!cleCalcul || !dateCle) return;
    let annule = false;
    // Pas besoin d'effacer le calcul précédent : `aJour` ne retient que celui
    // dont la clé correspond à la sélection courante, les autres sont ignorés.
    creneauxDisponibles([...selection], dateCle).then((reponse) => {
      if (!annule) setCalcul({ cle: cleCalcul, reponse });
    });
    return () => {
      annule = true;
    };
  }, [cleCalcul, dateCle, selection]);

  // Tant que le calcul en cours ne correspond pas à la sélection, on attend.
  const aJour = calcul && calcul.cle === cleCalcul ? calcul.reponse : null;
  const creneaux = aJour?.ok ? aJour.creneaux : null;
  const messageCreneaux = aJour && !aJour.ok ? aJour.message : null;

  function allerAuxCreneaux() {
    setHeureMinutes(null);
    if (!dateCle && joursCles[0]) setDateCle(joursCles[0]);
    setEtape(1);
  }

  function valider(donnees: { nom: string; telephone: string; note: string }) {
    if (!dateCle || heureMinutes === null) return;
    setErreurEnvoi(null);
    demarrerEnvoi(async () => {
      const reponse = await confirmerReservation({
        prestationIds: [...selection],
        dateCle,
        heureMinutes,
        nom: donnees.nom,
        telephone: donnees.telephone,
        note: donnees.note || undefined,
      });
      if (!reponse.ok) {
        setErreurEnvoi(reponse.message);
        return;
      }
      viderPanier();
      setConfirmee(reponse.reservation);
    });
  }

  if (confirmee) {
    return (
      <Confirmation
        reservation={confirmee}
        telephoneSalon={telephoneSalon}
        onRecommencer={() => {
          setConfirmee(null);
          setHeureMinutes(null);
          setEtape(0);
        }}
      />
    );
  }

  if (!reservationActive) {
    return (
      <div className="px-5 pb-16">
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm font-light leading-relaxed text-white/60">
          La réservation en ligne est momentanément suspendue.
          <br />
          Appelez le salon au{" "}
          <a href={`tel:${telephoneSalon}`} className="text-gold">
            {telephoneSalon}
          </a>
          .
        </p>
      </div>
    );
  }

  const dePrestation = prestations.filter((p) => p.categorie_id === categorie);

  return (
    <div className="px-5 pb-16">
      <ol className="mb-7 flex items-center gap-2" aria-label="Étapes de la réservation">
        {ETAPES.map((nom, index) => {
          const atteinte = index <= etapeCourante;
          return (
            <li key={nom} className="flex flex-1 flex-col gap-1.5">
              <span
                className={`h-0.5 w-full rounded-full ${atteinte ? "bg-gold" : "bg-white/15"}`}
                aria-hidden="true"
              />
              <span
                className={`text-[0.65rem] tracking-wide ${atteinte ? "text-gold" : "text-white/40"}`}
                aria-current={index === etapeCourante ? "step" : undefined}
              >
                {nom}
              </span>
            </li>
          );
        })}
      </ol>

      {etapeCourante === 0 && (
        <section aria-labelledby="titre-prestation">
          <h2 id="titre-prestation" className="font-serif text-2xl font-light text-cream">
            Que souhaitez-vous&nbsp;?
          </h2>
          <p className="mt-1.5 text-xs font-light text-white/50">
            Ajoutez plusieurs prestations pour les enchaîner le même jour.
          </p>

          <div className="mt-5 flex gap-2" role="tablist" aria-label="Catégories">
            {categories.map((c) => (
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
            {dePrestation.map((p) => {
              const retenue = selection.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => basculerPrestation(p.id)}
                    aria-pressed={retenue}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      retenue ? "border-gold/60 bg-gold/10" : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <span>
                      <span
                        className={`block font-serif text-[1.05rem] ${retenue ? "text-gold" : "text-cream"}`}
                      >
                        {p.nom}
                      </span>
                      <span className="mt-0.5 block text-xs font-light text-white/45">
                        {formatDuree(p.duree_minutes)}
                        {p.prix != null && ` · ${formatPrix(p.prix, devise)}`}
                      </span>
                      {p.description && (
                        <span className="mt-1 block text-xs font-light leading-snug text-white/35">
                          {p.description}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
                        retenue ? "border-gold bg-gold text-noir" : "border-white/25 text-white/40"
                      }`}
                    >
                      {retenue ? "✓" : "+"}
                    </span>
                  </button>

                  {edition.actif && (
                    <button
                      type="button"
                      onClick={() => setFiche(p)}
                      className="mt-1 w-full rounded-lg border border-dashed border-gold/40 py-1.5 text-xs text-gold/80"
                    >
                      Modifier « {p.nom} »
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {edition.actif && (
            <button
              type="button"
              onClick={() => setFiche(null)}
              className="gold-gradient mt-4 w-full rounded-full py-3 font-serif text-base text-noir"
            >
              Ajouter une prestation
            </button>
          )}

          {dePrestation.length === 0 && !edition.actif && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-light text-white/50">
              Aucune prestation dans cette catégorie pour le moment.
            </p>
          )}

          {selection.length > 0 && (
            <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">Votre visite</p>
              <ul className="mt-3 space-y-2">
                {selection.map((id) => {
                  const p = parId.get(id);
                  if (!p) return null;
                  return (
                    <li key={id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-cream">{p.nom}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs font-light text-white/45">
                          {formatDuree(p.duree_minutes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => basculerPrestation(id)}
                          aria-label={`Retirer ${p.nom}`}
                          className="text-white/40"
                        >
                          ✕
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 border-t border-white/10 pt-3 text-sm text-white/70">
                Durée totale&nbsp;: <span className="text-gold">{formatDuree(duree)}</span>
                {prixConnu && prixTotal > 0 && (
                  <>
                    {" · "}
                    <span className="text-gold lining-nums">{formatPrix(prixTotal, devise)}</span>
                  </>
                )}
              </p>

              <button
                type="button"
                onClick={allerAuxCreneaux}
                className={`${boutonOr} mt-4 flex w-full items-center justify-center gap-3`}
              >
                Choisir un créneau
                <IconArrow className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {etapeCourante === 1 && (
        <section aria-labelledby="titre-creneau">
          <h2 id="titre-creneau" className="font-serif text-2xl font-light text-cream">
            Quand vous convient-il&nbsp;?
          </h2>
          <p className="mt-1.5 text-xs font-light text-white/50">
            {selection.length} prestation{selection.length > 1 ? "s" : ""} · {formatDuree(duree)}
          </p>

          <div className="-mx-5 mt-5 overflow-x-auto px-5">
            <div className="flex gap-2">
              {joursCles.map((cle) => {
                const { jourSemaine, jour, mois } = formatJourCourt(depuisCleDate(cle));
                const actif = cle === dateCle;
                return (
                  <button
                    key={cle}
                    type="button"
                    onClick={() => {
                      setDateCle(cle);
                      setHeureMinutes(null);
                    }}
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
                      {jour}
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
            {messageCreneaux ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-light text-white/55">
                {messageCreneaux}
              </p>
            ) : creneaux === null ? (
              <p className="py-8 text-center text-sm font-light text-white/40">
                Recherche des disponibilités…
              </p>
            ) : creneaux.every((c) => !c.disponible) ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-light text-white/55">
                Aucun créneau de {formatDuree(duree)} ce jour-là.
                <br />
                Essayez une autre date.
              </p>
            ) : (
              <ul className="grid grid-cols-4 gap-2">
                {creneaux.map((creneau) => (
                  <li key={creneau.minutes}>
                    <button
                      type="button"
                      disabled={!creneau.disponible}
                      onClick={() => setHeureMinutes(creneau.minutes)}
                      aria-pressed={heureMinutes === creneau.minutes}
                      className={`w-full rounded-lg border py-2.5 text-sm transition-colors ${
                        heureMinutes === creneau.minutes
                          ? "border-gold bg-gold/20 text-gold"
                          : creneau.disponible
                            ? "border-white/12 bg-white/[0.03] text-cream"
                            : "cursor-not-allowed border-white/5 text-white/20 line-through"
                      }`}
                    >
                      {creneau.heure}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-7 flex gap-3">
            <button type="button" onClick={() => setEtape(0)} className={boutonFantome}>
              Retour
            </button>
            <button
              type="button"
              disabled={heureMinutes === null}
              onClick={() => setEtape(2)}
              className={`${boutonOr} flex-1 disabled:opacity-35`}
            >
              Continuer
            </button>
          </div>
        </section>
      )}

      {etapeCourante === 2 && dateCle && heureMinutes !== null && (
        <EtapeCoordonnees
          prestationsNom={selection.map((id) => parId.get(id)?.nom ?? id)}
          dureeMinutes={duree}
          dateCle={dateCle}
          heure={
            creneaux?.find((c) => c.minutes === heureMinutes)?.heure ??
            `${String(Math.floor(heureMinutes / 60)).padStart(2, "0")}:${String(heureMinutes % 60).padStart(2, "0")}`
          }
          erreur={erreurEnvoi}
          envoi={envoi}
          onRetour={() => setEtape(1)}
          onValider={valider}
        />
      )}

      {fiche !== undefined && (
        <FeuillePrestation
          prestation={fiche}
          categories={categories}
          categorieParDefaut={categorie}
          onFermer={() => setFiche(undefined)}
        />
      )}
    </div>
  );
}
