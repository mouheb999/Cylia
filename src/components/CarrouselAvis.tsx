"use client";

import { useEffect, useRef, useState } from "react";
import type { Avis } from "@/lib/avis";

/** Temps qu'un avis reste en tête de rangée avant que le suivant glisse. */
const DUREE_AVIS = 6000;

function Etoiles() {
  return (
    <span className="flex gap-0.5 text-gold" aria-label="5 étoiles sur 5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7L10 1.6z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Les avis, en rangée qui glisse d'elle-même.
 *
 * Toutes les six secondes, la rangée avance d'une carte — doucement, et
 * seulement tant que la section est à l'écran et l'onglet regardé. Dès que la
 * cliente pose le doigt ou la souris dessus, la rangée lui appartient : le
 * défilement automatique s'arrête pour de bon, il ne reprend pas sous sa main.
 *
 * Quand le système demande moins d'animations, rien ne bouge seul : c'est une
 * rangée ordinaire, qu'on fait défiler soi-même.
 */
export default function CarrouselAvis({ avis }: { avis: Avis[] }) {
  const rangee = useRef<HTMLUListElement>(null);
  const [courant, setCourant] = useState(0);
  const [touche, setTouche] = useState(false);

  // La minuterie lit la carte courante sans redémarrer à chaque défilement.
  const courantRef = useRef(courant);
  useEffect(() => {
    courantRef.current = courant;
  }, [courant]);

  // La pastille suit la carte la plus proche du bord gauche, quel que soit
  // ce qui a fait défiler : le doigt ou la minuterie.
  useEffect(() => {
    const zone = rangee.current;
    if (!zone) return;
    function suivre() {
      const cartes = Array.from(zone!.children) as HTMLElement[];
      const depart = zone!.scrollLeft + cartes[0].offsetLeft;
      let proche = 0;
      cartes.forEach((carte, index) => {
        if (Math.abs(carte.offsetLeft - depart) < Math.abs(cartes[proche].offsetLeft - depart)) {
          proche = index;
        }
      });
      // En bout de rangée, la dernière carte ne peut plus venir à gauche.
      if (zone!.scrollLeft + zone!.clientWidth >= zone!.scrollWidth - 4) proche = cartes.length - 1;
      setCourant(proche);
    }
    zone.addEventListener("scroll", suivre, { passive: true });
    return () => zone.removeEventListener("scroll", suivre);
  }, []);

  useEffect(() => {
    const zone = rangee.current;
    if (!zone || touche || avis.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        visible = entree.isIntersecting;
      },
      { threshold: 0.5 },
    );
    observateur.observe(zone);

    const minuteur = setInterval(() => {
      if (!visible || document.visibilityState !== "visible") return;
      const cartes = Array.from(zone.children) as HTMLElement[];
      const finie = zone.scrollLeft + zone.clientWidth >= zone.scrollWidth - 4;
      const cible = finie ? cartes[0] : cartes[Math.min(courantRef.current + 1, cartes.length - 1)];
      // `scrollTo` sur la rangée, jamais `scrollIntoView` : celui-ci ferait
      // aussi défiler la page verticalement, sous les yeux de la cliente.
      zone.scrollTo({ left: cible.offsetLeft - cartes[0].offsetLeft, behavior: "smooth" });
    }, DUREE_AVIS);

    return () => {
      clearInterval(minuteur);
      observateur.disconnect();
    };
  }, [touche, avis.length]);

  function allerA(index: number) {
    const zone = rangee.current;
    if (!zone) return;
    setTouche(true);
    const cartes = Array.from(zone.children) as HTMLElement[];
    zone.scrollTo({ left: cartes[index].offsetLeft - cartes[0].offsetLeft, behavior: "smooth" });
  }

  const prendreLaMain = () => setTouche(true);

  return (
    <>
      <ul
        ref={rangee}
        tabIndex={0}
        role="region"
        aria-label="Avis de nos clientes, à faire défiler sur le côté"
        onPointerDown={prendreLaMain}
        onWheel={prendreLaMain}
        onKeyDown={prendreLaMain}
        // Même rangée que l'encart boutique : `scroll-px-4` garde la première
        // carte alignée sur le titre au-dessus. `relative` fait de la rangée
        // le repère des `offsetLeft` lus plus haut.
        className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2
          [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {avis.map((un) => (
          <li
            key={un.nom}
            className="flex w-[17rem] shrink-0 snap-start flex-col rounded-2xl border border-sand bg-white px-5 pb-5 pt-4 shadow-[0_8px_24px_-18px_rgba(42,37,33,0.35)]"
          >
            <div className="flex items-center justify-between">
              <Etoiles />
              <span
                aria-hidden="true"
                className="font-serif text-5xl leading-none text-gold-light"
              >
                &rdquo;
              </span>
            </div>

            <blockquote className="mt-1 flex-1 text-[0.82rem] font-light leading-relaxed text-ink">
              {un.texte}
            </blockquote>

            <div className="mt-4 flex items-center gap-3 border-t border-sand pt-3.5">
              <span
                aria-hidden="true"
                className="gold-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-base text-noir"
              >
                {un.nom.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="font-serif text-[1.05rem] leading-tight text-ink">{un.nom}</p>
                {un.soins && (
                  <p className="truncate text-[0.6rem] uppercase tracking-[0.18em] text-muted">
                    {un.soins}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {avis.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {avis.map((un, index) => (
            <button
              key={un.nom}
              type="button"
              onClick={() => allerA(index)}
              aria-label={`Voir l'avis ${index + 1} sur ${avis.length}`}
              aria-current={index === courant}
              className="flex h-6 items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ease-out ${
                  index === courant ? "w-5 bg-gold-deep" : "w-1.5 bg-gold-deep/25"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
