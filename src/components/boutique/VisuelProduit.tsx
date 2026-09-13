import Image from "next/image";

/**
 * Visuel d'un produit.
 *
 * Les photos du catalogue sont des packshots **détourés** : le flacon est seul,
 * sur du transparent. Posées sur un fond noir, elles donnaient un carré sombre
 * par produit — et `object-cover` recadrait au passage des images qui ne sont
 * pas carrées, coupant le bouchon ou l'étiquette. D'où le fond clair et
 * `object-contain` : le flacon tient entier dans sa vignette, comme sur un
 * présentoir.
 *
 * Sans photo, plutôt qu'un rectangle vide ou une icône d'image cassée, on
 * dessine l'initiale du produit en doré. La vitrine reste présentable le temps
 * que le salon photographie ses flacons, et l'absence de photo ne ressemble pas
 * à une panne.
 */
export default function VisuelProduit({
  nom,
  marque,
  url,
  sizes = "50vw",
  padding = "p-4",
  compact = false,
  className = "",
}: {
  nom: string;
  marque?: string;
  url: string | null;
  sizes?: string;
  /** Marge autour du flacon : à ajuster à la taille de la vignette. */
  padding?: string;
  /** Vignette de quelques dizaines de pixels : initiale plus petite, sans marque. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-b from-cream to-white ${className}`}>
      {url ? (
        <Image src={url} alt={nom} fill sizes={sizes} className={`object-contain ${padding}`} />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full flex-col items-center justify-center"
        >
          <span
            className={`font-script text-gold-deep/70 ${compact ? "text-2xl" : "text-5xl"}`}
          >
            {nom.trim().charAt(0) || "C"}
          </span>
          {marque && !compact && (
            <span className="mt-1 text-[0.55rem] uppercase tracking-[0.25em] text-muted/70">
              {marque}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
