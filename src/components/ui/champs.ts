/**
 * Classes des champs de formulaire, partagées par la réservation, la boutique
 * et l'administration.
 *
 * `text-base` (16 px) n'est pas décoratif : en dessous de 16 px, Safari iOS
 * zoome sur le champ à la mise au point et ne dézoome jamais ensuite.
 * `scroll-mt-28` garde le champ visible sous l'en-tête collant quand le
 * clavier le fait défiler.
 */
export const champSombre =
  "mt-1.5 w-full scroll-mt-28 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 " +
  "text-base text-cream placeholder:text-white/25 focus:border-gold focus:outline-none";

export const champClair =
  "mt-1.5 w-full scroll-mt-28 rounded-xl border border-sand bg-white px-4 py-3 text-base " +
  "text-ink placeholder:text-muted/60 focus:border-gold-deep focus:outline-none";

export const libelle = "font-light text-white/60";
export const libelleClair = "font-light text-muted";

export const boutonOr =
  "gold-gradient rounded-full py-3.5 text-center font-serif text-base text-noir " +
  "disabled:opacity-50";

export const boutonFantome =
  "rounded-full border border-white/15 px-5 py-3 text-sm text-white/70";
