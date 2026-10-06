import type { ReactNode } from "react";
import Link from "next/link";
import PhotoDistante from "@/components/PhotoDistante";
import { IconArrow } from "@/components/Icons";

/**
 * Une grande carte photo, titre posé sur l'image.
 *
 * C'est la porte d'entrée des packs : sur l'accueil, la carte « Nos packs » ;
 * sur `/packs`, une carte par catégorie. Une seule photo pleine largeur se lit
 * d'un coup d'œil, là où une grille de petites vignettes demandait de
 * parcourir.
 */
export default function GrandeCarte({
  href,
  titre,
  alt,
  texte,
  image,
  mention,
  priority = false,
}: {
  href: string;
  titre: ReactNode;
  /** Texte de la photo — le titre, en clair. */
  alt: string;
  texte?: string;
  image: string | null;
  /** Petite ligne au-dessus du titre — « 4 packs ». */
  mention?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className="press relative block aspect-[4/3] overflow-hidden rounded-3xl bg-noir shadow-[0_6px_24px_rgba(42,37,33,0.12)] sm:aspect-[16/9]"
    >
      <PhotoDistante
        src={image ?? ""}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, 640px"
        className="object-cover"
        repli={
          <span
            aria-hidden="true"
            className="flex h-full items-center justify-center font-script text-6xl text-gold/50"
          >
            {alt.trim().charAt(0) || "C"}
          </span>
        }
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-noir/85 via-noir/25 to-transparent"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-5">
        <span className="min-w-0 flex-1">
          {mention && (
            <span className="block text-[0.65rem] uppercase tracking-[0.25em] text-gold">
              {mention}
            </span>
          )}
          <span className="mt-1 block font-serif text-[1.7rem] font-light leading-tight text-cream">
            {titre}
          </span>
          {texte && (
            <span className="mt-1 line-clamp-2 block text-[0.8rem] font-light leading-snug text-white/75">
              {texte}
            </span>
          )}
        </span>
        <span className="gold-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-noir">
          <IconArrow className="h-4 w-4" />
        </span>
      </span>
    </Link>
  );
}
