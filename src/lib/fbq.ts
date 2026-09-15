/**
 * Le pixel Meta, vu depuis le reste du site.
 *
 * `fbq` n'existe que dans le navigateur, et seulement une fois le script de
 * Meta chargé : sur le serveur, ou derrière un bloqueur de publicité, il n'y a
 * rien à appeler. Tout passe donc par ici, où l'absence est le cas normal et
 * ne casse rien — un `onClick` qui lèverait une erreur empêcherait le lien de
 * partir, ce qui coûterait un vrai rendez-vous pour une mesure manquée.
 */

declare global {
  interface Window {
    /** Posée par le code de base du pixel (voir `components/MetaPixel.tsx`). */
    fbq?: (...arguments_: unknown[]) => void;
  }
}

/**
 * Remonte un évènement à Meta.
 *
 * Aucune donnée personnelle ne doit passer par `parametres` : ni nom, ni
 * téléphone, ni adresse. Seulement la nature du geste.
 */
export function track(evenement: string, parametres?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Sans paramètres, on n'en passe pas : `fbq('track', 'PageView', undefined)`
  // partirait avec un `custom_data` vide plutôt qu'absent.
  if (parametres) window.fbq?.("track", evenement, parametres);
  else window.fbq?.("track", evenement);
}
