/**
 * `window.fbq`, posé par le code de base du pixel Meta
 * (voir `components/MetaPixel.tsx`).
 *
 * Facultatif : il n'existe ni sur le serveur, ni avant le chargement du
 * script, ni derrière un bloqueur de publicité. Tout appel passe donc par
 * `?.` — voir `lib/fbq.ts` et `lib/meta/track.ts`.
 */
export {};

declare global {
  interface Window {
    fbq?: (...arguments_: unknown[]) => void;
  }
}
