/**
 * Numéros de téléphone : de ce que la cliente a tapé à ce qu'un appareil sait
 * composer.
 *
 * La base accepte 8 à 15 chiffres et garde la saisie telle quelle — « 54 395
 * 168 », « +216 54 395 168 » et « 0021654395168 » désignent la même personne.
 * `tel:` s'en accommode, mais `wa.me` non : WhatsApp veut des chiffres, sans
 * signe, sans zéro de sortie, avec l'indicatif pays. C'est cette normalisation
 * qui est faite ici, une fois, plutôt qu'à chaque bouton.
 */

/** Indicatif appliqué à un numéro local : le salon est en Tunisie. */
export const INDICATIF_DEFAUT = "216";

/** Longueur d'un numéro tunisien sans indicatif. */
const LONGUEUR_LOCALE = 8;

/**
 * Numéro au format international, en chiffres seulement (« 21654395168 »).
 *
 * Renvoie `null` quand il ne reste pas de quoi composer : mieux vaut ne pas
 * afficher le bouton que d'ouvrir WhatsApp sur une conversation inexistante.
 */
export function numeroInternational(
  brut: string,
  indicatif: string = INDICATIF_DEFAUT,
): string | null {
  const plus = brut.trim().startsWith("+");
  let chiffres = brut.replace(/\D/g, "");
  if (chiffres.length === 0) return null;

  // « 00 » est le préfixe de sortie international : 0021654395168.
  if (chiffres.startsWith("00")) chiffres = chiffres.slice(2);

  // Un numéro local tunisien n'a pas de zéro initial, mais l'habitude française
  // le fait ajouter : on le retire avant de compter les chiffres.
  if (chiffres.length === LONGUEUR_LOCALE + 1 && chiffres.startsWith("0")) {
    chiffres = chiffres.slice(1);
  }

  if (chiffres.length === LONGUEUR_LOCALE) return indicatif + chiffres;

  // Déjà international — soit parce qu'il portait un « + », soit parce qu'il
  // commence par l'indicatif et qu'il est trop long pour être local.
  if (plus || chiffres.startsWith(indicatif) || chiffres.length > LONGUEUR_LOCALE) {
    return chiffres.length >= 8 ? chiffres : null;
  }

  return null;
}

/** Lien d'appel. Garde la saisie si elle n'est pas normalisable. */
export function lienAppel(brut: string): string {
  const numero = numeroInternational(brut);
  return numero ? `tel:+${numero}` : `tel:${brut.replace(/\s/g, "")}`;
}

/**
 * Lien de conversation WhatsApp, message déjà écrit.
 *
 * `wa.me` ouvre l'application installée sur téléphone et WhatsApp Web sur
 * ordinateur : le même bouton marche des deux côtés, sans compte d'entreprise
 * ni clé d'API.
 */
export function lienWhatsApp(brut: string, message?: string): string | null {
  const numero = numeroInternational(brut);
  if (!numero) return null;
  const base = `https://wa.me/${numero}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** « Mouheb Boubrik » → « Mouheb ». Un message s'adresse à un prénom. */
export function prenom(nomComplet: string): string {
  return nomComplet.trim().split(/\s+/)[0] ?? nomComplet.trim();
}
