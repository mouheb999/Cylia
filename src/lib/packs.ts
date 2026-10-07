import type { CategoriePack, Pack, Prestation } from "@/lib/supabase/types";

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
  if (pack.prestation_ids?.length) {
    return prestations.find((p) => p.id === pack.prestation_ids![0]) ?? null;
  }
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
  // Un pack composé de plusieurs prestations les dépose toutes d'un coup.
  if (prestationsDuPack(pack, prestations).length > 1) {
    return `/reserver?pack=${encodeURIComponent(slugDuPack(pack))}`;
  }
  const prestation = prestationDuPack(pack, prestations);
  return prestation ? `/reserver?prestation=${encodeURIComponent(prestation.id)}` : "/reserver";
}

/** La durée annoncée sur la fiche — celle du pack, sinon celle qu'il réserve. */
export function dureeDuPack(pack: Pack, prestations: Prestation[]): number | null {
  if (pack.duree_minutes && pack.duree_minutes > 0) return pack.duree_minutes;
  const incluses = prestationsDuPack(pack, prestations);
  if (incluses.length === 0) return null;
  return incluses.reduce((total, p) => total + p.duree_minutes, 0);
}

/**
 * Les prestations que réunit le pack, dans l'ordre choisi par le salon. Un
 * pack d'avant les compositions retombe sur sa prestation unique.
 */
export function prestationsDuPack(pack: Pack, prestations: Prestation[]): Prestation[] {
  if (pack.prestation_ids?.length) {
    const parId = new Map(prestations.map((p) => [p.id, p]));
    return pack.prestation_ids
      .map((id) => parId.get(id))
      .filter((p): p is Prestation => p !== undefined);
  }
  const seule = prestationDuPack(pack, prestations);
  return seule ? [seule] : [];
}

/** Ce que coûteraient les prestations prises une à une — `null` si un prix manque. */
export function valeurALUnite(incluses: Prestation[]): number | null {
  if (incluses.length === 0 || incluses.some((p) => p.prix == null)) return null;
  return incluses.reduce((total, p) => total + (p.prix ?? 0), 0);
}

// ------------------------------------------------------------- catégories

export function cheminCategoriePack(categorie: CategoriePack): string {
  return `/packs/categorie/${categorie.slug || categorie.id}`;
}

/** Les packs d'une catégorie, dans l'ordre du salon. */
export function packsDeCategorie(categorie: CategoriePack, packs: Pack[]): Pack[] {
  const rang = new Map(categorie.pack_ids.map((id, i) => [id, i]));
  return packs
    .filter((p) => p.categorie_id === categorie.id)
    .sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
}

/**
 * Les packs qu'aucune catégorie visible ne recueille — sans catégorie, ou dans
 * une catégorie masquée. Ils restent affichés, sous les catégories : un pack
 * visible ne doit pas devenir introuvable parce qu'on a rangé autour de lui.
 */
export function packsHorsCategorie(categories: CategoriePack[], packs: Pack[]): Pack[] {
  const ids = new Set(categories.map((c) => c.id));
  return packs.filter((p) => !p.categorie_id || !ids.has(p.categorie_id));
}

/** La photo d'une catégorie — la sienne, sinon la couverture de son premier pack. */
export function imageCategoriePack(categorie: CategoriePack, packs: Pack[]): string | null {
  if (categorie.image_url) return categorie.image_url;
  for (const pack of packsDeCategorie(categorie, packs)) {
    const couverture = couverturePack(pack);
    if (couverture) return couverture;
  }
  return null;
}

export function libelleNombrePacks(n: number): string {
  return n === 1 ? "1 pack" : `${n} packs`;
}

export const CLE_CATEGORIES_PACKS = "packs.categories";
export const CLE_COMPOSITIONS_PACKS = "packs.compositions";

/** `packs.compositions` : pour chaque pack, ses prestations. */
export function lireCompositions(valeur: string | undefined): Record<string, string[]> {
  if (!valeur) return {};
  try {
    const brut = JSON.parse(valeur) as unknown;
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return {};
    const propre: Record<string, string[]> = {};
    for (const [id, ids] of Object.entries(brut)) {
      if (Array.isArray(ids)) propre[id] = ids.filter((x) => typeof x === "string");
    }
    return propre;
  } catch {
    return {};
  }
}

/** Pose `prestation_ids` sur chaque pack composé. */
export function composerPacks(packs: Pack[], valeur: string | undefined): Pack[] {
  const compositions = lireCompositions(valeur);
  return packs.map((pack) =>
    compositions[pack.id]?.length ? { ...pack, prestation_ids: compositions[pack.id] } : pack,
  );
}

const FAMILLES = [
  {
    slug: "hammam",
    nom: "Packs Hammam",
    description: "Le rituel du hammam, du gommage au bain d'huile.",
    motif: /hammam/i,
  },
  {
    slug: "mariage",
    nom: "Packs Mariée",
    description: "Tout ce qu'il faut pour le grand jour.",
    motif: /mari|wedding|arous/i,
  },
  {
    slug: "autres",
    nom: "Autres packs",
    description: "Head spa, soins et formules de saison.",
    motif: /.*/,
  },
];

/** Tant que le salon n'a rien rangé : les catégories devinées d'après le nom des packs. */
function categoriesDevinees(packs: Pack[]): CategoriePack[] {
  return FAMILLES.map((f) => ({
    id: f.slug,
    slug: f.slug,
    nom: f.nom,
    description: f.description,
    image_url: null,
    actif: true,
    pack_ids: packs
      .filter((pack) => FAMILLES.find((x) => x.motif.test(pack.nom)) === f)
      .map((pack) => pack.id),
  }));
}

/** Relit le contenu `packs.categories` ; à défaut, devine d'après les noms. */
export function lireCategoriesPacks(valeur: string | undefined, packs: Pack[]): CategoriePack[] {
  if (valeur) {
    try {
      const brut = JSON.parse(valeur) as Partial<CategoriePack>[];
      if (Array.isArray(brut)) {
        return brut
          .filter((c) => c && typeof c.id === "string" && typeof c.nom === "string")
          .map((c) => ({
            id: c.id!,
            slug: c.slug || c.id!,
            nom: c.nom!,
            description: c.description ?? "",
            image_url: c.image_url ?? null,
            actif: c.actif !== false,
            pack_ids: Array.isArray(c.pack_ids) ? c.pack_ids : [],
          }));
      }
    } catch {
      // Un contenu illisible ne doit pas casser la page : on devine.
    }
  }
  return categoriesDevinees(packs);
}

/**
 * Pose `categorie_id` sur chaque pack, et range ceux de chaque catégorie dans
 * l'ordre choisi par le salon.
 */
export function rangerPacks(categories: CategoriePack[], packs: Pack[]): Pack[] {
  const ou = new Map<string, string>();
  for (const c of categories) for (const id of c.pack_ids) if (!ou.has(id)) ou.set(id, c.id);
  return packs.map((pack) => ({ ...pack, categorie_id: ou.get(pack.id) ?? null }));
}
