import { storeLocal } from "./store-local";
import type { StoreReservations } from "./types";

/**
 * Store actif de l'application.
 *
 * Aujourd'hui : `storeLocal` (navigateur, aucune donnée ne sort de l'appareil).
 * Demain : remplacer par le store Supabase — l'interface `StoreReservations`
 * ne bouge pas, les composants d'interface non plus. Voir docs/RESERVATION.md.
 */
export const store: StoreReservations = storeLocal;

export * from "./catalogue";
export * from "./disponibilites";
export type * from "./types";
