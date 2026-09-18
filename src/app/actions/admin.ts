"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminConnecte, clientServeur } from "@/lib/supabase/serveur";
import { TAG_SITE } from "@/lib/donnees";
import type {
  EmplacementPhoto,
  Reglages,
  StatutCommande,
  StatutReservation,
} from "@/lib/supabase/types";

/** Réponse d'une action d'administration : réussie, ou refusée avec sa raison. */
export type Resultat = { ok: true } | { ok: false; message: string };

/**
 * Garde d'entrée de toutes les écritures d'administration.
 *
 * Une action serveur est joignable par un simple POST, pas seulement depuis le
 * panneau : la vérification se fait donc ici, à chaque appel, et non dans
 * l'interface. RLS reste la seconde barrière côté base — même une action
 * oubliée ici ne pourrait rien écrire sans session admin.
 */
async function exigerAdmin() {
  const admin = await adminConnecte();
  if (!admin) throw new Error("ACCES_REFUSE");
  return admin;
}

/**
 * Les données publiques sont servies depuis un cache partagé : sans cette
 * invalidation, une correction faite dans le panneau resterait invisible
 * jusqu'à une heure. `updateTag` périme l'entrée tout de suite, pour que
 * l'administratrice voie sa propre modification à la page suivante.
 */
function rafraichir() {
  updateTag(TAG_SITE);
  revalidatePath("/", "layout");
}

/**
 * Un changement de statut ne touche pas le site public.
 *
 * Confirmer un rendez-vous périmait tout le cache partagé : la visiteuse
 * suivante attendait une relecture complète du catalogue pour rien. Seules les
 * pages du panneau ont besoin d'être refaites.
 */
function rafraichirPanneau() {
  revalidatePath("/admin", "layout");
}

async function agir(
  travail: () => Promise<void>,
  apres: () => void = rafraichir,
): Promise<Resultat> {
  try {
    await exigerAdmin();
    await travail();
    apres();
    return { ok: true };
  } catch (erreur) {
    const brut = erreur instanceof Error ? erreur.message : String(erreur);
    if (brut.includes("ACCES_REFUSE")) {
      return { ok: false, message: "Vous n'êtes plus connectée. Reconnectez-vous." };
    }
    if (brut.includes("duplicate key")) {
      return { ok: false, message: "Cet identifiant est déjà utilisé." };
    }
    if (brut.includes("PRIX_MANQUANT")) {
      return {
        ok: false,
        message: "Donnez d'abord un prix à cette prestation, dans « Prestations ».",
      };
    }
    if (brut.includes("PROMO_TROP_HAUTE")) {
      return { ok: false, message: "Le tarif promo doit être inférieur au prix affiché." };
    }
    if (brut.includes("PROMO_INVALIDE")) {
      return { ok: false, message: "Ce tarif promo n'est pas un montant valable." };
    }
    if (brut.includes("PRESTATION_INCONNUE")) {
      return { ok: false, message: "Cette prestation n'existe plus. Rafraîchissez la page." };
    }
    if (brut.includes("TRANSITION_INVALIDE")) {
      return {
        ok: false,
        message: "Ce rendez-vous a changé entre-temps. Rafraîchissez la page.",
      };
    }
    console.error("[cylia] administration :", erreur);
    return { ok: false, message: "L'enregistrement a échoué. Réessayez." };
  }
}

/** Identifiant lisible dérivé d'un nom : « Coupe & brushing » → « coupe-brushing ». */
function versIdentifiant(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ------------------------------------------------------------------ contenu

export async function enregistrerContenu(
  cle: string,
  valeur: string,
  type: "texte" | "image" | "lien" = "texte",
): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase
      .from("contenus")
      .upsert({ cle, valeur, type, maj_le: new Date().toISOString() }, { onConflict: "cle" });
    if (error) throw error;
  });
}

/** Supprime la ligne : le site reprend la valeur d'origine du code. */
export async function reinitialiserContenu(cle: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("contenus").delete().eq("cle", cle);
    if (error) throw error;
  });
}

// -------------------------------------------------------------- prestations

// ------------------------------------------------------------------ groupes

export type FormGroupe = {
  id?: string;
  categorie_id: string;
  nom: string;
  description: string;
  /** L'album du groupe. La première photo sert de couverture. */
  images: string[];
  duree_visible: boolean;
  ordre: number;
  actif: boolean;
};

export async function enregistrerGroupe(form: FormGroupe): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const nom = form.nom.trim();
    if (nom.length < 2) throw new Error("NOM_COURT");

    // La couverture n'est pas un second champ à tenir à jour : c'est la
    // première photo de l'album, celle que la vignette du groupe montre.
    const images = form.images.filter((url) => url.trim() !== "");
    const ligne = {
      categorie_id: form.categorie_id,
      nom,
      description: form.description.trim(),
      images,
      image_url: images[0] ?? null,
      duree_visible: form.duree_visible,
      ordre: form.ordre,
      actif: form.actif,
    };

    if (form.id) {
      const { error } = await supabase.from("groupes").update(ligne).eq("id", form.id);
      if (error) throw error;
      return;
    }

    const base = versIdentifiant(nom) || "groupe";
    const { data: pris } = await supabase.from("groupes").select("id").like("id", `${base}%`);
    const existants = new Set((pris ?? []).map((g) => g.id));
    let id = base;
    for (let n = 2; existants.has(id); n += 1) id = `${base}-${n}`;

    const { error } = await supabase.from("groupes").insert({ id, ...ligne });
    if (error) throw error;
  });
}

/**
 * Un groupe retiré est masqué, pas effacé : ses prestations gardent leur
 * `groupe_id` et reviennent avec lui si le salon le réaffiche. Elles restent
 * visibles entre-temps, listées sous les vignettes de leur catégorie.
 */
export async function supprimerGroupe(id: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("groupes").update({ actif: false }).eq("id", id);
    if (error) throw error;
  });
}

export type FormPrestation = {
  id?: string;
  nom: string;
  categorie_id: string;
  groupe_id: string | null;
  duree_minutes: number;
  prix: number | null;
  prix_a_partir_de: boolean;
  description: string;
  image_url: string | null;
  ordre: number;
  actif: boolean;
};

export async function enregistrerPrestation(form: FormPrestation): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const nom = form.nom.trim();
    if (nom.length < 2) throw new Error("NOM_COURT");

    const ligne = {
      nom,
      categorie_id: form.categorie_id,
      groupe_id: form.groupe_id,
      duree_minutes: Math.max(5, Math.round(form.duree_minutes)),
      prix: form.prix,
      // « À partir de » sans prix n'annonce rien : la mention tombe avec le
      // tarif qu'elle qualifiait, plutôt que de faire échouer l'enregistrement
      // sur une contrainte de la base.
      prix_a_partir_de: form.prix === null ? false : form.prix_a_partir_de,
      description: form.description.trim(),
      image_url: form.image_url,
      ordre: form.ordre,
      actif: form.actif,
    };

    if (form.id) {
      // Une remise ne survit pas à un prix qui passe sous elle. La base refuse
      // déjà ce cas, mais son refus arriverait ici sous forme de « contrainte
      // violée » — illisible pour qui vient simplement de corriger un tarif.
      const { data: actuelle } = await supabase
        .from("prestations")
        .select("prix_promo")
        .eq("id", form.id)
        .maybeSingle();
      const promo = actuelle?.prix_promo ?? null;
      const promoDepassee = promo !== null && (form.prix === null || promo >= form.prix);

      const { error } = await supabase
        .from("prestations")
        .update(
          promoDepassee
            ? { ...ligne, prix_promo: null, promo_libelle: "", promo_fin: null }
            : ligne,
        )
        .eq("id", form.id);
      if (error) throw error;
      return;
    }

    // Identifiant dérivé du nom, suffixé si deux prestations portent le même.
    const base = versIdentifiant(nom) || "prestation";
    const { data: prises } = await supabase
      .from("prestations")
      .select("id")
      .like("id", `${base}%`);
    const existants = new Set((prises ?? []).map((p) => p.id));
    let id = base;
    for (let n = 2; existants.has(id); n += 1) id = `${base}-${n}`;

    const { error } = await supabase.from("prestations").insert({ id, ...ligne });
    if (error) throw error;
  });
}

export async function supprimerPrestation(id: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    // Désactivée, jamais effacée : les rendez-vous passés y font référence.
    const { error } = await supabase.from("prestations").update({ actif: false }).eq("id", id);
    if (error) throw error;
  });
}

export async function reordonnerPrestations(ids: string[]): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    await Promise.all(
      ids.map((id, index) =>
        supabase.from("prestations").update({ ordre: index + 1 }).eq("id", id),
      ),
    );
  });
}

// --------------------------------------------------------------- catégories

export async function enregistrerCategorie(form: {
  id?: string;
  nom: string;
  description: string;
  ordre: number;
  actif: boolean;
}): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const nom = form.nom.trim();
    if (nom.length < 2) throw new Error("NOM_COURT");
    const ligne = {
      nom,
      description: form.description.trim(),
      ordre: form.ordre,
      actif: form.actif,
    };
    if (form.id) {
      const { error } = await supabase.from("categories").update(ligne).eq("id", form.id);
      if (error) throw error;
      return;
    }
    const { error } = await supabase
      .from("categories")
      .insert({ id: versIdentifiant(nom) || `categorie-${Date.now()}`, ...ligne });
    if (error) throw error;
  });
}

// ------------------------------------------------------------------ galerie

/**
 * Une photo de plus, dans le bandeau de l'accueil ou dans la galerie.
 *
 * Les deux emplacements vivent dans la même table et chacun a sa propre suite
 * de numéros : la troisième photo du bandeau ne se retrouve pas coincée
 * derrière les douze de la galerie.
 */
export async function ajouterPhoto(
  image_url: string,
  alt: string,
  emplacement: EmplacementPhoto = "galerie",
): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { data } = await supabase
      .from("galerie")
      .select("ordre")
      .eq("emplacement", emplacement)
      .order("ordre", { ascending: false })
      .limit(1);
    const { error } = await supabase.from("galerie").insert({
      image_url,
      alt: alt.trim(),
      emplacement,
      ordre: (data?.[0]?.ordre ?? 0) + 1,
    });
    if (error) throw error;
  });
}

export async function supprimerPhoto(id: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("galerie").delete().eq("id", id);
    if (error) throw error;
  });
}

/**
 * La phrase lue à la place de la photo.
 *
 * Ce n'est pas un détail d'accessibilité rangé dans un coin : c'est aussi ce
 * que Google lit, et ce qui s'affiche si la photo ne charge pas.
 */
export async function decrirePhoto(id: string, alt: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase
      .from("galerie")
      .update({ alt: alt.trim().slice(0, 200) })
      .eq("id", id);
    if (error) throw error;
  });
}

/**
 * Une photo change de rang avec sa voisine — dans son emplacement.
 *
 * L'échange se fait entre photos du même bandeau ou de la même galerie :
 * sans ce filtre, la première photo de la galerie irait prendre le rang de la
 * dernière du bandeau, et les deux listes se mélangeraient.
 */
export async function deplacerPhoto(id: string, sens: -1 | 1): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { data: cible } = await supabase
      .from("galerie")
      .select("emplacement")
      .eq("id", id)
      .maybeSingle();
    if (!cible) return;

    const { data } = await supabase
      .from("galerie")
      .select("id, ordre")
      .eq("emplacement", cible.emplacement)
      .order("ordre");
    const photos = data ?? [];
    const index = photos.findIndex((p) => p.id === id);
    const voisin = index + sens;
    if (index < 0 || voisin < 0 || voisin >= photos.length) return;
    await Promise.all([
      supabase.from("galerie").update({ ordre: photos[voisin].ordre }).eq("id", photos[index].id),
      supabase.from("galerie").update({ ordre: photos[index].ordre }).eq("id", photos[voisin].id),
    ]);
  });
}

// --------------------------------------------------------------- promotions

export type FormPromotion = {
  /** Tarif remisé, strictement sous le prix affiché. */
  prix_promo: number;
  /** Ce que l'offre annonce. Vide : la carte reprend la description. */
  promo_libelle: string;
  /** Dernier jour de l'offre, inclus. `null` : jusqu'au retrait. */
  promo_fin: string | null;
};

/**
 * Pose une remise sur une prestation.
 *
 * Les mêmes garde-fous qu'en base, mais dits en français : une contrainte
 * violée renverrait « L'enregistrement a échoué », qui n'apprend rien à la
 * personne devant l'écran.
 */
export async function definirPromotion(id: string, form: FormPromotion): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { data: prestation } = await supabase
      .from("prestations")
      .select("prix")
      .eq("id", id)
      .maybeSingle();

    if (!prestation) throw new Error("PRESTATION_INCONNUE");
    if (prestation.prix == null) throw new Error("PRIX_MANQUANT");

    const promo = Math.round(form.prix_promo * 1000) / 1000;
    if (!Number.isFinite(promo) || promo < 0) throw new Error("PROMO_INVALIDE");
    if (promo >= prestation.prix) throw new Error("PROMO_TROP_HAUTE");

    const { error } = await supabase
      .from("prestations")
      .update({
        prix_promo: promo,
        promo_libelle: form.promo_libelle.trim().slice(0, 80),
        promo_fin: form.promo_fin || null,
      })
      .eq("id", id);
    if (error) throw error;
  });
}

/** L'offre s'arrête ; le prix d'origine reprend sa place. */
export async function retirerPromotion(id: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase
      .from("prestations")
      .update({ prix_promo: null, promo_libelle: "", promo_fin: null })
      .eq("id", id);
    if (error) throw error;
  });
}

// ----------------------------------------------------------------- produits

export type FormProduit = {
  id?: string;
  nom: string;
  marque: string;
  description: string;
  prix: number;
  ancien_prix: number | null;
  image_url: string | null;
  categorie: string;
  famille: string;
  stock: number;
  ordre: number;
  actif: boolean;
};

export async function enregistrerProduit(form: FormProduit): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const nom = form.nom.trim();
    if (nom.length < 2) throw new Error("NOM_COURT");

    const ligne = {
      nom,
      marque: form.marque.trim(),
      description: form.description.trim(),
      prix: Math.max(0, form.prix),
      ancien_prix: form.ancien_prix,
      image_url: form.image_url,
      categorie: form.categorie,
      famille: form.famille,
      stock: Math.max(0, Math.round(form.stock)),
      ordre: form.ordre,
      actif: form.actif,
    };

    if (form.id) {
      const { error } = await supabase.from("produits").update(ligne).eq("id", form.id);
      if (error) throw error;
      return;
    }

    const base = versIdentifiant(nom) || "produit";
    const { data: pris } = await supabase.from("produits").select("slug").like("slug", `${base}%`);
    const existants = new Set((pris ?? []).map((p) => p.slug));
    let slug = base;
    for (let n = 2; existants.has(slug); n += 1) slug = `${base}-${n}`;

    const { error } = await supabase.from("produits").insert({ slug, ...ligne });
    if (error) throw error;
  });
}

// -------------------------------------------------------------------- packs

export type FormPack = {
  id?: string;
  nom: string;
  description: string;
  /** `null` pour un pack sur devis : la carte n'affiche alors aucun chiffre. */
  prix: number | null;
  image_url: string | null;
  ordre: number;
  actif: boolean;
};

export async function enregistrerPack(form: FormPack): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const nom = form.nom.trim();
    if (nom.length < 2) throw new Error("NOM_COURT");

    const ligne = {
      nom,
      description: form.description.trim(),
      prix: form.prix === null ? null : Math.max(0, form.prix),
      image_url: form.image_url,
      ordre: form.ordre,
      actif: form.actif,
    };

    if (form.id) {
      const { error } = await supabase.from("packs").update(ligne).eq("id", form.id);
      if (error) throw error;
      return;
    }

    // Un pack ajouté se range à la suite : sans rang explicite, tous les
    // nouveaux arriveraient à zéro et la liste se mélangerait à chaque ajout.
    const { data } = await supabase
      .from("packs")
      .select("ordre")
      .order("ordre", { ascending: false })
      .limit(1);
    const { error } = await supabase
      .from("packs")
      .insert({ ...ligne, ordre: (data?.[0]?.ordre ?? 0) + 1 });
    if (error) throw error;
  });
}

export async function supprimerPack(id: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("packs").delete().eq("id", id);
    if (error) throw error;
  });
}

/** Un pack échange son rang avec son voisin — c'est l'ordre de l'accueil. */
export async function deplacerPack(id: string, sens: -1 | 1): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { data } = await supabase.from("packs").select("id, ordre").order("ordre");
    const liste = data ?? [];
    const index = liste.findIndex((p) => p.id === id);
    const voisin = liste[index + sens];
    if (index < 0 || !voisin) return;

    const courant = liste[index];
    await Promise.all([
      supabase.from("packs").update({ ordre: voisin.ordre }).eq("id", courant.id),
      supabase.from("packs").update({ ordre: courant.ordre }).eq("id", voisin.id),
    ]);
  });
}

/**
 * Stock d'un seul produit.
 *
 * `enregistrerProduit` réécrit toute la fiche : s'en servir pour changer une
 * quantité renverrait le nom, la description et le prix tels que la page les a
 * en mémoire, et écraserait une correction faite entre-temps ailleurs. Ici, une
 * seule colonne part, et deux réapprovisionnements simultanés ne peuvent pas se
 * marcher dessus.
 */
export async function definirStock(id: string, stock: number): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase
      .from("produits")
      .update({ stock: Math.max(0, Math.min(100000, Math.round(stock))) })
      .eq("id", id);
    if (error) throw error;
  });
}

export async function supprimerProduit(id: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    // Retiré de la vitrine sans effacer l'historique des commandes.
    const { error } = await supabase.from("produits").update({ actif: false }).eq("id", id);
    if (error) throw error;
  });
}

// ------------------------------------------------- réservations & commandes

export async function changerStatutReservation(
  id: string,
  statut: StatutReservation,
): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("reservations").update({ statut }).eq("id", id);
    if (error) throw error;
  }, rafraichirPanneau);
}

export async function changerStatutCommande(
  id: string,
  statut: StatutCommande,
): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("commandes").update({ statut }).eq("id", id);
    if (error) throw error;
  }, rafraichirPanneau);
}

// ----------------------------------------------------- réglages & fermetures

export async function enregistrerReglages(form: Partial<Reglages>): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    // `id` et `maj_le` ne se règlent pas depuis le formulaire.
    const champs = { ...form, id: undefined, maj_le: new Date().toISOString() };
    delete champs.id;
    const { error } = await supabase.from("reglages").update(champs).eq("id", 1);
    if (error) throw error;
  });
}

export async function ajouterFermeture(
  date_debut: string,
  date_fin: string,
  motif: string,
): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase
      .from("fermetures")
      .insert({ date_debut, date_fin: date_fin || date_debut, motif: motif.trim() || null });
    if (error) throw error;
  });
}

export async function supprimerFermeture(id: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("fermetures").delete().eq("id", id);
    if (error) throw error;
  });
}
