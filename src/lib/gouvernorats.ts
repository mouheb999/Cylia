/**
 * Les 24 gouvernorats de Tunisie, dans l'ordre alphabétique.
 *
 * La livraison se fait par gouvernorat : une liste fermée plutôt qu'une ville
 * en texte libre — rien à taper sur un téléphone, et aucune « Sousse » écrite
 * de quatre façons dans les commandes.
 */
export const GOUVERNORATS = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Le Kef",
  "Mahdia",
  "La Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;

export type Gouvernorat = (typeof GOUVERNORATS)[number];

export function estGouvernorat(valeur: string): valeur is Gouvernorat {
  return (GOUVERNORATS as readonly string[]).includes(valeur);
}
