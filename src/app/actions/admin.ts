"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminConnecte, clientServeur } from "@/lib/supabase/serveur";
import { TAG_SITE } from "@/lib/donnees";
import type {
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

async function agir(travail: () => Promise<void>): Promise<Resultat> {
  try {
    await exigerAdmin();
    await travail();
    rafraichir();
    return { ok: true };
  } catch (erreur) {
    const brut = erreur instanceof Error ? erreur.message : String(erreur);
    if (brut.includes("ACCES_REFUSE")) {
      return { ok: false, message: "Vous n'êtes plus connectée. Reconnectez-vous." };
    }
    if (brut.includes("duplicate key")) {
      return { ok: false, message: "Cet identifiant est déjà utilisé." };
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

export type FormPrestation = {
  id?: string;
  nom: string;
  categorie_id: string;
  duree_minutes: number;
  prix: number | null;
  description: string;
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
      duree_minutes: Math.max(5, Math.round(form.duree_minutes)),
      prix: form.prix,
      description: form.description.trim(),
      ordre: form.ordre,
      actif: form.actif,
    };

    if (form.id) {
      const { error } = await supabase.from("prestations").update(ligne).eq("id", form.id);
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

export async function ajouterPhoto(image_url: string, alt: string): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { data } = await supabase
      .from("galerie")
      .select("ordre")
      .order("ordre", { ascending: false })
      .limit(1);
    const { error } = await supabase.from("galerie").insert({
      image_url,
      alt: alt.trim(),
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

export async function deplacerPhoto(id: string, sens: -1 | 1): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { data } = await supabase.from("galerie").select("id, ordre").order("ordre");
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
  });
}

export async function changerStatutCommande(
  id: string,
  statut: StatutCommande,
): Promise<Resultat> {
  return agir(async () => {
    const supabase = await clientServeur();
    const { error } = await supabase.from("commandes").update({ statut }).eq("id", id);
    if (error) throw error;
  });
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
