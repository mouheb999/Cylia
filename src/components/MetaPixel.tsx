"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { track } from "@/lib/fbq";
import { ID_PIXEL } from "@/lib/meta/track";

/**
 * Une navigation interne ne recharge pas la page : sans ceci, passer de
 * l'accueil à « Réserver » ne compterait pour aucune vue.
 *
 * Le premier rendu est déjà couvert par le `fbq('track', 'PageView')` du code
 * de base, d'où la comparaison à l'adresse déjà mesurée plutôt qu'un simple
 * drapeau — elle tient aussi face au double montage du mode strict, en
 * développement.
 *
 * Les paramètres comptent : `/boutique?famille=masque` est une autre vue que
 * `/boutique`, et c'est par eux que les publicités font arriver (`fbclid`).
 */
function VuesDeNavigation() {
  const chemin = usePathname();
  const recherche = useSearchParams().toString();
  const adresse = recherche ? `${chemin}?${recherche}` : chemin;
  const adresseMesuree = useRef(adresse);

  useEffect(() => {
    if (adresseMesuree.current === adresse) return;
    adresseMesuree.current = adresse;
    track("PageView");
  }, [adresse]);

  return null;
}

/**
 * Pixel Meta, posé une seule fois pour tout le site (dans `app/layout.tsx`).
 *
 * Le code de base est celui fourni par Meta, mot pour mot : il se protège
 * lui-même d'une double exécution (`if (f.fbq) return`), et `next/script` ne
 * l'insère de toute façon qu'une fois grâce à son `id`.
 *
 * `afterInteractive` plutôt que `beforeInteractive` : la mesure n'a aucune
 * raison de passer avant l'affichage du salon. Les évènements de la boutique
 * attendent son arrivée — voir `lib/meta/track.ts`.
 */
export default function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${ID_PIXEL}');
fbq('track', 'PageView');`}
      </Script>

      {/* `useSearchParams` suspend le rendu : la limite reste ici, sans rien afficher. */}
      <Suspense fallback={null}>
        <VuesDeNavigation />
      </Suspense>

      {/*
        Repli sans JavaScript. Écrit en HTML brut : le navigateur ne lit le
        contenu d'un `noscript` que comme du texte quand les scripts tournent,
        et React n'a alors rien à réhydrater — donc aucun avertissement.
      */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${ID_PIXEL}&ev=PageView&noscript=1" />`,
        }}
      />
    </>
  );
}
