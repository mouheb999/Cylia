import "server-only";
import { clientServeur } from "@/lib/supabase/serveur";
import type {
  ArticleCommande,
  Categorie,
  Commande,
  Fermeture,
  Prestation,
  Produit,
  Reservation,
  StatutCommande,
  StatutReservation,
} from "@/lib/supabase/types";

/**
 * Lectures du panneau d'administration.
 *
 * Contrairement à `donnees.ts`, rien n'est filtré sur `actif` : le salon doit
 * voir aussi ce qu'il a retiré de la vitrine. Ces requêtes ne passent que si
 * RLS reconnaît une session administratrice — le layout du panneau l'a déjà
 * vérifié, la base le revérifie.
 */

export type CommandeDetaillee = Commande & { articles: ArticleCommande[] };

export async function statistiques(): Promise<Record<string, number>> {
  const supabase = await clientServeur();
  const { data, error } = await supabase.rpc("statistiques_admin");
  if (error) throw error;
  return (data ?? {}) as Record<string, number>;
}

export async function reservationsAdmin(options: {
  depuis?: string;
  jusqua?: string;
  statut?: StatutReservation;
  limite?: number;
}): Promise<Reservation[]> {
  const supabase = await clientServeur();
  let requete = supabase.from("reservations").select("*");
  if (options.depuis) requete = requete.gte("date", options.depuis);
  if (options.jusqua) requete = requete.lte("date", options.jusqua);
  if (options.statut) requete = requete.eq("statut", options.statut);

  const { data, error } = await requete
    .order("date")
    .order("heure_minutes")
    .limit(options.limite ?? 300);
  if (error) throw error;
  return data as Reservation[];
}

export async function commandesAdmin(statut?: StatutCommande): Promise<CommandeDetaillee[]> {
  const supabase = await clientServeur();
  let requete = supabase.from("commandes").select("*");
  if (statut) requete = requete.eq("statut", statut);

  const { data, error } = await requete.order("cree_le", { ascending: false }).limit(200);
  if (error) throw error;

  const commandes = (data ?? []) as Commande[];
  if (commandes.length === 0) return [];

  // Une seule requête pour toutes les lignes, plutôt qu'une par commande.
  const { data: lignes, error: erreurLignes } = await supabase
    .from("commande_articles")
    .select("*")
    .in(
      "commande_id",
      commandes.map((c) => c.id),
    );
  if (erreurLignes) throw erreurLignes;

  const parCommande = new Map<string, ArticleCommande[]>();
  for (const ligne of (lignes ?? []) as ArticleCommande[]) {
    const liste = parCommande.get(ligne.commande_id) ?? [];
    liste.push(ligne);
    parCommande.set(ligne.commande_id, liste);
  }

  return commandes.map((c) => ({ ...c, articles: parCommande.get(c.id) ?? [] }));
}

export async function prestationsAdmin(): Promise<Prestation[]> {
  const supabase = await clientServeur();
  const { data, error } = await supabase
    .from("prestations")
    .select("*")
    .order("categorie_id")
    .order("ordre");
  if (error) throw error;
  return data as Prestation[];
}

export async function categoriesAdmin(): Promise<Categorie[]> {
  const supabase = await clientServeur();
  const { data, error } = await supabase.from("categories").select("*").order("ordre");
  if (error) throw error;
  return data as Categorie[];
}

export async function produitsAdmin(): Promise<Produit[]> {
  const supabase = await clientServeur();
  const { data, error } = await supabase.from("produits").select("*").order("ordre");
  if (error) throw error;
  return data as Produit[];
}

export async function fermeturesAdmin(): Promise<Fermeture[]> {
  const supabase = await clientServeur();
  const { data, error } = await supabase.from("fermetures").select("*").order("date_debut");
  if (error) throw error;
  return data as Fermeture[];
}

export async function contenusAdmin(): Promise<Record<string, string>> {
  const supabase = await clientServeur();
  const { data, error } = await supabase.from("contenus").select("cle, valeur");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((c) => [c.cle, c.valeur]));
}
