"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { track } from "@/lib/fbq";

/**
 * Identifiant du pixel du salon (Events Manager → « cylia »).
 *
 * La variable d'environnement permet d'en viser un autre — un pixel de test,
 * par exemple — sans redéploiement de code ; sans elle, c'est celui du salon.
 */
const ID_PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID || "4465663150349853";

/**
 * Pixel Meta, posé une seule fois pour tout le site.
 *
 * Le code de base est celui fourni par Meta, mot pour mot : il se protège
 * lui-même d'une double exécution (`if (f.fbq) return`), et `next/script` ne
 * l'insère de toute façon qu'une fois grâce à son `id`.
 *
 * `afterInteractive` plutôt que `beforeInteractive` : la mesure n'a aucune
 * raison de passer avant l'affichage du salon.
 */
export default function MetaPixel() {
  const chemin = usePathname();
  const cheminMesure = useRef(chemin);

  /*
   * Une navigation interne ne recharge pas la page : sans ceci, passer de
   * l'accueil à « Réserver » ne compterait pour aucune vue. Le premier rendu
   * est déjà couvert par le `fbq('track', 'PageView')` du code de base, d'où
   * la comparaison au chemin déjà mesuré plutôt qu'un simple drapeau — elle
   * tient aussi face au double montage du mode strict, en développement.
   */
  useEffect(() => {
    if (cheminMesure.current === chemin) return;
    cheminMesure.current = chemin;
    track("PageView");
  }, [chemin]);

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
