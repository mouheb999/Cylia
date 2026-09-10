"use client";

import { useSyncExternalStore } from "react";

const CLE_STOCKAGE = "cylia.panier.v1";

/** Référence stable renvoyée au rendu serveur : le panier y est toujours vide. */
const VIDE: readonly string[] = [];

let panier: readonly string[] = VIDE;
let chargeDepuisStockage = false;
const abonnes = new Set<() => void>();

function lireStockage(): readonly string[] {
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    const valeurs = brut ? (JSON.parse(brut) as unknown) : null;
    return Array.isArray(valeurs) ? valeurs.filter((v) => typeof v === "string") : VIDE;
  } catch {
    // Navigation privée, stockage refusé, JSON corrompu : panier vide.
    return VIDE;
  }
}

function ecrireStockage(valeurs: readonly string[]): void {
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(valeurs));
  } catch {
    // Le panier reste valable pour la session même si l'écriture échoue.
  }
}

function definir(valeurs: readonly string[]): void {
  panier = valeurs;
  ecrireStockage(valeurs);
  abonnes.forEach((notifier) => notifier());
}

function sabonner(notifier: () => void): () => void {
  abonnes.add(notifier);
  return () => {
    abonnes.delete(notifier);
  };
}

/**
 * `useSyncExternalStore` impose de renvoyer la *même* référence tant que rien
 * n'a changé, sinon React boucle. D'où le chargement paresseux fait une seule
 * fois, et `VIDE` comme constante partagée.
 */
function instantane(): readonly string[] {
  if (!chargeDepuisStockage && typeof window !== "undefined") {
    panier = lireStockage();
    chargeDepuisStockage = true;
  }
  return panier;
}

function instantaneServeur(): readonly string[] {
  return VIDE;
}

/** Prestations retenues, dans l'ordre d'ajout. */
export function usePanier(): readonly string[] {
  return useSyncExternalStore(sabonner, instantane, instantaneServeur);
}

/** Ajoute la prestation si elle est absente, la retire sinon. */
export function basculerPrestation(id: string): void {
  const actuel = instantane();
  definir(actuel.includes(id) ? actuel.filter((p) => p !== id) : [...actuel, id]);
}

export function retirerPrestation(id: string): void {
  definir(instantane().filter((p) => p !== id));
}

export function viderPanier(): void {
  definir(VIDE);
}
