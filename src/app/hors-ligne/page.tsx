import Link from "next/link";

export const metadata = { title: "Hors ligne — CYLIA" };

/**
 * Page gardée en mémoire par l'agent de service.
 *
 * C'est la seule du site qu'il met en cache, et elle ne contient rien qui
 * puisse vieillir : ni prix, ni créneau, ni planning. Une page mise en cache
 * qui affirmerait qu'un créneau est libre serait pire que pas de page du tout.
 */
export default function PageHorsLigne() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold">CYLIA</p>
      <h1 className="mt-4 font-serif text-3xl font-light text-cream">
        Pas de réseau
      </h1>
      <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-white/55">
        L&apos;application a besoin de la connexion pour afficher le planning à
        jour. Rien n&apos;est perdu&nbsp;: revenez dès que le réseau est revenu.
      </p>
      <Link
        href="/admin"
        className="gold-gradient mt-8 rounded-full px-7 py-3 font-serif text-base text-noir"
      >
        Réessayer
      </Link>
    </main>
  );
}
