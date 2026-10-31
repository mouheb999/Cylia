"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  confirmerReservation,
  creneauxDisponibles,
  joursDisponibles,
  type ReponseCreneaux,
  type ReponseJours,
} from "@/app/actions/reservation";
import { boutonFantome, boutonOr } from "@/components/ui/champs";
import { useEdition } from "@/components/edition/ContexteEdition";
import { IconArrow } from "@/components/Icons";
import { basculerPrestation, remplacerPanier, usePanier, viderPanier } from "@/lib/panier";
import {
  depuisCleDate,
  formatDateLongue,
  formatDuree,
  formatJourCourt,
  formatPrix,
} from "@/lib/format";
import { trackMeta, type ArticleMeta } from "@/lib/meta/track";
import { enPromo, remisePourcent, tarifDuJour } from "@/lib/promotions";
import { track } from "@/lib/fbq";
import VisuelPrestation from "./VisuelPrestation";
import DiaporamaGroupe, { photosDuGroupe } from "./DiaporamaGroupe";
import type { Categorie, Groupe, Prestation, Reservation } from "@/lib/supabase/types";
import Confirmation from "./Confirmation";
import EtapeCoordonnees from "./EtapeCoordonnees";
import FeuillePrestation from "./FeuillePrestation";

const ETAPES = ["Prestations", "Date & heure", "Coordonnées"];

type Props = {
  categories: Categorie[];
  groupes: Groupe[];
  prestations: Prestation[];
  /** Dates proposées, calculées à l'heure du salon par le serveur. */
  joursCles: string[];
  devise: string;
  telephoneSalon: string;
  reservationActive: boolean;
  categorieInitiale?: string;
  /**
   * Prestations arrivées par l'adresse — `?prestation=a,b` : une offre de
   * l'accueil, une publicité, la fiche d'un pack. Déjà filtrées par la page.
   */
  prestationsInitiales?: string[];
  /** Pack arrivé par l'adresse : ses prestations, et le prix du pack. */
  packInitial?: { slug: string; nom: string; prix: number | null; prestationIds: string[] };
};

/** Le plus bas des tarifs du jour d'une liste — `null` si aucune n'a de prix. */
function prixMinimum(liste: Prestation[], aujourdhui: string): number | null {
  const prix = liste
    .map((p) => tarifDuJour(p, aujourdhui))
    .filter((x): x is number => x != null);
  return prix.length > 0 ? Math.min(...prix) : null;
}

/** Une prestation telle que Meta la voit : son identifiant, son tarif du jour. */
function versMeta(p: Prestation, aujourdhui: string): ArticleMeta {
  return { id: p.id, name: p.nom, priceTnd: tarifDuJour(p, aujourdhui) ?? 0 };
}

export default function FluxReservation({
  categories,
  groupes,
  prestations,
  joursCles,
  devise,
  telephoneSalon,
  reservationActive,
  categorieInitiale,
  prestationsInitiales = [],
  packInitial,
}: Props) {
  const edition = useEdition();
  const panier = usePanier();

  /*
   * Une offre, une publicité ou un pack arrive ici par l'adresse.
   *
   * L'adresse décide de trois choses d'un coup : la catégorie affichée, le
   * groupe ouvert, et les prestations retenues. Les deux premières sont l'état
   * de départ du tunnel — pas une correction faite après coup, qui ferait
   * clignoter l'écran ; la troisième va dans le panier, qui vit hors de React,
   * d'où l'effet plus bas.
   */
  const idsDemandes = packInitial?.prestationIds ?? prestationsInitiales;
  const demandee = idsDemandes.length > 0
    ? prestations.find((p) => p.id === idsDemandes[0])
    : undefined;

  const [etape, setEtape] = useState(0);
  const [categorie, setCategorie] = useState(() => {
    const voulue = demandee?.categorie_id ?? categorieInitiale;
    return voulue && categories.some((c) => c.id === voulue)
      ? voulue
      : (categories[0]?.id ?? "");
  });
  const [dateCle, setDateCle] = useState<string | null>(null);
  const [heureMinutes, setHeureMinutes] = useState<number | null>(null);
  const [calcul, setCalcul] = useState<{ cle: string; reponse: ReponseCreneaux } | null>(null);
  const [confirmee, setConfirmee] = useState<Reservation | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoi, demarrerEnvoi] = useTransition();
  const [fiche, setFiche] = useState<Prestation | null | undefined>(undefined);
  /** `null` : on voit les groupes de la catégorie. Sinon, on est entré dedans. */
  const [groupeOuvert, setGroupeOuvert] = useState<string | null>(demandee?.groupe_id ?? null);
  /** Les prestations arrivées par l'adresse, mises en évidence un instant. */
  const [surbrillance, setSurbrillance] = useState<readonly string[]>(idsDemandes);
  /** Disponibilités jour par jour, pour la sélection en cours. */
  const [jours, setJours] = useState<{ cle: string; reponse: ReponseJours } | null>(null);

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

  /*
   * « Aujourd'hui » vient du serveur, jamais de l'horloge du navigateur : c'est
   * déjà le premier des jours proposés. Une offre qui s'arrête ce soir doit
   * s'éteindre au même instant des deux côtés, sinon le site annoncerait un
   * tarif que la base refuserait d'appliquer.
   */
  const aujourdhui = joursCles[0];

  const prixConnu = selection.every((id) => {
    const p = parId.get(id);
    return p != null && tarifDuJour(p, aujourdhui) != null;
  });
  const prixTotal = selection.reduce((total, id) => {
    const p = parId.get(id);
    return total + (p ? (tarifDuJour(p, aujourdhui) ?? 0) : 0);
  }, 0);
  // Le total d'avant remise ne s'affiche que s'il diffère : sinon, c'est deux
  // fois le même chiffre, dont un barré.
  const prixPlein = selection.reduce((total, id) => total + (parId.get(id)?.prix ?? 0), 0);
  // Une seule prestation au tarif de départ suffit à rendre le total
  // approximatif : il s'annonce alors lui aussi « à partir de ».
  const totalDepart = selection.some((id) => parId.get(id)?.prix_a_partir_de);

  /*
   * Les prestations demandées *remplacent* le panier — celui du navigateur,
   * qui survit aux rechargements. Une sélection oubliée là il y a trois jours
   * ne s'ajoute pas en douce à ce que la publicité a proposé.
   *
   * Une seule fois : sans ce garde, retirer une prestation la remettrait
   * aussitôt, et le bouton paraîtrait cassé. Le dépôt compte comme un ajout
   * pour Meta : c'est le geste « Réserver » de la publicité ou du pack.
   */
  const deposee = useRef(false);
  const cleDemandes = idsDemandes.join(",");
  useEffect(() => {
    if (deposee.current || !cleDemandes) return;
    deposee.current = true;
    const ids = cleDemandes.split(",");
    remplacerPanier(ids);
    const deposees = ids
      .map((id) => prestations.find((p) => p.id === id))
      .filter((p): p is Prestation => p !== undefined);
    if (deposees.length > 0) {
      trackMeta("AddToCart", deposees.map((p) => versMeta(p, aujourdhui)), {
        valeurTnd: packInitial?.prix ?? undefined,
        categorie: "reservation",
      });
    }
  }, [cleDemandes, prestations, aujourdhui, packInitial?.prix]);

  /*
   * La prestation arrivée par l'adresse est amenée à l'écran et soulignée
   * d'or quelques secondes : la cliente voit d'un coup d'œil ce qui est retenu.
   */
  useEffect(() => {
    if (surbrillance.length === 0) return;
    document
      .getElementById(`prestation-${surbrillance[0]}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const minuteur = window.setTimeout(() => setSurbrillance([]), 4000);
    return () => window.clearTimeout(minuteur);
  }, [surbrillance]);

  /*
   * Un groupe ouvert est une fiche vue : Meta reçoit ses prestations, et le
   * plus bas de leurs prix — celui que la carte annonce « à partir de ».
   */
  const groupeVu = useRef<string | null>(null);
  useEffect(() => {
    if (!groupeOuvert || groupeVu.current === groupeOuvert) return;
    groupeVu.current = groupeOuvert;
    const contenu = prestations.filter((p) => p.groupe_id === groupeOuvert);
    if (contenu.length === 0) return;
    trackMeta("ViewContent", contenu.map((p) => versMeta(p, aujourdhui)), {
      valeurTnd: prixMinimum(contenu, aujourdhui) ?? 0,
      categorie: "reservation",
    });
  }, [groupeOuvert, prestations, aujourdhui]);

  /** Retenir ou retirer une prestation ; seul l'ajout compte pour Meta. */
  function basculer(p: Prestation) {
    const ajout = !selection.includes(p.id);
    basculerPrestation(p.id);
    if (ajout) {
      trackMeta("AddToCart", [versMeta(p, aujourdhui)], { categorie: "reservation" });
    }
  }

  /*
   * Le pack tient tant que toutes ses prestations sont dans le panier : son
   * prix s'affiche alors à la place de leur somme, et son nom part au salon
   * avec le rendez-vous. En retirer une, c'est revenir aux prix à l'unité.
   */
  const packComplet =
    packInitial && packInitial.prestationIds.every((id) => selection.includes(id))
      ? packInitial
      : null;

  const etapeCourante = selection.length === 0 ? 0 : etape;
  const cleSelection = selection.join(",");

  /*
   * Les jours où la visite tient encore, lus en une fois à l'entrée de l'étape
   * — et relus à chaque retour, l'agenda du salon ayant pu bouger.
   */
  useEffect(() => {
    if (etapeCourante !== 1 || !cleSelection) return;
    let annule = false;
    joursDisponibles(cleSelection.split(",")).then((reponse) => {
      if (!annule) setJours({ cle: cleSelection, reponse });
    });
    return () => {
      annule = true;
    };
  }, [etapeCourante, cleSelection]);

  const joursAJour = jours && jours.cle === cleSelection ? jours.reponse : null;
  // Sans réponse exploitable, aucun jour n'est grisé : mieux vaut laisser
  // essayer que de tout fermer sur une panne.
  const disponibles: Map<string, boolean> | null = joursAJour
    ? joursAJour.ok
      ? new Map(joursAJour.jours.map((j) => [j.cle, j.disponible]))
      : new Map(joursCles.map((cle) => [cle, true]))
    : null;
  const premierJourLibre = disponibles
    ? (joursCles.find((cle) => disponibles.get(cle)) ?? null)
    : null;
  /*
   * Le jour affiché : celui que la cliente a touché s'il a encore de la place,
   * sinon le premier jour qui en a. Jamais un jour vide — le calendrier ne
   * s'ouvre plus sur « Aucun créneau ».
   */
  const dateEffective =
    disponibles === null
      ? null
      : dateCle && disponibles.get(dateCle)
        ? dateCle
        : premierJourLibre;

  const cleCalcul =
    dateEffective && selection.length > 0 ? `${cleSelection}|${dateEffective}` : null;

  useEffect(() => {
    if (!cleCalcul || !dateEffective) return;
    let annule = false;
    // Pas besoin d'effacer le calcul précédent : `aJour` ne retient que celui
    // dont la clé correspond à la sélection courante, les autres sont ignorés.
    creneauxDisponibles([...selection], dateEffective).then((reponse) => {
      if (!annule) setCalcul({ cle: cleCalcul, reponse });
    });
    return () => {
      annule = true;
    };
  }, [cleCalcul, dateEffective, selection]);

  // Tant que le calcul en cours ne correspond pas à la sélection, on attend.
  const aJour = calcul && calcul.cle === cleCalcul ? calcul.reponse : null;
  const creneaux = aJour?.ok ? aJour.creneaux : null;
  const messageCreneaux = aJour && !aJour.ok ? aJour.message : null;

  function allerAuxCreneaux() {
    setHeureMinutes(null);
    setEtape(1);
  }

  /** Ce que vaut la visite : le prix du pack s'il est complet, sinon le total. */
  const valeurVisite = packComplet?.prix ?? prixTotal;
  const articlesVisite = selection.flatMap((id) => {
    const p = parId.get(id);
    return p ? [versMeta(p, aujourdhui)] : [];
  });

  /*
   * Le jour ouvert est ramené dans la rangée — le premier jour libre peut être
   * le dixième, hors de l'écran. Seule la rangée défile, jamais la page.
   */
  const rangeeJours = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rangee = rangeeJours.current;
    const bouton = rangee?.querySelector<HTMLElement>(`[data-jour="${dateEffective}"]`);
    if (!rangee || !bouton) return;
    const marge = 20;
    if (bouton.offsetLeft + bouton.offsetWidth > rangee.scrollLeft + rangee.clientWidth - marge) {
      rangee.scrollLeft = bouton.offsetLeft - marge;
    } else if (bouton.offsetLeft < rangee.scrollLeft + marge) {
      rangee.scrollLeft = Math.max(0, bouton.offsetLeft - marge);
    }
  }, [dateEffective, etapeCourante]);

  /*
   * Mise en caisse : une fois, quand la cliente a choisi son créneau et passe
   * aux coordonnées — c'est là qu'elle décide de réserver.
   */
  const caisseSignalee = useRef(false);
  function continuer() {
    if (!caisseSignalee.current) {
      caisseSignalee.current = true;
      trackMeta("InitiateCheckout", articlesVisite, {
        valeurTnd: valeurVisite,
        categorie: "reservation",
      });
    }
    setEtape(2);
  }

  function valider(donnees: { nom: string; telephone: string; note: string }) {
    if (!dateEffective || heureMinutes === null) return;
    const dateChoisie = dateEffective;
    setErreurEnvoi(null);
    demarrerEnvoi(async () => {
      const reponse = await confirmerReservation({
        prestationIds: [...selection],
        dateCle: dateChoisie,
        heureMinutes,
        nom: donnees.nom,
        telephone: donnees.telephone,
        note:
          [
            packComplet &&
              `Pack ${packComplet.nom}${
                packComplet.prix !== null ? ` — ${formatPrix(packComplet.prix, devise)}` : ""
              }`,
            donnees.note,
          ]
            .filter(Boolean)
            .join("\n") || undefined,
        packSlug: packComplet ? packInitial?.slug : undefined,
      });
      if (!reponse.ok) {
        setErreurEnvoi(reponse.message);
        return;
      }
      viderPanier();
      // Le rendez-vous est écrit : `Schedule`, avec l'`eventID` et les montants
      // que le serveur vient d'envoyer à l'API Conversions — Meta n'en garde
      // qu'un. Aucune donnée personnelle ne part du navigateur.
      trackMeta("Schedule", reponse.meta.articles, {
        eventId: reponse.meta.eventId,
        valeurTnd: reponse.meta.valeurTnd,
        categorie: "reservation",
      });
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
          <a
            href={`tel:${telephoneSalon}`}
            onClick={() => track("Contact", { method: "phone" })}
            className="text-gold"
          >
            {telephoneSalon}
          </a>
          .
        </p>
      </div>
    );
  }

  const dePrestation = prestations.filter((p) => p.categorie_id === categorie);
  const groupesCategorie = groupes
    .filter((g) => g.categorie_id === categorie)
    .map((g) => ({ groupe: g, contenu: dePrestation.filter((p) => p.groupe_id === g.id) }))
    .filter((g) => g.contenu.length > 0);
  // Une prestation sans groupe — ou dont le groupe a été supprimé — reste
  // visible sous les vignettes plutôt que de disparaître du catalogue.
  const horsGroupe = dePrestation.filter(
    (p) => !groupesCategorie.some((g) => g.groupe.id === p.groupe_id),
  );
  const ouvert = groupesCategorie.find((g) => g.groupe.id === groupeOuvert) ?? null;
  const aMontrer = ouvert ? ouvert.contenu : horsGroupe;

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
                onClick={() => {
                  setCategorie(c.id);
                  setGroupeOuvert(null);
                }}
                className={`press flex-1 rounded-full border px-2 py-2.5 text-[0.78rem] ${
                  categorie === c.id
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-white/15 text-white/60"
                }`}
              >
                {c.nom}
              </button>
            ))}
          </div>

          {ouvert ? (
            <>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGroupeOuvert(null)}
                  className="press shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60"
                >
                  ← Retour
                </button>
                <h3 className="min-w-0 flex-1 truncate font-serif text-lg text-gold">
                  {ouvert.groupe.nom}
                </h3>
              </div>
              <DiaporamaGroupe groupe={ouvert.groupe} />
            </>
          ) : (
            groupesCategorie.length > 0 && (
              <ul className="mt-5 space-y-3">
                {groupesCategorie.map(({ groupe, contenu }) => {
                  const retenues = contenu.filter((p) => selection.includes(p.id)).length;
                  const depart = prixMinimum(contenu, aujourdhui);
                  return (
                    <li key={groupe.id}>
                      <button
                        type="button"
                        onClick={() => setGroupeOuvert(groupe.id)}
                        className={`press block w-full overflow-hidden rounded-2xl border text-left ${
                          retenues > 0 ? "border-gold/60 bg-gold/10" : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <span className="relative block aspect-[21/9] w-full">
                          <VisuelPrestation
                            nom={groupe.nom}
                            categorieId={groupe.categorie_id}
                            url={photosDuGroupe(groupe)[0] ?? null}
                            sizes="(max-width: 640px) 100vw, 640px"
                            className="h-full w-full rounded-none"
                            tailleIcone="h-12 w-12"
                          />
                          {/* Le nom se lit sur la photo : un voile sombre part du
                              bas pour qu'il tienne sur une image claire comme
                              sur une image foncée. */}
                          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir/85 via-noir/45 to-transparent px-4 pb-3 pt-8">
                            <span className="block font-serif text-xl leading-tight text-cream">
                              {groupe.nom}
                            </span>
                            {groupe.description && (
                              <span className="mt-0.5 block truncate text-[0.72rem] font-light text-white/55">
                                {groupe.description}
                              </span>
                            )}
                          </span>
                          {retenues > 0 && (
                            <span className="gold-gradient absolute right-3 top-3 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[0.7rem] font-medium text-noir">
                              {retenues}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <span className="text-[0.72rem] font-light text-gold/75">
                            {contenu.length} soin{contenu.length > 1 ? "s" : ""}
                            {/* Le prix se voit avant d'entrer dans le groupe. */}
                            {depart !== null && (
                              <>
                                {" · "}
                                <span className="text-white/55">à partir de </span>
                                <span className="font-serif text-[0.95rem] font-semibold text-gold lining-nums">
                                  {formatPrix(depart, devise)}
                                </span>
                              </>
                            )}
                          </span>
                          <span className="shrink-0 text-[0.72rem] font-light text-white/40">
                            Voir →
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          )}

          <ul className="mt-5 space-y-2.5">
            {aMontrer.map((p) => {
              const retenue = selection.includes(p.id);
              const soulignee = surbrillance.includes(p.id);
              // L'offre est prise de la prestation elle-même, pas d'une liste
              // à part : la carte du tunnel dit donc toujours la même chose
              // que celle de l'accueil.
              const offre = enPromo(p, aujourdhui) ? p : null;
              return (
                <li key={p.id} id={`prestation-${p.id}`} className="scroll-mt-24">
                  <button
                    type="button"
                    onClick={() => basculer(p)}
                    aria-pressed={retenue}
                    className={`press flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-shadow duration-500 ${
                      retenue ? "border-gold/60 bg-gold/10" : "border-white/10 bg-white/[0.03]"
                    } ${soulignee ? "ring-2 ring-gold ring-offset-2 ring-offset-noir" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block font-serif text-[1.05rem] ${retenue ? "text-gold" : "text-cream"}`}
                      >
                        {p.nom}
                      </span>
                      {/* Durée et prix sur une ligne — « 45 min · 40 DT » : les
                          deux questions qu'on se pose avant de toucher le « + ». */}
                      <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-xs font-light text-white/50">
                        <span className="lining-nums">{formatDuree(p.duree_minutes)}</span>
                        {p.prix != null && (
                          <>
                            <span aria-hidden="true">·</span>
                            {p.prix_a_partir_de && <span>à partir de</span>}
                            <span className="font-serif text-base font-semibold leading-none text-gold lining-nums">
                              {formatPrix(offre ? offre.prix_promo : p.prix, devise)}
                            </span>
                            {offre && (
                              <>
                                <span className="text-[0.7rem] text-white/35 line-through lining-nums">
                                  {formatPrix(offre.prix, devise)}
                                </span>
                                <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[0.6rem] text-gold">
                                  −{remisePourcent(offre)}%
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </span>
                      {p.description && (
                        <span className="mt-1 block text-xs font-light leading-snug text-white/35">
                          {p.description}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
                          retenue ? "border-gold bg-gold text-noir" : "border-white/25 text-white/40"
                        }`}
                      >
                        {retenue ? "✓" : "+"}
                      </span>
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
                  const tarif = tarifDuJour(p, aujourdhui);
                  return (
                    <li key={id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-cream">{p.nom}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs font-light text-white/45">
                          {formatDuree(p.duree_minutes)}
                        </span>
                        {tarif != null && (
                          <span className="flex items-baseline gap-1">
                            {p.prix_a_partir_de && (
                              <span className="text-[0.7rem] font-light text-white/40">dès</span>
                            )}
                            <span className="font-serif text-base font-semibold text-gold lining-nums">
                              {formatPrix(tarif, devise)}
                            </span>
                          </span>
                        )}
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
              </p>
              {packComplet && (
                <p className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-white/70">{packComplet.nom}</span>
                  <span className="flex items-baseline gap-2">
                    {packComplet.prix !== null && prixConnu && prixPlein > packComplet.prix && (
                      <span className="text-xs font-light text-white/30 line-through lining-nums">
                        {formatPrix(prixPlein, devise)}
                      </span>
                    )}
                    <span className="font-serif text-2xl font-semibold leading-none text-gold lining-nums">
                      {packComplet.prix === null ? "Sur devis" : formatPrix(packComplet.prix, devise)}
                    </span>
                  </span>
                </p>
              )}
              {!packComplet && prixConnu && prixTotal > 0 && (
                <p className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-white/70">
                    Total{totalDepart ? " à partir de" : ""}
                  </span>
                  <span className="flex items-baseline gap-2">
                    {prixPlein > prixTotal && (
                      <span className="text-xs font-light text-white/30 line-through lining-nums">
                        {formatPrix(prixPlein, devise)}
                      </span>
                    )}
                    <span className="font-serif text-2xl font-semibold leading-none text-gold lining-nums">
                      {formatPrix(prixTotal, devise)}
                    </span>
                  </span>
                </p>
              )}

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

          <div ref={rangeeJours} className="relative -mx-5 mt-5 overflow-x-auto px-5">
            <div className="flex gap-2">
              {joursCles.map((cle) => {
                const { jourSemaine, jour, mois } = formatJourCourt(depuisCleDate(cle));
                const actif = cle === dateEffective;
                // Grisé et inactif quand la visite n'y tient plus. Tant que les
                // disponibilités se lisent, rien n'est grisé ni touchable.
                const complet = disponibles !== null && !disponibles.get(cle);
                return (
                  <button
                    key={cle}
                    type="button"
                    data-jour={cle}
                    disabled={disponibles === null || complet}
                    onClick={() => {
                      setDateCle(cle);
                      setHeureMinutes(null);
                    }}
                    aria-pressed={actif}
                    aria-label={`${formatDateLongue(cle)}${complet ? ", complet" : ""}`}
                    className={`press w-[3.9rem] shrink-0 rounded-xl border py-2.5 text-center ${
                      actif
                        ? "border-gold bg-gold/15"
                        : complet
                          ? "cursor-not-allowed border-white/5 bg-transparent opacity-35"
                          : "border-white/12 bg-white/[0.03]"
                    }`}
                  >
                    <span className={`block text-[0.65rem] uppercase ${actif ? "text-gold" : "text-white/45"}`}>
                      {jourSemaine}
                    </span>
                    <span
                      className={`block font-serif text-lg lining-nums ${
                        actif ? "text-gold" : complet ? "text-white/40 line-through" : "text-cream"
                      }`}
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
            {disponibles !== null && premierJourLibre === null ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-light leading-relaxed text-white/55">
                Plus aucun créneau de {formatDuree(duree)} dans les {joursCles.length} prochains
                jours.
                <br />
                Appelez le salon au{" "}
                <a
                  href={`tel:${telephoneSalon}`}
                  onClick={() => track("Contact", { method: "phone" })}
                  className="text-gold"
                >
                  {telephoneSalon}
                </a>{" "}
                : on vous trouve une place.
              </p>
            ) : messageCreneaux ? (
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
                      className={`press w-full rounded-lg border py-2.5 text-sm ${
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
              onClick={continuer}
              className={`${boutonOr} flex-1 disabled:opacity-35`}
            >
              Continuer
            </button>
          </div>
        </section>
      )}

      {etapeCourante === 2 && dateEffective && heureMinutes !== null && (
        <EtapeCoordonnees
          lignes={selection.map((id) => {
            const p = parId.get(id);
            return {
              id,
              nom: p?.nom ?? id,
              prix: p ? tarifDuJour(p, aujourdhui) : null,
              aPartirDe: Boolean(p?.prix_a_partir_de),
            };
          })}
          total={
            packComplet
              ? { libelle: packComplet.nom, montant: packComplet.prix, aPartirDe: false }
              : { libelle: null, montant: prixConnu ? prixTotal : null, aPartirDe: totalDepart }
          }
          devise={devise}
          dureeMinutes={duree}
          dateCle={dateEffective}
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
          groupes={groupes}
          categorieParDefaut={categorie}
          devise={devise}
          onFermer={() => setFiche(undefined)}
        />
      )}
    </div>
  );
}
