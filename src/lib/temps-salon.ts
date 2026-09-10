/**
 * « Aujourd'hui » vu du salon.
 *
 * Le serveur peut tourner à Francfort et la cliente être à Paris : ni l'un ni
 * l'autre ne décide de la date du jour. Seule compte l'heure de Sousse, et
 * c'est elle qu'on calcule ici — la même règle que `maintenant_salon()` côté
 * base, pour que l'affichage et l'écriture ne soient jamais en désaccord.
 */
export const FUSEAU_SALON = "Africa/Tunis";

const FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSEAU_SALON,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export type InstantSalon = {
  /** Date locale du salon, "AAAA-MM-JJ". */
  dateCle: string;
  /** Minutes écoulées depuis minuit, heure du salon. */
  minutes: number;
};

export function maintenantSalon(instant: Date = new Date()): InstantSalon {
  const parties = Object.fromEntries(
    FORMAT.formatToParts(instant).map((p) => [p.type, p.value]),
  );
  // "24" à minuit sur certains moteurs — ramené à 0 pour rester dans [0, 1439].
  const heures = Number(parties.hour) % 24;
  return {
    dateCle: `${parties.year}-${parties.month}-${parties.day}`,
    minutes: heures * 60 + Number(parties.minute),
  };
}

/** Les `nombre` prochaines dates, à partir d'aujourd'hui, heure du salon. */
export function clesJours(nombre: number, depuis?: string): string[] {
  const debut = depuis ?? maintenantSalon().dateCle;
  const [annee, mois, jour] = debut.split("-").map(Number);
  return Array.from({ length: nombre }, (_, i) => {
    // Arithmétique en UTC : ajouter un jour ne doit pas dépendre du fuseau du serveur.
    const d = new Date(Date.UTC(annee, mois - 1, jour + i));
    return d.toISOString().slice(0, 10);
  });
}
