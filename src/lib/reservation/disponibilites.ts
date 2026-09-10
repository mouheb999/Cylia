import { HORAIRES, JOURS_PROPOSES, MODE_DEMO, dureeTotale } from "./catalogue";
import type { Creneau, Intervalle, Reservation } from "./types";

/** "AAAA-MM-JJ" pour une date locale (pas d'UTC : le fuseau décalerait le jour). */
export function versCleDate(date: Date): string {
  const mois = `${date.getMonth() + 1}`.padStart(2, "0");
  const jour = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

export function depuisCleDate(cle: string): Date {
  const [annee, mois, jour] = cle.split("-").map(Number);
  return new Date(annee, mois - 1, jour);
}

export function minutesVersHeure(minutes: number): string {
  const h = `${Math.floor(minutes / 60)}`.padStart(2, "0");
  const m = `${minutes % 60}`.padStart(2, "0");
  return `${h}:${m}`;
}

export function heureVersMinutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

/** Les `JOURS_PROPOSES` prochains jours, à partir d'aujourd'hui. */
export function joursProposes(aujourdhui: Date = new Date()): Date[] {
  const debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  return Array.from({ length: JOURS_PROPOSES }, (_, i) => {
    const jour = new Date(debut);
    jour.setDate(debut.getDate() + i);
    return jour;
  });
}

/** Générateur pseudo-aléatoire déterministe : une même date donne toujours la même occupation. */
function graine(cle: string): () => number {
  let etat = 0;
  for (let i = 0; i < cle.length; i += 1) {
    etat = (etat * 31 + cle.charCodeAt(i)) >>> 0;
  }
  return () => {
    etat = (etat * 1664525 + 1013904223) >>> 0;
    return etat / 0x100000000;
  };
}

/**
 * Occupation simulée du salon pour la démonstration.
 *
 * Déterministe : la grille d'une date donnée est identique à chaque affichage,
 * ce qui rend la démo reproductible. À supprimer en même temps que `MODE_DEMO`
 * quand les vraies réservations alimenteront le planning.
 */
export function occupationSimulee(dateCle: string): Intervalle[] {
  if (!MODE_DEMO) return [];

  const suivant = graine(dateCle);
  const nombreRendezVous = 7 + Math.floor(suivant() * 5);
  const occupees: Intervalle[] = [];

  for (let i = 0; i < nombreRendezVous; i += 1) {
    const amplitude = HORAIRES.fermeture - HORAIRES.ouverture;
    const debutBrut = HORAIRES.ouverture + Math.floor((suivant() * amplitude) / HORAIRES.pas) * HORAIRES.pas;
    const duree = [45, 60, 60, 90][Math.floor(suivant() * 4)];
    const fin = Math.min(debutBrut + duree, HORAIRES.fermeture);
    if (fin > debutBrut) occupees.push({ debut: debutBrut, fin });
  }

  return occupees;
}

function seChevauchent(a: Intervalle, b: Intervalle): boolean {
  return a.debut < b.fin && b.debut < a.fin;
}

/**
 * Créneaux de la journée pour une prestation.
 *
 * Un créneau est proposé s'il tient entièrement dans les horaires d'ouverture
 * et s'il reste une place libre : le salon mène plusieurs rendez-vous de front
 * (voir `HORAIRES.capaciteSimultanee`), un horaire n'est donc refusé que
 * lorsque tous les postes sont occupés.
 */
export function creneauxDuJour({
  dureeMinutes,
  dateCle,
  reservations,
  maintenant = new Date(),
}: {
  /** Durée totale du rendez-vous, toutes prestations cumulées. */
  dureeMinutes: number;
  dateCle: string;
  reservations: Reservation[];
  maintenant?: Date;
}): Creneau[] {
  const occupees: Intervalle[] = [
    ...occupationSimulee(dateCle),
    ...reservations.map((r) => {
      const debut = heureVersMinutes(r.heure);
      return { debut, fin: debut + dureeTotale(r.prestationIds) };
    }),
  ];

  const estAujourdhui = dateCle === versCleDate(maintenant);
  const plancher = estAujourdhui
    ? maintenant.getHours() * 60 + maintenant.getMinutes() + HORAIRES.delaiMinimumMinutes
    : 0;

  const creneaux: Creneau[] = [];
  for (
    let debut = HORAIRES.ouverture;
    debut + dureeMinutes <= HORAIRES.fermeture;
    debut += HORAIRES.pas
  ) {
    const candidat: Intervalle = { debut, fin: debut + dureeMinutes };
    const simultanes = occupees.filter((o) => seChevauchent(candidat, o)).length;
    const libre = debut >= plancher && simultanes < HORAIRES.capaciteSimultanee;
    creneaux.push({ heure: minutesVersHeure(debut), disponible: libre });
  }

  return creneaux;
}
