/** Formats partagés par le site public et l'administration. */

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

export function formatDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) return `${reste} min`;
  return reste === 0 ? `${heures} h` : `${heures} h ${reste}`;
}

export function formatDateLongue(cle: string): string {
  return depuisCleDate(cle).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDateCourte(cle: string): string {
  return depuisCleDate(cle).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function formatHorodatage(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Prix affiché. Le dinar tunisien se note à trois décimales, mais un salon
 * affiche des prix ronds : on ne garde les décimales que si elles existent.
 */
export function formatPrix(montant: number, devise = "DT"): string {
  const arrondi = Math.round(montant * 1000) / 1000;
  const texte = Number.isInteger(arrondi)
    ? `${arrondi}`
    : arrondi.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return `${texte} ${devise}`;
}

/** Les `nombre` prochains jours, à partir d'aujourd'hui. */
export function joursProposes(nombre: number, aujourdhui: Date = new Date()): Date[] {
  const debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  return Array.from({ length: nombre }, (_, i) => {
    const jour = new Date(debut);
    jour.setDate(debut.getDate() + i);
    return jour;
  });
}

export function formatJourCourt(date: Date) {
  return {
    jourSemaine: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
    jour: date.getDate(),
    mois: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
  };
}
