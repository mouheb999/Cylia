import type { Pack, Prestation } from "@/lib/supabase/types";

/**
 * Ce qu'un pack sait de lui-même, une fois la base interrogée.
 *
 * Trois de ces colonnes sont arrivées après coup — `slug`, `images`,
 * `inclusions` (migration 0029). Une base où la migration n'est pas encore
 * passée renvoie des lignes sans elles, et le site doit continuer d'afficher
 * ses packs : chaque fonction d'ici sait donc se rabattre sur ce que la ligne
 * porte depuis toujours — le nom, la photo de couverture, la description.
 */

/** « Pack Hammam découverte » → « pack-hammam-decouverte ». */
export function versSlug(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** L'adresse de la fiche : `/packs/<slug>`. */
export function slugDuPack(pack: Pack): string {
  return pack.slug?.trim() || versSlug(pack.nom) || pack.id;
}

export function cheminPack(pack: Pack): string {
  return `/packs/${slugDuPack(pack)}`;
}

/**
 * L'album de la fiche, couverture en tête.
 *
 * Même règle que pour les groupes : `images` est la source, `image_url` le
 * repli des packs photographiés avant l'album.
 */
export function photosDuPack(pack: Pack): string[] {
  if (pack.images?.length) return pack.images;
  return pack.image_url ? [pack.image_url] : [];
}

/** La couverture : la vignette des cartes. */
export function couverturePack(pack: Pack): string | null {
  return photosDuPack(pack)[0] ?? null;
}

/**
 * Ce que le pack comprend, ligne à ligne.
 *
 * Le salon écrivait ses formules d'un trait — « Hammam . Gommage .
 * Enveloppement à l'argile verte » — faute d'un endroit où les ranger. La
 * fiche leur donne cet endroit ; les anciennes descriptions se relisent ici
 * telles qu'elles ont été écrites, le point suivi d'une espace pour
 * séparateur — le salon en met une devant, ou pas. Un point final n'étant
 * suivi de rien, une description d'une seule phrase reste une phrase.
 */
export function inclusionsDuPack(pack: Pack): string[] {
  if (pack.inclusions?.length) return pack.inclusions;
  const parties = pack.description
    .split(/\s*[·.]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parties.length >= 2 ? parties : [];
}

/**
 * La prestation que réserve un pack.
 *
 * Le salon la choisit dans le panneau. À défaut, on rapproche par le nom :
 * les packs de l'accueil portent celui de la prestation qui les réserve
 * (« Pack Hammam Evasion »), et une base où le rapprochement n'a pas encore
 * été fait ne doit pas offrir un bouton qui ne retient rien.
 */
export function prestationDuPack(
  pack: Pack,
  prestations: Prestation[],
): Prestation | null {
  if (pack.prestation_id) {
    const liee = prestations.find((p) => p.id === pack.prestation_id);
    if (liee) return liee;
  }
  const nom = pack.nom.trim().toLowerCase();
  return prestations.find((p) => p.nom.trim().toLowerCase() === nom) ?? null;
}

/**
 * Où mène « Réserver ce pack ».
 *
 * Avec une prestation reconnue, le tunnel s'ouvre sur elle, déjà retenue —
 * c'est le même chemin que les offres de l'accueil. Sans elle, on ouvre le
 * tunnel tout court : mieux vaut une liste à parcourir qu'un bouton mort.
 */
export function lienReservationPack(
  pack: Pack,
  prestations: Prestation[],
): string {
  const prestation = prestationDuPack(pack, prestations);
  return prestation ? `/reserver?prestation=${encodeURIComponent(prestation.id)}` : "/reserver";
}

/** La durée annoncée sur la fiche — celle du pack, sinon celle qu'il réserve. */
export function dureeDuPack(pack: Pack, prestations: Prestation[]): number | null {
  if (pack.duree_minutes && pack.duree_minutes > 0) return pack.duree_minutes;
  return prestationDuPack(pack, prestations)?.duree_minutes ?? null;
}
