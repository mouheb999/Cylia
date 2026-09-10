"use client";

import Image, { type StaticImageData } from "next/image";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useEdition, type TypeChamp } from "./ContexteEdition";

/**
 * Enveloppe cliquable du mode édition.
 *
 * `span role="button"` et non `<button>` : ces blocs vivent parfois à
 * l'intérieur d'un lien (le logo, le bouton « Réserver »), et un bouton dans
 * un lien est du HTML invalide que les navigateurs réparent chacun à leur
 * façon. Le `preventDefault` empêche le lien de partir sous le doigt.
 */
function proprietesEdition(onOuvrir: () => void) {
  function declencher(evenement: MouseEvent | KeyboardEvent) {
    evenement.preventDefault();
    evenement.stopPropagation();
    onOuvrir();
  }
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: declencher,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") declencher(e);
    },
  };
}

const CONTOUR =
  "cursor-pointer rounded-sm outline-dashed outline-1 outline-offset-[3px] outline-gold/70 " +
  "transition-colors hover:bg-gold/10";

type Balise = "span" | "p" | "h1" | "h2" | "h3" | "div";

export function Texte({
  cle,
  defaut,
  titre,
  type = "texte",
  balise: Balise = "span",
  className = "",
}: {
  cle: string;
  defaut: string;
  /** Nom du bloc dans la feuille d'édition, ex. « Titre du bandeau ». */
  titre: string;
  type?: Exclude<TypeChamp, "image">;
  balise?: Balise;
  className?: string;
}) {
  const edition = useEdition();
  const valeur = edition.valeur(cle, defaut);

  if (!edition.actif) {
    return <Balise className={className}>{valeur}</Balise>;
  }

  return (
    <Balise
      className={`${className} ${CONTOUR}`}
      aria-label={`Modifier : ${titre}`}
      {...proprietesEdition(() => edition.ouvrir({ cle, defaut, titre, type }))}
    >
      {valeur}
    </Balise>
  );
}

export function ImageModifiable({
  cle,
  titre,
  defaut,
  alt,
  dossier = "site",
  conteneur = "",
  className = "",
  sizes = "100vw",
  priority = false,
}: {
  cle: string;
  titre: string;
  defaut: StaticImageData;
  alt: string;
  dossier?: string;
  /** Classes du cadre — doit porter une taille et `relative`. */
  conteneur?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const edition = useEdition();
  const url = edition.valeur(cle, "");

  const photo = url ? (
    <Image src={url} alt={alt} fill sizes={sizes} priority={priority} className={className} />
  ) : (
    <Image
      src={defaut}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      className={className}
    />
  );

  // Le cadre ne capte jamais les clics : sur l'encart d'accueil il recouvre un
  // lien, qui doit rester cliquable. C'est le voile d'édition, lui seul, qui
  // devient cliquable — et il passe au-dessus sans recouvrir le dégradé ni le
  // texte tant que le mode est éteint, puisqu'il n'existe pas.
  return (
    <div className={`${conteneur} pointer-events-none`}>
      {photo}
      {edition.actif && (
        <span
          className={`pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-noir/45 ${CONTOUR}`}
          aria-label={`Changer la photo : ${titre}`}
          {...proprietesEdition(() =>
            edition.ouvrir({ cle, defaut: "", titre, type: "image", dossier }),
          )}
        >
          <span className="gold-gradient rounded-full px-4 py-2 text-xs font-medium tracking-wide text-noir">
            Changer la photo
          </span>
        </span>
      )}
    </div>
  );
}

/** Signale une zone gérée ailleurs (galerie, prestations, produits). */
export function ZoneEditable({
  titre,
  actions,
  children,
}: {
  titre: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const edition = useEdition();
  if (!edition.actif) return <>{children}</>;

  return (
    <div className="relative rounded-2xl outline-dashed outline-1 outline-offset-4 outline-gold/40">
      <p className="absolute -top-2.5 left-3 z-10 rounded-full bg-gold px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-noir">
        {titre}
      </p>
      {children}
      {actions && <div className="px-4 pb-4 pt-1">{actions}</div>}
    </div>
  );
}
